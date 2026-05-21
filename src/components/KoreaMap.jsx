import { useState, useEffect, useRef } from 'react'
import { SVG_TO_REGION } from '../utils/regions'

const _cnt = {}
Object.values(SVG_TO_REGION).forEach(id => { _cnt[id] = (_cnt[id] || 0) + 1 })
const MERGED_IDS = new Set(Object.entries(_cnt).filter(([, c]) => c > 1).map(([id]) => id))

const FILTER_ID = 'region-border-filter'
const COLOR_VISITED = '#FF8FAB'
const COLOR_UNVISITED = '#EAEAEA'
const COLOR_PREVIEW = '#FF9EC0'
const COLOR_HIGHLIGHT_VISITED = '#FFBC00'

const visitedColor = (count) => {
  if (count >= 4) return '#C23558'
  if (count === 3) return '#DC4F70'
  if (count === 2) return '#F06A8C'
  return COLOR_VISITED
}

const VB_X = 65        // left edge: clips leftmost Sinan islands
const VB_W = 530       // width: right edge = 595 (zoomed in ~6% vs 562)
const VB_TOP_Y = 40    // top of viewBox — pins 강원 고성군 (min y≈44) near top of map area

export default function KoreaMap({ visitedRegions = [], highlightedRegion, recordCounts = {}, onRegionClick, dataLoaded = true, regionPhotos = {}, showPhotoMap = true }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const onClickRef = useRef(onRegionClick)
  const prevVisitedRef = useRef([])
  const [ready, setReady] = useState(false)
  const [colored, setColored] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [layoutReady, setLayoutReady] = useState(false)
  const [layoutVersion, setLayoutVersion] = useState(0)
  const resetFnRef = useRef(null)
  const photoOverlayRef = useRef(null)
  const svgCentersRef = useRef({})
  const cachedCWRef = useRef(0)
  const transformRef = useRef({ s: 1, tx: 0, ty: 0 })

  useEffect(() => { onClickRef.current = onRegionClick })

  useEffect(() => {
    let cancelled = false
    fetch('/skorea-municipalities-2011.svg')
      .then(r => r.text())
      .then(text => {
        if (cancelled) return
        const div = containerRef.current
        if (!div) return
        div.innerHTML = text.replace(/^[\s\S]*?(?=<svg[\s>])/i, '')
        const svg = div.querySelector('svg')
        if (!svg) return
        svgRef.current = svg
        requestAnimationFrame(() => { if (!cancelled) setReady(true) })
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready) return
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    svg.style.cssText = 'display:block;border:0 none;outline:none;box-shadow:none;will-change:transform;transform-origin:0 0;'
    container.style.overflow = 'hidden'
    svg.querySelector('#qgisviewbox')?.remove()

    // Ulleung: translate(-130) keeps it within the tighter right edge (VB_X+VB_W=595)
    const ulleung = svg.querySelector('#skorea-municipalities-2011_25')
    if (ulleung) ulleung.setAttribute('transform', 'translate(-130, 0)')

    // Dokdo: two island shapes (서도 + 동도) slightly below Ulleung
    if (ulleung && !svg.querySelector('#dokdo-group')) {
      const bbox = ulleung.getBBox()
      const cx = bbox.x - 130 + bbox.width / 2 + 6
      const cy = bbox.y + bbox.height + 12

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.id = 'dokdo-group'
      group.setAttribute('filter', `url(#${FILTER_ID})`)
      group.style.cursor = 'pointer'
      group.onclick = () => onClickRef.current?.('252')

      const mkPoly = (offsets) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        el.setAttribute('points', offsets.map(([dx, dy]) => `${cx+dx},${cy+dy}`).join(' '))
        el.setAttribute('fill', COLOR_UNVISITED)
        el.setAttribute('stroke', COLOR_UNVISITED)
        el.setAttribute('stroke-width', '0.5')
        return el
      }

      // 서도 — 불규칙한 섬 모양
      group.appendChild(mkPoly([
        [-3.0,-4.5], [-1.2,-3.8], [-0.2,-2.2], [-0.8,-0.8],
        [ 0.2, 0.6], [-0.5, 2.0], [-1.8, 3.5], [-3.2, 4.2],
        [-5.0, 3.6], [-6.4, 2.0], [-6.8, 0.2], [-6.0,-1.5],
        [-5.8,-3.0], [-4.8,-4.2], [-3.8,-4.8],
      ]))

      svg.appendChild(group)
    }

    if (!svg.querySelector(`#${FILTER_ID}`)) {
      let defs = svg.querySelector('defs')
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        svg.insertBefore(defs, svg.firstChild)
      }
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      filter.setAttribute('id', FILTER_ID)
      filter.setAttribute('x', '-15%'); filter.setAttribute('y', '-15%')
      filter.setAttribute('width', '130%'); filter.setAttribute('height', '130%')
      const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow')
      shadow.setAttribute('dx', '0'); shadow.setAttribute('dy', '0')
      shadow.setAttribute('stdDeviation', '1.0')
      shadow.setAttribute('flood-color', '#888888')
      shadow.setAttribute('flood-opacity', '1')
      filter.appendChild(shadow)
      defs.appendChild(filter)
    }

    if (!svg.querySelector('style[data-map-sw]')) {
      let defs = svg.querySelector('defs')
      if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.insertBefore(defs, svg.firstChild) }
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style')
      styleEl.setAttribute('data-map-sw', '1')
      styleEl.textContent = 'path { stroke-width: var(--map-sw, 1.5); }'
      defs.appendChild(styleEl)
    }

    // viewBox: top anchored so 강원 고성군 is just below the search bar
    const vb = { x: VB_X, y: VB_TOP_Y, w: VB_W }
    let wasZoomed = false
    let cachedShadow = null
    let cachedCW = 0
    let cachedCH = 0
    let viewBoxCW = 0  // 마지막으로 viewBox 설정 시 사용한 너비

    const applyTransform = (skipHeavy = false) => {
      if (!cachedCW) return
      const s = VB_W / vb.w
      const tx = -(vb.x - VB_X) * cachedCW / vb.w
      const ty = -(vb.y - VB_TOP_Y) * cachedCW / vb.w
      svg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
      const mapScale = cachedCW / VB_W
      transformRef.current = { s, tx, ty }
      // 오버레이 컨테이너에 SVG와 동일 transform, 썸네일은 역스케일로 고정 크기 유지
      const overlay = photoOverlayRef.current
      if (overlay) {
        overlay.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
        if (overlay.children.length) {
          const invS = (1 / s).toFixed(4)
          for (const el of overlay.children) {
            el.style.transform = `scale(${invS})`
          }
        }
      }
      if (!skipHeavy) {
        if (!cachedShadow) cachedShadow = svg.querySelector(`#${FILTER_ID} feDropShadow`)
        if (cachedShadow) cachedShadow.setAttribute('stdDeviation', Math.max(0.35, 1.0 / s).toFixed(3))
        svg.style.setProperty('--map-sw', (1.5 / s).toFixed(4))
      }
      const nowZoomed = vb.w < VB_W - 0.1
      if (nowZoomed !== wasZoomed) { wasZoomed = nowZoomed; setIsZoomed(nowZoomed) }
    }

    const applyLayout = () => {
      cachedCW = container.clientWidth
      cachedCH = container.clientHeight
      if (!cachedCW || !cachedCH) return
      cachedCWRef.current = cachedCW
      setLayoutReady(true)
      svg.setAttribute('width', cachedCW)
      svg.setAttribute('height', cachedCH)
      svg.style.width = cachedCW + 'px'
      svg.style.height = cachedCH + 'px'
      // 너비가 바뀔 때만 viewBox 재계산 — 높이만 변하는 경우(iOS 주소창 등) 제외
      if (cachedCW !== viewBoxCW) {
        viewBoxCW = cachedCW
        setLayoutVersion(v => v + 1)
        const vbH = Math.ceil(cachedCH * VB_W / cachedCW)
        svg.setAttribute('viewBox', `${VB_X} ${VB_TOP_Y} ${VB_W} ${vbH}`)
      }
      applyTransform()
    }

    let resizeDebounce = null
    const ro = new ResizeObserver(() => {
      if (!cachedCW || !cachedCH) {
        applyLayout()
      } else {
        clearTimeout(resizeDebounce)
        resizeDebounce = setTimeout(applyLayout, 120)
      }
    })
    ro.observe(container)
    applyLayout()
    resetFnRef.current = () => { vb.x = VB_X; vb.y = VB_TOP_Y; vb.w = VB_W; applyTransform() }

    const regionMap = {}
    for (let i = 1; i <= 251; i++) {
      const g = svg.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue
      const id = SVG_TO_REGION[String(i)]
      if (!id) continue
      if (!regionMap[id]) regionMap[id] = []
      regionMap[id].push(g)
    }

    for (const [id, groups] of Object.entries(regionMap)) {
      if (groups.length <= 1) continue
      if (svg.querySelector(`[data-region="${id}"]`)) continue
      const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      wrapper.setAttribute('data-region', id)
      wrapper.setAttribute('filter', `url(#${FILTER_ID})`)
      groups[0].parentNode.insertBefore(wrapper, groups[0])
      groups.forEach(g => wrapper.appendChild(g))
    }

    for (let i = 1; i <= 251; i++) {
      const g = svg.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue
      const regionId = SVG_TO_REGION[String(i)]
      if (!(regionId && MERGED_IDS.has(regionId))) {
        g.setAttribute('filter', `url(#${FILTER_ID})`)
      }
      g.style.cursor = 'pointer'
      g.onclick = () => onClickRef.current?.(String(i))
    }

    // 각 지역 SVG 중심 좌표 계산 (사진 오버레이용)
    const seenRegions = new Set()
    for (let i = 1; i <= 251; i++) {
      const g = svg.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue
      const regionId = SVG_TO_REGION[String(i)]
      if (!regionId || seenRegions.has(regionId)) continue
      seenRegions.add(regionId)
      const el = svg.querySelector(`[data-region="${regionId}"]`) || g
      try {
        const b = el.getBBox()
        svgCentersRef.current[regionId] = { cx: b.x + b.width / 2, cy: b.y + b.height / 2 }
      } catch (_) {}
    }

    const MIN_W = VB_W / 4
    const MAX_W = VB_W
    let touchData = null
    let hasDragged = false
    let lastTouchVel = { x: 0, y: 0 }
    let lastMoveTime = 0
    let lastMoveX = 0
    let lastMoveY = 0
    let inertiaId = null

    const clampVB = (cw, ch) => {
      const vbH = vb.w / cw * ch
      const origVBH = VB_W / cw * ch
      vb.x = Math.max(VB_X, Math.min(VB_X + VB_W - vb.w, vb.x))
      vb.y = Math.max(VB_TOP_Y, Math.min(VB_TOP_Y + origVBH - vbH, vb.y))
    }

    const getTouchDist = (t1, t2) => {
      const dx = t2.clientX - t1.clientX
      const dy = t2.clientY - t1.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const onTouchStart = (e) => {
      hasDragged = false
      if (inertiaId) { cancelAnimationFrame(inertiaId); inertiaId = null }
      lastTouchVel = { x: 0, y: 0 }
      if (e.touches.length === 1) {
        touchData = { type: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, startVBX: vb.x, startVBY: vb.y }
      } else if (e.touches.length >= 2) {
        touchData = { type: 'pinch', startDist: getTouchDist(e.touches[0], e.touches[1]), startMidX: (e.touches[0].clientX + e.touches[1].clientX) / 2, startMidY: (e.touches[0].clientY + e.touches[1].clientY) / 2, startVBX: vb.x, startVBY: vb.y, startVBW: vb.w }
      }
    }

    const onTouchMove = (e) => {
      if (!touchData) return
      const cw = cachedCW
      const ch = cachedCH
      if (!cw || !ch) return

      if (touchData.type === 'pan' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchData.startX
        const dy = e.touches[0].clientY - touchData.startY
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          e.preventDefault()
          hasDragged = true
          const scale = vb.w / cw
          vb.x = touchData.startVBX - dx * scale
          vb.y = touchData.startVBY - dy * scale
          clampVB(cw, ch)
          applyTransform(true)
          const now = performance.now()
          const dt = now - lastMoveTime
          if (dt > 0 && dt < 80) {
            lastTouchVel.x = -(e.touches[0].clientX - lastMoveX) / dt * scale
            lastTouchVel.y = -(e.touches[0].clientY - lastMoveY) / dt * scale
          }
          lastMoveTime = now
          lastMoveX = e.touches[0].clientX
          lastMoveY = e.touches[0].clientY
        }
      } else if (touchData.type === 'pinch' && e.touches.length >= 2) {
        e.preventDefault()
        hasDragged = true
        const newDist = getTouchDist(e.touches[0], e.touches[1])
        if (newDist < 1) return
        const newW = Math.max(MIN_W, Math.min(MAX_W, touchData.startVBW * touchData.startDist / newDist))
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const startVBH = ch * touchData.startVBW / cw
        const midVBX = touchData.startVBX + (midX / cw) * touchData.startVBW
        const midVBY = touchData.startVBY + (midY / ch) * startVBH
        const newVBH = ch * newW / cw
        vb.x = midVBX - (midX / cw) * newW
        vb.y = midVBY - (midY / ch) * newVBH
        vb.w = newW
        clampVB(cw, ch)
        applyTransform(true)
      }
    }

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        if (hasDragged && touchData?.type === 'pan') {
          let lastInertiaTime = null
          const step = (now) => {
            const dt = lastInertiaTime ? Math.min(now - lastInertiaTime, 32) : 16
            lastInertiaTime = now
            lastTouchVel.x *= 0.93
            lastTouchVel.y *= 0.93
            if (Math.abs(lastTouchVel.x) > 0.03 || Math.abs(lastTouchVel.y) > 0.03) {
              vb.x += lastTouchVel.x * dt
              vb.y += lastTouchVel.y * dt
              clampVB(cachedCW, cachedCH)
              applyTransform(true)
              inertiaId = requestAnimationFrame(step)
            } else {
              applyTransform()
              inertiaId = null
            }
          }
          inertiaId = requestAnimationFrame(step)
        } else {
          applyTransform()
        }
        touchData = null
      } else if (e.touches.length === 1 && touchData?.type === 'pinch') {
        touchData = { type: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, startVBX: vb.x, startVBY: vb.y }
      }
    }

    const onClickCapture = (e) => {
      if (hasDragged) {
        e.stopPropagation()
        e.preventDefault()
        hasDragged = false
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('click', onClickCapture, { capture: true })

    return () => {
      ro.disconnect()
      clearTimeout(resizeDebounce)
      if (inertiaId) cancelAnimationFrame(inertiaId)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('click', onClickCapture, { capture: true })
    }
  }, [ready])

  // 사진 오버레이 렌더링
  useEffect(() => {
    if (!ready || !layoutReady || !photoOverlayRef.current) return
    const overlay = photoOverlayRef.current
    overlay.innerHTML = ''

    const mapScale = cachedCWRef.current / VB_W
    const { s: curS, tx, ty } = transformRef.current

    for (const [regionId, photoURL] of Object.entries(regionPhotos)) {
      const center = svgCentersRef.current[regionId]
      if (!center || !mapScale) continue

      const pxX = Math.round((center.cx - VB_X) * mapScale)
      const pxY = Math.round((center.cy - VB_TOP_Y) * mapScale)
      const count = recordCounts[regionId] || 0

      const wrap = document.createElement('div')
      wrap.style.cssText = `position:absolute;left:${pxX - 28}px;top:${pxY - 66}px;width:56px;height:66px;pointer-events:none;transform:scale(${(1 / curS).toFixed(4)});transform-origin:50% 100%;`

      const frame = document.createElement('div')
      frame.style.cssText = `width:56px;height:56px;background:white;padding:2px;border-radius:7px;overflow:hidden;box-sizing:border-box;box-shadow:0 3px 10px rgba(0,0,0,0.22),0 1px 3px rgba(0,0,0,0.12);`

      const img = document.createElement('img')
      img.src = photoURL
      img.style.cssText = `width:100%;height:100%;object-fit:cover;display:block;border-radius:5px;`
      img.onerror = () => { wrap.style.display = 'none' }

      const tri = document.createElement('div')
      tri.style.cssText = `width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid white;margin-left:20px;`

      frame.appendChild(img)
      wrap.appendChild(frame)
      wrap.appendChild(tri)

      if (count > 1) {
        const badge = document.createElement('div')
        badge.style.cssText = `position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;border-radius:9px;background:#FF8FAB;color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px;box-shadow:0 1px 4px rgba(0,0,0,0.2);`
        badge.textContent = count > 99 ? '99+' : String(count)
        wrap.appendChild(badge)
      }

      overlay.appendChild(wrap)
    }

    overlay.style.transformOrigin = '0 0'
    overlay.style.transform = `translate(${tx}px,${ty}px) scale(${curS})`
  }, [ready, layoutReady, layoutVersion, regionPhotos, recordCounts])

  useEffect(() => {
    if (!ready) return
    const svg = svgRef.current
    if (!svg) return

    const visitedIds = new Set()
    visitedRegions.forEach(n => {
      const id = SVG_TO_REGION[n]
      if (id) visitedIds.add(id)
    })

    const highlightedId = highlightedRegion ? SVG_TO_REGION[highlightedRegion] : null

    for (let i = 1; i <= 251; i++) {
      const g = svg.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue
      const regionId = SVG_TO_REGION[String(i)]
      const isVisited = regionId ? visitedIds.has(regionId) : visitedRegions.includes(String(i))
      const isHighlighted = !!(highlightedId && regionId === highlightedId)
      const fill = isHighlighted
        ? (isVisited ? COLOR_HIGHLIGHT_VISITED : COLOR_PREVIEW)
        : isVisited ? visitedColor(recordCounts[regionId] || 0) : COLOR_UNVISITED
      g.querySelectorAll('path').forEach(path => {
        path.setAttribute('fill', fill)
        path.setAttribute('stroke', fill)
        path.setAttribute('stroke-width', '1.5')
        path.setAttribute('stroke-linejoin', 'round')
        path.setAttribute('stroke-linecap', 'round')
        path.setAttribute('vector-effect', 'non-scaling-stroke')
      })
      g.style.filter = isHighlighted
        ? (isVisited ? 'drop-shadow(0 0 5px rgba(255,188,0,0.9))' : 'drop-shadow(0 0 4px rgba(255,123,169,0.75))')
        : ''
    }

    // Color Dokdo islands
    const dokdoGroup = svg.querySelector('#dokdo-group')
    if (dokdoGroup) {
      const isDockedVisited = visitedIds.has('dokdo')
      const isDockedHighlighted = highlightedId === 'dokdo'
      const dokdoFill = isDockedHighlighted
        ? (isDockedVisited ? COLOR_HIGHLIGHT_VISITED : COLOR_PREVIEW)
        : isDockedVisited ? visitedColor(recordCounts['dokdo'] || 0) : COLOR_UNVISITED
      dokdoGroup.querySelectorAll('polygon').forEach(p => {
        p.setAttribute('fill', dokdoFill)
        p.setAttribute('stroke', dokdoFill)
        p.setAttribute('vector-effect', 'non-scaling-stroke')
      })
    }

    // 새로 색칠된 지역 "퐁!" 애니메이션
    const prevVisited = prevVisitedRef.current
    const newlyAdded = visitedRegions.filter(n => !prevVisited.includes(String(n)))
    prevVisitedRef.current = visitedRegions.map(String)
    const SPARKLE_DATA = [
      { dx:  0, dy: -13, char: '★', color: '#FFD85C' },
      { dx: 11, dy:  -7, char: '✦', color: '#FF7BA9' },
      { dx: 11, dy:   7, char: '★', color: '#8FE3CF' },
      { dx:  0, dy:  13, char: '✦', color: '#FFD85C' },
      { dx:-11, dy:   7, char: '★', color: '#FF7BA9' },
      { dx:-11, dy:  -7, char: '✦', color: '#8FE3CF' },
    ]
    newlyAdded.forEach(svgNum => {
      const g = svg.querySelector(`#skorea-municipalities-2011_${svgNum}`)
      if (!g) return
      g.style.transformBox = 'fill-box'
      g.style.transformOrigin = 'center'
      g.style.animation = 'regionPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
      setTimeout(() => { g.style.animation = '' }, 700)

      try {
        const bbox = g.getBBox()
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        SPARKLE_DATA.forEach(({ dx, dy, char, color }, si) => {
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          t.textContent = char
          t.setAttribute('x', cx); t.setAttribute('y', cy)
          t.setAttribute('font-size', '5')
          t.setAttribute('fill', color)
          t.setAttribute('text-anchor', 'middle')
          t.setAttribute('dominant-baseline', 'middle')
          const begin = `${si * 0.05}s`
          const mkAnim = (attr, from, to) => {
            const a = document.createElementNS('http://www.w3.org/2000/svg', 'animate')
            a.setAttribute('attributeName', attr)
            a.setAttribute('values', `${from};${to}`)
            a.setAttribute('dur', '0.6s'); a.setAttribute('begin', begin)
            a.setAttribute('fill', 'freeze')
            return a
          }
          t.appendChild(mkAnim('x', cx, cx + dx))
          t.appendChild(mkAnim('y', cy, cy + dy))
          t.appendChild(mkAnim('opacity', 1, 0))
          svg.appendChild(t)
          setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t) }, 900)
        })
      } catch (_) {}
    })

    if (!colored) setColored(true)
  }, [ready, visitedRegions, highlightedRegion, recordCounts]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: (colored && dataLoaded && layoutReady) ? 1 : 0,
          touchAction: 'none',
        }}
      />
      <div
        ref={photoOverlayRef}
        style={{
          position: 'absolute', inset: 0,
          overflow: 'hidden', pointerEvents: 'none',
          opacity: (colored && dataLoaded && layoutReady && showPhotoMap) ? 1 : 0,
        }}
      />
      {isZoomed && (
        <button
          onClick={() => resetFnRef.current?.()}
          style={{
            position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', right: 12, zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: '1.5px solid #FFD6E0',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, color: '#FF7BA9',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          전체 보기
        </button>
      )}
    </>
  )
}

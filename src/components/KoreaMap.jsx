import { useState, useEffect, useRef } from 'react'
import { SVG_TO_REGION, REGION_INFO, REGION_TO_SVG } from '../utils/regions'

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

// 새 SVG (800×760) 뷰포트 상수
// 울릉도·독도는 JS에서 translate(-120, 0) 적용해 동해안 바깥에 배치
const VB_X = 68           // 충북 옥천군이 가로 중앙 (옥천 center x=337.8, 337.8-270=67.8)
const VB_W = 540
const VB_TOP_Y = -8       // 강원 고성군 위 소폭 여백
const ULLEUNG_TX = -120   // 울릉도·독도 X 오프셋 (동해안 max x=536 바깥 배치)

// 방문 여부 판단: visitedRegions 배열은 구 SVG 번호("25") 또는 regionId 모두 허용
const toRegionId = (n) => SVG_TO_REGION[String(n)] || String(n)

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
  const svgCentersRef = useRef({})   // regionId → { cx, cy } (SVG 좌표계)
  const cachedCWRef = useRef(0)
  const transformRef = useRef({ s: 1, tx: 0, ty: 0 })

  useEffect(() => { onClickRef.current = onRegionClick })

  // ── SVG 로드 ──
  useEffect(() => {
    let cancelled = false
    fetch('/korea-map.svg')
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

  // ── SVG 초기화 (ready 후 1회) ──
  useEffect(() => {
    if (!ready) return
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    svg.style.cssText = 'display:block;border:0 none;outline:none;box-shadow:none;will-change:transform;transform-origin:0 0;'
    container.style.overflow = 'hidden'

    // 레이어 그룹 ID 정리
    const layer = svg.querySelector('#temp_combined_map')
    if (layer) layer.removeAttribute('id')

    // 울릉도·독도 translate (지도 오른쪽 여백 압축)
    // 울릉도: bbox 중심 기준 1.5배 확대
    const ULLEUNG_CX = 686.7   // 울릉도 bbox center x (원본 SVG 좌표)
    const ULLEUNG_CY = 148.2   // 울릉도 bbox center y
    const ulleung = svg.querySelector('#gyeongbuk_ulleung')
    if (ulleung) ulleung.setAttribute('transform',
      `translate(${ULLEUNG_CX + ULLEUNG_TX}, ${ULLEUNG_CY}) scale(1.5) translate(${-ULLEUNG_CX}, ${-ULLEUNG_CY})`
    )
    // 독도: bbox 중심 기준 2배 확대
    const DOKDO_CX = 712.7     // 독도 bbox center x (원본 SVG 좌표)
    const DOKDO_CY = 158.8     // 독도 bbox center y
    const dokdoEl = svg.querySelector('#dokdo')
    if (dokdoEl) dokdoEl.setAttribute('transform',
      `translate(${DOKDO_CX + ULLEUNG_TX}, ${DOKDO_CY}) scale(1.2) translate(${-DOKDO_CX}, ${-DOKDO_CY})`
    )

    // 스트로크 너비 CSS 변수
    if (!svg.querySelector('style[data-map-sw]')) {
      let defs = svg.querySelector('defs')
      if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.insertBefore(defs, svg.firstChild) }
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style')
      styleEl.setAttribute('data-map-sw', '1')
      styleEl.textContent = 'path { stroke-width: var(--map-sw, 1.2); }'
      defs.appendChild(styleEl)
    }

    // 각 지역 path: 필터·커서·클릭 이벤트 설정, 중심 좌표 계산
    for (const regionId of Object.keys(REGION_INFO)) {
      const el = svg.querySelector(`#${regionId}`)
      if (!el) continue
      el.style.cursor = 'pointer'
      // 클릭 시 기존 Firestore 호환을 위해 SVG 번호(또는 regionId 직접) 반환
      const clickVal = REGION_TO_SVG[regionId] || regionId
      el.onclick = () => onClickRef.current?.(clickVal)

      // 중심 좌표 계산 (사진 오버레이용)
      try {
        const b = el.getBBox()
        let cx = b.x + b.width / 2
        const cy = b.y + b.height / 2
        // 울릉도·독도는 translate 오프셋 반영
        if (regionId === 'gyeongbuk_ulleung' || regionId === 'dokdo') cx += ULLEUNG_TX
        svgCentersRef.current[regionId] = { cx, cy }
      } catch (_) {}
    }

    // ── 뷰포트/transform 관리 ──
    const vb = { x: VB_X, y: VB_TOP_Y, w: VB_W }
    let wasZoomed = false
    let cachedCW = 0
    let cachedCH = 0
    let viewBoxCW = 0

    const applyTransform = (skipHeavy = false) => {
      if (!cachedCW) return
      const s = VB_W / vb.w
      const tx = -(vb.x - VB_X) * cachedCW / vb.w
      const ty = -(vb.y - VB_TOP_Y) * cachedCW / vb.w
      svg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
      transformRef.current = { s, tx, ty }
      const overlay = photoOverlayRef.current
      if (overlay) {
        overlay.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
        if (overlay.children.length) {
          const invS = (1 / s).toFixed(4)
          for (const el of overlay.children) el.style.transform = `scale(${invS})`
        }
      }
      if (!skipHeavy) {
        svg.style.setProperty('--map-sw', (1.2 / s).toFixed(4))
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
      if (!cachedCW || !cachedCH) { applyLayout() }
      else {
        clearTimeout(resizeDebounce)
        resizeDebounce = setTimeout(applyLayout, 120)
      }
    })
    ro.observe(container)
    applyLayout()
    resetFnRef.current = () => { vb.x = VB_X; vb.y = VB_TOP_Y; vb.w = VB_W; applyTransform() }

    // ── 터치 줌/팬 ──
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
        const startVBH = cachedCH * touchData.startVBW / cw
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
      if (hasDragged) { e.stopPropagation(); e.preventDefault(); hasDragged = false }
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

  // ── 사진 오버레이 ──
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

  // ── 방문 지역 색칠 ──
  useEffect(() => {
    if (!ready) return
    const svg = svgRef.current
    if (!svg) return

    // visitedRegions: 구 SVG 번호 또는 regionId 모두 허용
    const visitedIds = new Set(visitedRegions.map(toRegionId))
    const highlightedId = highlightedRegion ? toRegionId(highlightedRegion) : null

    for (const regionId of Object.keys(REGION_INFO)) {
      const el = svg.querySelector(`#${regionId}`)
      if (!el) continue
      const isVisited = visitedIds.has(regionId)
      const isHighlighted = highlightedId === regionId
      const fill = isHighlighted
        ? (isVisited ? COLOR_HIGHLIGHT_VISITED : COLOR_PREVIEW)
        : isVisited ? visitedColor(recordCounts[regionId] || 0) : COLOR_UNVISITED
      el.setAttribute('fill', fill)
      el.setAttribute('stroke', '#6B6B6B')
      el.setAttribute('stroke-linejoin', 'round')
      el.setAttribute('stroke-linecap', 'round')
      el.setAttribute('vector-effect', 'non-scaling-stroke')
      el.style.filter = isHighlighted
        ? (isVisited ? 'drop-shadow(0 0 2px rgba(255,188,0,0.5))' : 'drop-shadow(0 0 2px rgba(255,123,169,0.4))')
        : ''
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

    newlyAdded.forEach(n => {
      const regionId = toRegionId(n)
      const el = svg.querySelector(`#${regionId}`)
      if (!el) return
      // 울릉도·독도는 SVG transform attribute로 위치를 잡기 때문에
      // CSS animation 적용 시 WebKit에서 transform이 충돌해 내륙으로 이동하는 버그 발생
      if (regionId !== 'gyeongbuk_ulleung' && regionId !== 'dokdo') {
        el.style.transformBox = 'fill-box'
        el.style.transformOrigin = 'center'
        el.style.animation = 'regionPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
        setTimeout(() => { el.style.animation = ''; el.style.transformBox = ''; el.style.transformOrigin = '' }, 700)
      }

      try {
        const bbox = el.getBBox()
        let cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        if (regionId === 'gyeongbuk_ulleung' || regionId === 'dokdo') cx += ULLEUNG_TX
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

import { useState, useEffect, useRef } from 'react'
import { SVG_TO_REGION } from '../utils/regions'

const _cnt = {}
Object.values(SVG_TO_REGION).forEach(id => { _cnt[id] = (_cnt[id] || 0) + 1 })
const MERGED_IDS = new Set(Object.entries(_cnt).filter(([, c]) => c > 1).map(([id]) => id))

const BORDER_SHADOW = 'drop-shadow(0 0 0.8px #777) drop-shadow(0 0 0.8px #777)'
const SEA_COLOR = '#b8d8e8'

export default function KoreaMap({ visitedRegions = [], onRegionClick }) {
  const [svgDoc, setSvgDoc] = useState(null)
  const objectRef = useRef(null)
  const onClickRef = useRef(onRegionClick)
  useEffect(() => { onClickRef.current = onRegionClick })

  useEffect(() => {
    const obj = objectRef.current
    if (!obj) return
    obj.onload = () => {
      const doc = obj.contentDocument
      if (doc) setSvgDoc(doc)
    }
  }, [])

  // 최초 1회: 바다 배경 + 래퍼 생성 + drop-shadow + 클릭 핸들러
  useEffect(() => {
    if (!svgDoc) return
    const svgEl = svgDoc.querySelector('svg')
    if (!svgEl) return
    svgEl.setAttribute('width', '100%')
    svgEl.setAttribute('height', 'auto')

    // 바다 색 배경 rect
    if (!svgDoc.querySelector('#sea-bg')) {
      const rect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.id = 'sea-bg'
      rect.setAttribute('x', '0')
      rect.setAttribute('y', '0')
      rect.setAttribute('width', '767')
      rect.setAttribute('height', '777')
      rect.setAttribute('fill', SEA_COLOR)
      svgEl.insertBefore(rect, svgEl.firstChild)
    }

    // regionId별 g 요소 수집
    const regionMap = {}
    for (let i = 1; i <= 251; i++) {
      const g = svgDoc.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue
      const id = SVG_TO_REGION[String(i)]
      if (!id) continue
      if (!regionMap[id]) regionMap[id] = []
      regionMap[id].push(g)
    }

    // 통합 지역: 래퍼 <g>로 묶고 drop-shadow 적용
    for (const [id, groups] of Object.entries(regionMap)) {
      if (groups.length <= 1) continue
      if (svgDoc.querySelector(`[data-region="${id}"]`)) continue
      const wrapper = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
      wrapper.setAttribute('data-region', id)
      wrapper.style.filter = BORDER_SHADOW
      groups[0].parentNode.insertBefore(wrapper, groups[0])
      groups.forEach(g => wrapper.appendChild(g))
    }

    // 일반 지역: 개별 <g>에 동일한 drop-shadow 적용
    for (let i = 1; i <= 251; i++) {
      const g = svgDoc.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue
      const regionId = SVG_TO_REGION[String(i)]
      const isMerged = regionId && MERGED_IDS.has(regionId)
      if (!isMerged) {
        g.style.filter = BORDER_SHADOW
      }
      g.style.cursor = 'pointer'
      g.onclick = () => onClickRef.current?.(String(i))
    }
  }, [svgDoc])

  // 색칠 업데이트
  useEffect(() => {
    if (!svgDoc) return

    const visitedIds = new Set()
    visitedRegions.forEach(svgNum => {
      const id = SVG_TO_REGION[svgNum]
      if (id) visitedIds.add(id)
    })

    for (let i = 1; i <= 251; i++) {
      const g = svgDoc.querySelector(`#skorea-municipalities-2011_${i}`)
      if (!g) continue

      const regionId = SVG_TO_REGION[String(i)]
      const isVisited = regionId ? visitedIds.has(regionId) : visitedRegions.includes(String(i))
      const fill = isVisited ? '#FF8FAB' : '#F0F0F0'
      const isMerged = regionId && MERGED_IDS.has(regionId)

      g.querySelectorAll('path').forEach(path => {
        path.setAttribute('fill', fill)
        // 모든 지역: stroke = fill 색 (경계선은 drop-shadow로만 표시)
        path.setAttribute('stroke', isMerged ? fill : fill)
        path.setAttribute('stroke-width', '1.2')
      })
    }
  }, [svgDoc, visitedRegions])

  return (
    <div style={{ width: '100%' }}>
      <object
        ref={objectRef}
        data="/skorea-municipalities-2011.svg"
        type="image/svg+xml"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  )
}

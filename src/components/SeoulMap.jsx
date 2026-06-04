import { useRef, useState, useEffect, useCallback } from 'react'
import { SEOUL_GU_PATHS } from '../utils/regions'

const PATHS = [
  "M 553.63 422.55 575.4 431.77 579.68 484.93 630.11 500.82 653.33 518.56 684.74 573.48 671.65 583.94 646.18 583.9 628.44 597.88 619.26 571.68 593.13 551.94 570.96 565.69 542.71 570.27 524.8 527.24 510.22 529.28 485.81 464.13 479.15 438.04 461.29 428.74 478.56 408.38 523.04 404.17 553.63 422.55 Z",
  "M 725.7 451.24 675.81 424.2 683.96 398.02 656.49 386.91 668.22 353.89 683.26 337.58 711.79 325.69 733.64 325.75 768.2 300.23 784.39 297.15 797.57 344.08 799 379.61 760.96 382.88 742.27 410.36 725.7 451.24 Z",
  "M 528.39 173.7 542.19 189.09 517.75 217.1 488.8 220.18 462.48 202.55 455.99 189.3 415.54 159.08 413.21 110.15 435.15 84.53 432.97 55.83 463.48 42.3 477.95 67.98 470.39 120.89 509.68 147.25 528.39 173.7 Z",
  "M 161.86 314.55 186.23 335.97 213.56 352.66 213.82 372.3 177.84 381.09 181.18 416.87 135.69 424.58 121.59 387.11 100.29 389.81 61.07 384.56 56.38 396.57 32.26 376.4 2.37 370.39 1 348.85 33.99 304.45 45.54 282.74 60.13 273.98 53.51 256.7 63.61 232.97 161.86 314.55 Z",
  "M 408.55 547.82 419.3 569.57 421.76 592.57 394.45 601.55 374.38 621.25 373.36 634.58 327.55 646.66 304.83 611.24 292.88 595.58 277.08 592.36 266 556.33 269.19 536.7 248.24 540.5 256.49 526.31 297.22 513.57 341.46 504.64 355.4 512.45 386.87 550.51 408.55 547.82 Z",
  "M 575.4 431.77 553.63 422.55 585.29 345.75 596.69 316.83 620.46 322.22 640.63 312.41 640.96 343.34 648.28 354.63 668.22 353.89 656.49 386.91 618.69 426.46 593.73 436.88 575.4 431.77 Z",
  "M 256.49 526.31 248.24 540.5 230.59 539.8 214.15 524.67 200.98 525.06 191.32 503.2 158.55 533.41 144.18 552.79 93.89 537.71 94.76 490.65 104.72 468.56 125.18 482.09 148.49 465.94 169.72 465.31 199.38 480.79 201.71 463.39 210.37 446.08 230.76 460.66 241.79 510.68 256.49 526.31 Z",
  "M 248.24 540.5 269.19 536.7 266 556.33 277.08 592.36 292.88 595.58 304.83 611.24 289.77 632.3 267.73 650.8 247.92 638.97 238.12 604.73 223.31 595.95 220.08 573.16 207.49 553.18 200.98 525.06 214.15 524.67 230.59 539.8 248.24 540.5 Z",
  "M 542.19 189.09 528.39 173.7 543.86 139.1 554.32 134.85 541.21 83.92 546.89 39.4 569.39 17.35 603.66 14.55 611.47 28.57 632.37 31.87 624.44 55.87 631.7 76.75 622.8 104.17 629.14 140.11 652.38 138.25 661.72 146.29 662.02 172.04 650.15 199.07 612.45 199.1 581.41 210.79 564.17 212.18 542.19 189.09 Z",
  "M 528.39 173.7 509.68 147.25 470.39 120.89 477.95 67.98 463.48 42.3 462.4 27.22 476.74 1 503.53 6.4 509.48 24.56 540.86 19.31 546.89 39.4 541.21 83.92 554.32 134.85 543.86 139.1 528.39 173.7 Z",
  "M 596.69 316.83 585.29 345.75 558.94 339.9 527.68 314.49 503.89 321.4 490.56 316.24 490.5 316.22 490.15 301.35 528.84 255.46 561.91 243.16 583.25 229.8 579.95 259.69 596.69 316.83 Z",
  "M 408.55 547.82 386.87 550.51 355.4 512.45 341.46 504.64 297.22 513.57 256.49 526.31 275.47 498.66 288.1 495.86 302.83 452.3 347.46 447.76 394.15 472.46 406.45 474.81 411.21 498.05 408.55 547.82 Z",
  "M 213.56 352.66 186.23 335.97 161.86 314.55 185.55 300.86 205.78 299.29 217.2 268.69 255.73 304.91 306.28 336.06 322.77 356.19 370.89 346.92 372.19 365.01 350.43 402.12 337.43 408.13 309.93 389.53 260.52 389.09 249.22 372.99 213.56 352.66 Z",
  "M 370.89 346.92 322.77 356.19 306.28 336.06 255.73 304.91 274.4 281.76 292.2 288.28 329.49 239.47 349.71 221.28 364.83 252.59 362.52 296.17 380.7 330.45 370.89 346.92 Z",
  "M 461.29 428.74 479.15 438.04 485.81 464.13 510.22 529.28 524.8 527.24 542.71 570.27 570.96 565.69 593.13 551.94 619.26 571.68 628.44 597.88 613.88 625.84 586.61 642.96 578.49 660.38 547.13 664.62 523.24 642.71 515.76 600.25 494.89 593.1 471.89 600.87 449.22 570.92 421.76 592.57 419.3 569.57 408.55 547.82 411.21 498.05 406.45 474.81 461.29 428.74 Z",
  "M 553.63 422.55 523.04 404.17 478.56 408.38 462.31 383.65 480.07 352.71 495.36 338.89 490.56 316.24 503.89 321.4 527.68 314.49 558.94 339.9 585.29 345.75 553.63 422.55 Z",
  "M 415.54 159.08 455.99 189.3 462.48 202.55 488.8 220.18 517.75 217.1 542.19 189.09 564.17 212.18 581.41 210.79 583.25 229.8 561.91 243.16 528.84 255.46 490.15 301.35 462.1 295.28 442.54 265.95 424.39 268.44 400.55 252.52 419.88 237.73 414.27 196.03 398.39 170.28 415.54 159.08 Z",
  "M 684.74 573.48 653.33 518.56 630.11 500.82 579.68 484.93 575.4 431.77 593.73 436.88 618.69 426.46 656.49 386.91 683.96 398.02 675.81 424.2 725.7 451.24 715.78 471.42 757.13 491.82 749.31 518.83 732.36 531.04 722.27 555.6 701.59 553.83 701.42 568.99 684.74 573.48 Z",
  "M 100.29 389.81 121.59 387.11 135.69 424.58 181.18 416.87 177.84 381.09 213.82 372.3 231.93 406.4 209.75 427.84 210.37 446.08 201.71 463.39 199.38 480.79 169.72 465.31 148.49 465.94 125.18 482.09 104.72 468.56 102.47 452.54 111.9 418.23 100.29 389.81 Z",
  "M 213.82 372.3 213.56 352.66 249.22 372.99 260.52 389.09 309.93 389.53 337.43 408.13 347.58 424.63 347.46 447.76 302.83 452.3 288.1 495.86 275.47 498.66 256.49 526.31 241.79 510.68 230.76 460.66 210.37 446.08 209.75 427.84 231.93 406.4 213.82 372.3 Z",
  "M 478.56 408.38 461.29 428.74 406.45 474.81 394.15 472.46 347.46 447.76 347.58 424.63 337.43 408.13 350.43 402.12 372.19 365.01 385.38 355.19 416.78 360.13 435.7 375.97 453.36 368.83 462.31 383.65 478.56 408.38 Z",
  "M 367.45 175.03 347.05 190.51 349.71 221.28 329.49 239.47 292.2 288.28 274.4 281.76 255.73 304.91 217.2 268.69 251.23 271.29 256.22 237.44 252.84 219.3 265.63 193.72 276.52 138.86 299.46 134.65 345.57 108.12 363.36 118.66 375.12 166.39 367.45 175.03 Z",
  "M 490.15 301.35 490.5 316.22 478.81 320.62 426.15 325.07 398.11 321.88 380.7 330.45 362.52 296.17 364.83 252.59 349.71 221.28 347.05 190.51 367.45 175.03 398.39 170.28 414.27 196.03 419.88 237.73 400.55 252.52 424.39 268.44 442.54 265.95 462.1 295.28 490.15 301.35 Z",
  "M 490.5 316.22 490.56 316.24 495.36 338.89 480.07 352.71 462.31 383.65 453.36 368.83 435.7 375.97 416.78 360.13 385.38 355.19 372.19 365.01 370.89 346.92 380.7 330.45 398.11 321.88 426.15 325.07 478.81 320.62 490.5 316.22 Z",
  "M 640.63 312.41 620.46 322.22 596.69 316.83 579.95 259.69 583.25 229.8 581.41 210.79 612.45 199.1 650.15 199.07 670.72 202.62 674.16 237.53 666.48 248.38 656.37 289.09 640.63 312.41 Z",
]

// 강서구(x≈1)·강동구(x≈799) 좌우 여백 균등 → VBX=-38 / 상단 여백 확장으로 지도 내려배치
const VBX = -38, VBY = -159, VBW = 876, VBH = 834

const LABEL_POS = [
  [570,504],[728,371],[476,144],[103,346],[338,569],
  [613,376],[186,502],[250,577],[596,123],[511,80],
  [546,298],[349,503],[266,347],[332,300],[509,558],
  [518,364],[479,224],[676,489],[158,430],[263,431],
  [409,406],[305,207],[416,265],[439,343],[629,257],
]

const MIN_SCALE = 1
const MAX_SCALE = 5

const visitedColor = (count) => {
  if (count >= 4) return '#C23558'
  if (count === 3) return '#DC4F70'
  if (count === 2) return '#F06A8C'
  return '#FF8FAB'
}

export default function SeoulMap({ visitedGus = [], selectedGu = null, onGuClick, onPhotoClick, recordCounts = {}, guPhotos = {}, showPhotos = true, bottomOffset = 12 }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const photoOverlayRef = useRef(null)
  const transformRef = useRef({ s: 1, tx: 0, ty: 0 })
  const guPhotosRef = useRef(guPhotos)
  const recordCountsRef = useRef(recordCounts)
  const showPhotosRef = useRef(showPhotos)
  const onGuClickRef = useRef(onGuClick)
  const onPhotoClickRef = useRef(onPhotoClick)
  const prevVisitedRef = useRef([])
  const [isZoomed, setIsZoomed] = useState(false)
  const [justColoredGu, setJustColoredGu] = useState(null)

  // 새로 색칠된 구 감지 → regionPop 애니메이션
  useEffect(() => {
    const prev = prevVisitedRef.current
    const newGus = visitedGus.filter(g => !prev.includes(g))
    prevVisitedRef.current = visitedGus
    if (newGus.length > 0) {
      setJustColoredGu(newGus[0])
      const t = setTimeout(() => setJustColoredGu(null), 700)
      return () => clearTimeout(t)
    }
  }, [visitedGus])

  useEffect(() => { onGuClickRef.current = onGuClick; onPhotoClickRef.current = onPhotoClick })

  const updatePhotos = useCallback(() => {
    const container = containerRef.current
    const overlay = photoOverlayRef.current
    if (!container || !overlay) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    if (!cw || !ch) return

    // SVG 좌표 → 픽셀 변환 (preserveAspectRatio="xMidYMin meet" 기준)
    const sBase = Math.min(cw / VBW, ch / VBH)
    const ox = (cw - VBW * sBase) / 2
    const oy = 0
    const { s: ts, tx, ty } = transformRef.current

    overlay.innerHTML = ''
    if (!showPhotosRef.current) return

    Object.entries(SEOUL_GU_PATHS).forEach(([iStr, guName]) => {
      const photo = guPhotosRef.current[guName]
      if (!photo) return
      const count = recordCountsRef.current[guName] || 0
      const [svgCX, svgCY] = LABEL_POS[Number(iStr)]
      const ex = ox + (svgCX - VBX) * sBase
      const ey = oy + (svgCY - VBY) * sBase
      const screenX = tx + ex * ts
      const screenY = ty + ey * ts

      const wrap = document.createElement('div')
      wrap.style.cssText = `position:absolute;left:${(screenX - 28).toFixed(1)}px;top:${(screenY - 66).toFixed(1)}px;width:56px;height:66px;pointer-events:auto;cursor:pointer;`

      const frame = document.createElement('div')
      frame.style.cssText = `width:56px;height:56px;background:white;padding:2px;border-radius:7px;overflow:hidden;box-sizing:border-box;box-shadow:0 3px 10px rgba(0,0,0,0.22),0 1px 3px rgba(0,0,0,0.12);`

      const img = document.createElement('img')
      img.src = photo
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

      const capturedGu = guName
      wrap.addEventListener('click', e => {
        e.stopPropagation()
        onPhotoClickRef.current?.(capturedGu)
      })
      overlay.appendChild(wrap)
    })
  }, [])

  // props 변경 시 사진 업데이트
  useEffect(() => { guPhotosRef.current = guPhotos; updatePhotos() }, [guPhotos, updatePhotos])
  useEffect(() => { recordCountsRef.current = recordCounts; updatePhotos() }, [recordCounts, updatePhotos])
  useEffect(() => { showPhotosRef.current = showPhotos; updatePhotos() }, [showPhotos, updatePhotos])

  useEffect(() => {
    const container = containerRef.current
    const svg = svgRef.current
    if (!container || !svg) return

    let touchData = null
    let hasDragged = false

    const applyTransform = () => {
      const { s, tx, ty } = transformRef.current
      svg.style.transform = `translate(${tx}px,${ty}px) scale(${s})`
      setIsZoomed(s > 1.05)
      updatePhotos()
    }

    const clamp = () => {
      const { s, tx, ty } = transformRef.current
      const cw = container.clientWidth
      const ch = container.clientHeight
      transformRef.current.tx = Math.max(cw * (1 - s), Math.min(0, tx))
      transformRef.current.ty = Math.max(ch * (1 - s), Math.min(0, ty))
    }

    const getTouchDist = (t1, t2) => {
      const dx = t2.clientX - t1.clientX
      const dy = t2.clientY - t1.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const onTouchStart = (e) => {
      hasDragged = false
      if (e.touches.length === 1) {
        touchData = { type: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, startTX: transformRef.current.tx, startTY: transformRef.current.ty }
      } else if (e.touches.length >= 2) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        touchData = { type: 'pinch', startDist: getTouchDist(e.touches[0], e.touches[1]), startMidX: midX, startMidY: midY, startS: transformRef.current.s, startTX: transformRef.current.tx, startTY: transformRef.current.ty }
      }
    }

    const onTouchMove = (e) => {
      if (!touchData) return
      if (touchData.type === 'pan' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchData.startX
        const dy = e.touches[0].clientY - touchData.startY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          e.preventDefault()
          hasDragged = true
          transformRef.current.tx = touchData.startTX + dx
          transformRef.current.ty = touchData.startTY + dy
          clamp()
          applyTransform()
        }
      } else if (touchData.type === 'pinch' && e.touches.length >= 2) {
        e.preventDefault()
        hasDragged = true
        const newDist = getTouchDist(e.touches[0], e.touches[1])
        if (newDist < 1) return
        const newS = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchData.startS * newDist / touchData.startDist))
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const ratio = newS / touchData.startS
        transformRef.current.s = newS
        transformRef.current.tx = midX - ratio * (midX - touchData.startTX)
        transformRef.current.ty = midY - ratio * (midY - touchData.startTY)
        clamp()
        applyTransform()
      }
    }

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        touchData = null
      } else if (e.touches.length === 1 && touchData?.type === 'pinch') {
        touchData = { type: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, startTX: transformRef.current.tx, startTY: transformRef.current.ty }
      }
    }

    const onClickCapture = (e) => {
      if (hasDragged) { e.stopPropagation(); e.preventDefault(); hasDragged = false }
    }

    const ro = new ResizeObserver(() => updatePhotos())
    ro.observe(container)

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('click', onClickCapture, { capture: true })

    // 초기 사진 렌더
    requestAnimationFrame(updatePhotos)

    return () => {
      ro.disconnect()
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('click', onClickCapture, { capture: true })
    }
  }, [updatePhotos])

  const resetZoom = () => {
    transformRef.current = { s: 1, tx: 0, ty: 0 }
    if (svgRef.current) svgRef.current.style.transform = ''
    setIsZoomed(false)
    updatePhotos()
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`${VBX} ${VBY} ${VBW} ${VBH}`}
        preserveAspectRatio="xMidYMin meet"
        style={{ width: '100%', height: '100%', display: 'block', transformOrigin: '0 0' }}
        stroke="#6B6B6B"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <style>{`
          .gu-path { vector-effect: non-scaling-stroke; }
        `}</style>
        {PATHS.map((d, i) => {
          const gu = SEOUL_GU_PATHS[i]
          const visited = visitedGus.includes(gu)
          const selected = selectedGu === gu
          const count = recordCounts[gu] || 0
          const fill = selected && visited ? '#FFBC00' : selected ? '#FF5499' : visited ? visitedColor(count) : '#FAF5EE'
          const isJustColored = justColoredGu === gu
          return (
            <path
              key={i}
              className="gu-path"
              d={d}
              fill={fill}
              onClick={() => onGuClick?.(gu)}
              style={{
                cursor: 'pointer',
                transformBox: 'fill-box',
                transformOrigin: 'center',
                ...(selected ? {
                  animation: 'regionPulse 1.4s ease-in-out infinite',
                  filter: visited ? 'drop-shadow(0 0 5px rgba(255,188,0,0.7))' : 'drop-shadow(0 0 5px rgba(255,50,110,0.7))',
                } : isJustColored ? {
                  animation: 'regionPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
                } : {
                  transition: 'fill 0.15s',
                }),
              }}
            />
          )
        })}
      </svg>

      {/* 사진 HTML 오버레이 — KoreaMap과 동일한 폴라로이드 스타일 */}
      <div ref={photoOverlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {isZoomed && (
        <button
          onClick={resetZoom}
          style={{
            position: 'absolute', bottom: bottomOffset, right: 12, zIndex: 10,
            background: 'rgba(255,255,255,0.9)', border: '1.5px solid #FFD6E0',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, color: '#FF7BA9',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          전체 보기
        </button>
      )}
    </div>
  )
}

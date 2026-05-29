import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, arrayUnion, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import KoreaMap from '../components/KoreaMap'
import BadgePopup from '../components/BadgePopup'
import { useConfirm } from '../components/ConfirmModal'
import { getCompletionRate, TOTAL_REGIONS, REGION_MAP, SVG_TO_REGION, searchRegions } from '../utils/regions'
import { getNewBadges } from '../utils/badges'
import { playPaintSound, playBadgeSound } from '../utils/sounds'

// 기록 목록에서 지역별 사진 풀을 빌드하고 랜덤 1장 선택
const buildRegionPhotos = (docs) => {
  const lists = {}
  docs.forEach(d => {
    const data = d.data ? d.data() : d
    const num = data.regionNum
    if (!num) return
    const regionId = SVG_TO_REGION[num]
    if (!regionId) return
    const urls = data.photoURLs?.length ? data.photoURLs : (data.photoURL ? [data.photoURL] : [])
    if (!urls.length) return
    if (!lists[regionId]) lists[regionId] = []
    urls.forEach(u => lists[regionId].push(u))
  })
  const photos = {}
  for (const [id, urls] of Object.entries(lists)) {
    photos[id] = urls[Math.floor(Math.random() * urls.length)]
  }
  return photos
}

// 지도 하단부 지역 — 팝업을 상단에 표시
const TOP_POPUP_REGIONS = new Set([
  '1','2',                                    // 제주
  '7','8','9','19','22','23',                 // 경남 남해안 (하동,남해,고성,거제,사천,통영)
  '49','50','51','57','58','59','61','62','66','69', // 전남 남해안 (신안,진도,완도,해남,강진,장흥,보성,고흥,광양,여수)
])

export default function MapPage({ user, onOpenRecord }) {
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [newBadges, setNewBadges] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRemoving, setIsRemoving] = useState(false)
  const [recordCounts, setRecordCounts] = useState({})
  const [records, setRecords] = useState([])
  const [regionPhotos, setRegionPhotos] = useState({})
  const [teamRegionPhotos, setTeamRegionPhotos] = useState({})
  const [showPhotoMap, setShowPhotoMap] = useState(true)
  const [guestRegions, setGuestRegions] = useState(() => {
    if (!user?.isAnonymous) return []
    try { return JSON.parse(localStorage.getItem('guestVisitedRegions') || '[]') } catch { return [] }
  })
  const navigate = useNavigate()
  const { confirm, modal } = useConfirm()

  const isGuest = !!user?.isAnonymous

  useEffect(() => {
    if (!user || user.isAnonymous) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setProfile(snap.data())
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user || user.isAnonymous) return
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'records'), snap => {
      const counts = {}
      const recs = []
      snap.docs.forEach(d => {
        const data = d.data()
        recs.push(data)
        const regionId = SVG_TO_REGION[data.regionNum]
        if (regionId) counts[regionId] = (counts[regionId] || 0) + 1
      })
      setRecordCounts(counts)
      setRecords(recs)
      setRegionPhotos(buildRegionPhotos(snap.docs))
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!profile?.teamId) { setTeamRegionPhotos({}); return }
    const unsub = onSnapshot(collection(db, 'teams', profile.teamId, 'records'), snap => {
      setTeamRegionPhotos(buildRegionPhotos(snap.docs))
    })
    return unsub
  }, [profile?.teamId])

  useEffect(() => {
    if (!profile?.teamId) return
    const unsub = onSnapshot(doc(db, 'teams', profile.teamId), snap => {
      if (snap.exists()) setTeamData(snap.data())
    })
    return unsub
  }, [profile?.teamId])

  const visitedRegions = isGuest
    ? guestRegions
    : (profile?.teamId && teamData ? teamData.visitedRegions || [] : profile?.visitedRegions || [])

  const dataLoaded = isGuest || (profile !== null && (!profile?.teamId || teamData !== null))
  // 팀 모드에서는 팀 사진만, 개인 모드에서는 개인 사진만 표시
  const effectiveRegionPhotos = profile?.teamId ? teamRegionPhotos : regionPhotos
  const hasPhotos = Object.keys(effectiveRegionPhotos).length > 0
  const completionRate = getCompletionRate(visitedRegions)
  const regionInfo = selectedRegion ? REGION_MAP[selectedRegion] : null
  const selectedRegionId = selectedRegion ? SVG_TO_REGION[selectedRegion] : null
  const isVisited = selectedRegionId
    ? visitedRegions.some(n => SVG_TO_REGION[n] === selectedRegionId)
    : false

  const searchResults = searchOpen && searchQuery.trim() ? searchRegions(searchQuery) : []
  const closeSearch = () => { setSearchOpen(false); setSearchQuery('') }

  const addVisited = async (svgNum) => {
    if (isGuest) {
      const updated = [...new Set([...guestRegions, svgNum])]
      setGuestRegions(updated)
      localStorage.setItem('guestVisitedRegions', JSON.stringify(updated))
      return
    }
    if (profile?.teamId) {
      await setDoc(doc(db, 'teams', profile.teamId), { visitedRegions: arrayUnion(svgNum) }, { merge: true })
    } else {
      await setDoc(doc(db, 'users', user.uid), { visitedRegions: arrayUnion(svgNum) }, { merge: true })
    }
  }

  const markVisited = async () => {
    if (!selectedRegion || !user || isVisited) return
    playPaintSound()
    const prev = visitedRegions
    await addVisited(selectedRegion)
    const next = [...new Set([...prev, selectedRegion])]
    const earned = getNewBadges(
      prev.map(n => REGION_MAP[n]?.id).filter(Boolean),
      next.map(n => REGION_MAP[n]?.id).filter(Boolean),
      records
    )
    if (earned.length) { playBadgeSound(); setNewBadges(earned) }
    setSelectedRegion(null)
  }

  const markAndRecord = async () => {
    if (!selectedRegion || !user) return
    if (!isVisited) {
      playPaintSound()
      const prev = visitedRegions
      await addVisited(selectedRegion)
      const next = [...new Set([...prev, selectedRegion])]
      const earned = getNewBadges(
        prev.map(n => REGION_MAP[n]?.id).filter(Boolean),
        next.map(n => REGION_MAP[n]?.id).filter(Boolean),
        records
      )
      if (earned.length) { playBadgeSound(); setNewBadges(earned) }
    }
    onOpenRecord(selectedRegion)
    navigate('/record')
  }

  const unmarkVisited = async () => {
    if (isRemoving || !selectedRegion || !user || !selectedRegionId) return
    setIsRemoving(true)

    // async 대기 중 state 변화에 영향받지 않도록 시작 시점 값 고정
    const capturedRegionId = selectedRegionId
    const capturedRegionName = regionInfo?.name || '이 지역'
    const toRemove = visitedRegions.filter(n => SVG_TO_REGION[n] === capturedRegionId)

    try {
      if (!toRemove.length) return

      if (isGuest) {
        const ok = await confirm(`${capturedRegionName} 색칠을 취소할까요?`, { confirmText: '지우기', cancelText: '아니요', destructive: true })
        if (!ok) return
        const updated = guestRegions.filter(n => SVG_TO_REGION[n] !== capturedRegionId)
        setGuestRegions(updated)
        localStorage.setItem('guestVisitedRegions', JSON.stringify(updated))
        setSelectedRegion(null)
        return
      }

      const isTeamMode = !!(profile?.teamId && teamData)
      const personalSnap = await getDocs(query(
        collection(db, 'users', user.uid, 'records'),
        where('regionNum', 'in', toRemove)
      ))
      // 팀 모드: 현재 유저의 팀 기록도 조회
      const teamRecordDocs = []
      if (isTeamMode) {
        const teamSnap = await getDocs(query(
          collection(db, 'teams', profile.teamId, 'records'),
          where('regionNum', 'in', toRemove)
        ))
        teamSnap.docs.forEach(d => teamRecordDocs.push(d))
      }
      const totalRecords = personalSnap.size

      if (totalRecords > 0) {
        const ok = await confirm(
          `⚠️ ${capturedRegionName}의 기록 ${totalRecords}개가 모두 삭제됩니다.\n색칠도 함께 취소할까요?`,
          { confirmText: '삭제하기', cancelText: '아니요', destructive: true }
        )
        if (!ok) return
        for (const d of personalSnap.docs) await deleteDoc(d.ref)
        for (const d of teamRecordDocs) await deleteDoc(d.ref)
      } else {
        const ok = await confirm(`${capturedRegionName} 색칠을 취소할까요?`, { confirmText: '지우기', cancelText: '아니요', destructive: true })
        if (!ok) return
      }

      if (profile?.teamId && teamData) {
        const newTeamRegions = (teamData.visitedRegions || []).filter(n => SVG_TO_REGION[n] !== capturedRegionId)
        await setDoc(doc(db, 'teams', profile.teamId), { visitedRegions: newTeamRegions }, { merge: true })
      } else {
        const newPersonalRegions = (profile?.visitedRegions || []).filter(n => SVG_TO_REGION[n] !== capturedRegionId)
        await setDoc(doc(db, 'users', user.uid), { visitedRegions: newPersonalRegions }, { merge: true })
      }
      setSelectedRegion(null)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      left: 'max(0px, calc(50vw - 215px))',
      right: 'max(0px, calc(50vw - 215px))',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: '0',
      display: 'flex', flexDirection: 'column',
      background: "url('/바다픽셀.png') center/cover no-repeat",
    }}>
      {newBadges.length > 0 && (
        <BadgePopup badges={newBadges} onClose={() => setNewBadges([])} />
      )}
      {modal}

      {/* ── 게이지 바 ── */}
      <div style={{
        flexShrink: 0,
        padding: '8px 12px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* % 뱃지 */}
          <div style={{
            flexShrink: 0,
            background: '#FF7BA9',
            color: 'white',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 9,
            padding: '6px 10px', borderRadius: 10,
            boxShadow: '0 2px 6px rgba(255,143,171,0.35)',
          }}>
            {completionRate}%
          </div>
          {/* 바 본체 */}
          <div style={{ flex: 1, position: 'relative', height: 44 }}>
            {/* 트랙 */}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 26,
              borderRadius: 13,
              border: '2px solid rgba(91,141,184,0.5)',
              background: 'rgba(255,255,255,0.5)',
              overflow: 'hidden',
            }}>
              {/* 채워진 구간 */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${completionRate}%`,
                background: 'linear-gradient(90deg, #FFE55A, #FFBC00)',
                transition: 'width 0.6s ease',
              }} />
              {/* 방문 수 */}
              <div style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 7,
                color: 'rgba(60,60,60,0.5)',
                zIndex: 2, pointerEvents: 'none',
              }}>
                {visitedRegions.length}/{TOTAL_REGIONS}
              </div>
            </div>
            {/* 삐야 (진행도에 따라 이동) */}
            <img
              src="/도트삐야_아이콘.png"
              alt=""
              style={{
                position: 'absolute',
                bottom: 18,
                left: `clamp(14px, ${completionRate}%, calc(100% - 14px))`,
                transform: 'translateX(-50%)',
                width: 31, height: 31,
                objectFit: 'contain',
                transition: 'left 0.6s ease',
                pointerEvents: 'none',
                zIndex: 2,
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 검색 바 ── */}
      <div style={{
        flexShrink: 0, position: 'relative', zIndex: 20,
        padding: '4px 12px 8px',
      }}>
        {searchOpen ? (
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', height: 42 }}>
            <input
              autoFocus type="text" inputMode="search"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="지역 검색(예: 서울, 부산...)"
              style={{
                flex: 1, height: '100%', padding: '0 14px', borderRadius: 20,
                border: 'none', outline: 'none', fontSize: 13,
                background: 'rgba(255,255,255,0.82)', color: '#2D2D2D',
                boxSizing: 'border-box',
              }}
            />
            <button onClick={closeSearch} style={{
              width: 32, height: 32, borderRadius: 16, flexShrink: 0,
              background: 'rgba(255,255,255,0.6)', color: '#555', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} style={{
            width: '100%', padding: '7px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.82)', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <img src="/도트돋보기삐야.png" alt="" style={{ width: 49, height: 33, flexShrink: 0, objectFit: 'contain' }} />
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>지역 검색(예: 서울, 부산...)</span>
          </button>
        )}

        {/* 검색 결과 드롭다운 */}
        {searchOpen && searchQuery.trim() && (
          <div style={{
            position: 'absolute', top: '100%', left: 12, right: 12,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            zIndex: 20, maxHeight: 220, overflowY: 'auto',
          }}>
            {searchResults.length > 0 ? searchResults.map((r, idx) => (
              <button key={r.svgNum}
                onClick={() => { setSelectedRegion(r.svgNum); closeSearch() }}
                style={{
                  width: '100%', padding: '12px 16px',
                  textAlign: 'left', fontSize: 14, color: '#2D2D2D',
                  background: 'none', fontWeight: 500,
                  borderBottom: idx < searchResults.length - 1 ? '1px solid #F0F0F0' : 'none',
                }}
              >
                📍 {r.name}
              </button>
            )) : (
              <p style={{ padding: '14px 16px', fontSize: 13, color: '#B0B0B0', textAlign: 'center' }}>
                검색 결과가 없어요
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 지도 ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, touchAction: 'none', overflow: 'hidden' }}>
        <KoreaMap
          visitedRegions={visitedRegions}
          highlightedRegion={selectedRegion}
          recordCounts={recordCounts}
          onRegionClick={svgNum => { closeSearch(); setSelectedRegion(svgNum) }}
          dataLoaded={dataLoaded}
          regionPhotos={effectiveRegionPhotos}
          showPhotoMap={showPhotoMap}
        />
        {hasPhotos && (
          <button
            onClick={() => setShowPhotoMap(v => !v)}
            style={{
              position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', right: 12, zIndex: 10,
              background: showPhotoMap ? '#FF8FAB' : 'rgba(255,255,255,0.9)',
              color: showPhotoMap ? 'white' : '#FF8FAB',
              border: '1.5px solid #FFD6E0',
              borderRadius: 20, padding: '6px 14px',
              fontSize: 12, fontWeight: 600,
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            📷 사진
          </button>
        )}
      </div>

      {/* ── 지역 선택 팝업 (하단 or 남해안·제주 상단) ── */}
      {selectedRegion && (() => {
        const isTop = TOP_POPUP_REGIONS.has(selectedRegion)
        return (
        <div style={isTop ? {
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 120px)',
          left: 'max(0px, calc(50vw - 215px))',
          right: 'max(0px, calc(50vw - 215px))',
          zIndex: 150,
          background: 'white',
          borderRadius: '0 0 20px 20px',
          padding: '14px 16px 6px',
          boxShadow: '0 4px 24px rgba(255,123,169,0.15)',
          animation: 'slideDown 0.22s ease',
        } : {
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
          left: 'max(0px, calc(50vw - 215px))',
          right: 'max(0px, calc(50vw - 215px))',
          zIndex: 150,
          background: 'white',
          borderRadius: 20,
          padding: '14px 16px 16px',
          boxShadow: '0 4px 28px rgba(255,123,169,0.15)',
          animation: 'slideUp 0.22s ease',
        }}>
          {!isTop && <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '0 auto 10px' }} />}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ flex: 1, paddingRight: 8 }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#2D2D2D', letterSpacing: '-0.3px' }}>
                {regionInfo ? regionInfo.name : '알 수 없는 지역'}
              </p>
              {selectedRegion === '252' && (
                <p style={{ fontSize: 13, marginTop: 1, fontWeight: 700, color: '#4A90D9' }}>
                  독도는 우리땅 🇰🇷
                </p>
              )}
              <p style={{ fontSize: 13, marginTop: 2, fontWeight: 600, color: isVisited ? '#FF7BA9' : '#C0C0C0' }}>
                {isVisited ? '✅ 방문 완료!' : '아직 방문하지 않은 지역이에요'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {isVisited && (
                <button onClick={unmarkVisited} disabled={isRemoving} style={{
                  padding: '4px 10px', borderRadius: 12,
                  background: '#FFF0F0', color: isRemoving ? '#FFB3B3' : '#FF6B6B',
                  fontSize: 13, fontWeight: 600,
                  opacity: isRemoving ? 0.6 : 1,
                }}>
                  {isRemoving ? '처리 중...' : '색칠 취소'}
                </button>
              )}
              <button onClick={() => setSelectedRegion(null)} style={{
                width: 26, height: 26, borderRadius: 13,
                background: '#F5F5F5', color: '#888', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          </div>

          {isVisited ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { onOpenRecord(selectedRegion); navigate('/records') }} style={{ ...compactBtn }}>
                📖 기록 보기
              </button>
              <button onClick={() => { onOpenRecord(selectedRegion); navigate('/record') }} style={{ ...compactBtn, background: '#FFE8EF', color: '#FF7BA9' }}>
                ✍️ 기록 추가
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={markVisited} style={{ ...compactBtn }}>
                🎨 색칠하기
              </button>
              <button onClick={markAndRecord} style={{ ...compactBtn, background: '#FFE8EF', color: '#FF7BA9' }}>
                🎨 색칠+기록
              </button>
            </div>
          )}
          {isTop && (
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '10px auto 0' }} />
          )}
        </div>
        )
      })()}
    </div>
  )
}

const compactBtn = {
  flex: 1,
  padding: '11px 8px',
  borderRadius: 14,
  background: '#FF7BA9',
  color: 'white',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '-0.2px',
  textAlign: 'center',
}

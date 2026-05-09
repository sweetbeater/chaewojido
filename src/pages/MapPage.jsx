import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import KoreaMap from '../components/KoreaMap'
import BadgePopup from '../components/BadgePopup'
import { getCompletionRate, TOTAL_REGIONS, REGION_MAP } from '../utils/regions'
import { getNewBadges } from '../utils/badges'

export default function MapPage({ user, onOpenRecord }) {
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [mode, setMode] = useState('personal')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [newBadges, setNewBadges] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data())
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!profile?.teamId) return
    const unsub = onSnapshot(doc(db, 'teams', profile.teamId), (snap) => {
      if (snap.exists()) setTeamData(snap.data())
    })
    return unsub
  }, [profile?.teamId])

  const visitedRegions = mode === 'team' && teamData
    ? teamData.visitedRegions || []
    : profile?.visitedRegions || []

  const completionRate = getCompletionRate(visitedRegions)
  const regionInfo = selectedRegion ? REGION_MAP[selectedRegion] : null
  const isVisited = selectedRegion && visitedRegions.includes(selectedRegion)

  const handleMarkVisited = async () => {
    if (!selectedRegion || !user) return
    const prevVisited = profile?.visitedRegions || []
    const newVisited = [...new Set([...prevVisited, selectedRegion])]

    await setDoc(doc(db, 'users', user.uid), {
      visitedRegions: arrayUnion(selectedRegion)
    }, { merge: true })

    if (profile?.teamId) {
      await setDoc(doc(db, 'teams', profile.teamId), {
        visitedRegions: arrayUnion(selectedRegion)
      }, { merge: true })
    }

    // 배지 체크
    const earned = getNewBadges(
      prevVisited.map(n => REGION_MAP[n]?.id).filter(Boolean),
      newVisited.map(n => REGION_MAP[n]?.id).filter(Boolean)
    )
    if (earned.length > 0) setNewBadges(earned)

    setSelectedRegion(null)
  }

  const handleGoRecord = () => {
    onOpenRecord(selectedRegion)
    navigate('/record')
  }

  const handleGoRecordList = () => {
    onOpenRecord(selectedRegion)
    navigate('/records')
  }

  const handleMarkAndRecord = async () => {
    if (!selectedRegion || !user) return
    const prevVisited = profile?.visitedRegions || []
    const newVisited = [...new Set([...prevVisited, selectedRegion])]

    await setDoc(doc(db, 'users', user.uid), {
      visitedRegions: arrayUnion(selectedRegion)
    }, { merge: true })

    if (profile?.teamId) {
      await setDoc(doc(db, 'teams', profile.teamId), {
        visitedRegions: arrayUnion(selectedRegion)
      }, { merge: true })
    }

    // 배지 체크
    const earned = getNewBadges(
      prevVisited.map(n => REGION_MAP[n]?.id).filter(Boolean),
      newVisited.map(n => REGION_MAP[n]?.id).filter(Boolean)
    )
    if (earned.length > 0) setNewBadges(earned)

    onOpenRecord(selectedRegion)
    navigate('/record')
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* 배지 팝업 */}
      {newBadges.length > 0 && (
        <BadgePopup badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: 12, color: '#aaa' }}>
            {mode === 'team' && teamData
              ? `${teamData.name}팀`
              : `${profile?.nickname || '나'}님`}의 지도 완성률
          </p>
          <p style={{ fontSize: 24, fontWeight: 'bold', color: '#FF8FAB' }}>
            {completionRate}%
          </p>
          <p style={{ fontSize: 11, color: '#ccc' }}>
            {visitedRegions.length} / {TOTAL_REGIONS} 지역
          </p>
        </div>
        {profile?.teamId && (
          <div style={{ display: 'flex', gap: 8 }}>
            {['personal', 'team'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: mode === m ? '#FF8FAB' : '#FFE8EF',
                color: mode === m ? 'white' : '#FF8FAB',
                fontSize: 13,
                fontWeight: 'bold',
              }}>
                {m === 'personal' ? '개인' : '팀'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지도 */}
      <KoreaMap
        visitedRegions={visitedRegions}
        onRegionClick={setSelectedRegion}
      />

      {/* 팝업 */}
      {selectedRegion && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)',
          maxWidth: 390,
          background: 'white',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 -4px 24px rgba(255,143,171,0.2)',
          zIndex: 200,
        }}>
          <button onClick={() => setSelectedRegion(null)} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', fontSize: 18, color: '#aaa',
          }}>✕</button>
          <p style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
            {regionInfo ? regionInfo.name : '알 수 없는 지역'}
          </p>
          {isVisited ? (
            <>
              <p style={{ color: '#FF8FAB', fontSize: 13, marginBottom: 16 }}>✅ 방문 완료!</p>
              <button onClick={handleGoRecordList} style={{ ...btnStyle, marginBottom: 8 }}>
                📖 기록 보기
              </button>
              <button onClick={handleGoRecord} style={{ ...btnStyle, background: '#FFE8EF', color: '#FF8FAB' }}>
                ✍️ 기록 추가하기
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>아직 방문하지 않은 지역이에요</p>
              <button onClick={handleMarkVisited} style={{ ...btnStyle, marginBottom: 8 }}>
                🎨 색칠하기
              </button>
              <button onClick={handleMarkAndRecord} style={{ ...btnStyle, background: '#FFE8EF', color: '#FF8FAB' }}>
                🎨 색칠 + 기록 남기기
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const btnStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: 12,
  background: '#FF8FAB',
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  display: 'block',
}
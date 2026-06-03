import { useState, useEffect, useMemo } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import KoreaMap from '../components/KoreaMap'
import SeoulMap from '../components/SeoulMap'
import BadgePopup from '../components/BadgePopup'
import { useConfirm } from '../components/ConfirmModal'
import {
  getCompletionRate, TOTAL_REGIONS, REGION_MAP, SVG_TO_REGION, REGION_TO_SVG,
  searchRegions, searchGus, SEOUL_GU_NAMES, SEOUL_REPRESENTATIVE_SVG,
} from '../utils/regions'
import { getNewBadges } from '../utils/badges'
import { playPaintSound, playBadgeSound } from '../utils/sounds'

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

const HEART_PARTICLES = [
  { x: '4%',  dur: '2.1s', delay: '0.00s', size: '28px' },
  { x: '12%', dur: '2.6s', delay: '0.10s', size: '20px' },
  { x: '21%', dur: '1.9s', delay: '0.20s', size: '34px' },
  { x: '30%', dur: '2.3s', delay: '0.05s', size: '24px' },
  { x: '39%', dur: '2.8s', delay: '0.15s', size: '36px' },
  { x: '48%', dur: '1.8s', delay: '0.30s', size: '22px' },
  { x: '57%', dur: '2.4s', delay: '0.00s', size: '30px' },
  { x: '66%', dur: '2.0s', delay: '0.25s', size: '26px' },
  { x: '75%', dur: '2.5s', delay: '0.12s', size: '28px' },
  { x: '84%', dur: '1.7s', delay: '0.20s', size: '24px' },
  { x: '92%', dur: '2.2s', delay: '0.40s', size: '20px' },
  { x: '8%',  dur: '2.0s', delay: '0.45s', size: '18px' },
  { x: '26%', dur: '2.7s', delay: '0.35s', size: '28px' },
  { x: '44%', dur: '1.9s', delay: '0.55s', size: '22px' },
  { x: '62%', dur: '2.3s', delay: '0.60s', size: '32px' },
  { x: '80%', dur: '2.1s', delay: '0.50s', size: '26px' },
  { x: '17%', dur: '2.4s', delay: '0.70s', size: '20px' },
  { x: '52%', dur: '2.0s', delay: '0.65s', size: '30px' },
  { x: '88%', dur: '1.8s', delay: '0.75s', size: '24px' },
]

const TOP_POPUP_REGIONS = new Set([
  '1','2',
  '7','8','9','19','22','23',
  '49','50','51','57','58','59','61','62','66','69',
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
  const [teamRecordCounts, setTeamRecordCounts] = useState({})
  const [records, setRecords] = useState([])
  const [regionPhotos, setRegionPhotos] = useState({})
  const [teamRegionPhotos, setTeamRegionPhotos] = useState({})
  const [showPhotoMap, setShowPhotoMap] = useState(true)

  // 서울 탐방 탭
  const [activeTab, setActiveTab] = useState('korea')
  const [selectedGu, setSelectedGu] = useState(null)
  const [seoulRecordCounts, setSeoulRecordCounts] = useState({})
  const [seoulGuPhotos, setSeoulGuPhotos] = useState({})
  const [showSeoulPhotos, setShowSeoulPhotos] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [migrationRecords, setMigrationRecords] = useState([])
  const [migrationIdx, setMigrationIdx] = useState(0)
  const [migrationAssignments, setMigrationAssignments] = useState({})
  const [guestSeoulGus, setGuestSeoulGus] = useState(() => {
    if (!user?.isAnonymous) return []
    try { return JSON.parse(localStorage.getItem('guestSeoulGus') || '[]') } catch { return [] }
  })

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
      const seoulCounts = {}
      const guPhotos = {}
      snap.docs.forEach(d => {
        const data = d.data()
        recs.push(data)
        const regionId = SVG_TO_REGION[data.regionNum]
        if (regionId) counts[regionId] = (counts[regionId] || 0) + 1
        if (data.gu) {
          seoulCounts[data.gu] = (seoulCounts[data.gu] || 0) + 1
          if (!guPhotos[data.gu]) {
            const url = data.photoURLs?.[0] || data.photoURL || null
            if (url) guPhotos[data.gu] = url
          }
        }
      })
      setRecordCounts(counts)
      setRecords(recs)
      setRegionPhotos(buildRegionPhotos(snap.docs))
      setSeoulRecordCounts(seoulCounts)
      setSeoulGuPhotos(guPhotos)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!profile?.teamId) { setTeamRegionPhotos({}); setTeamRecordCounts({}); return }
    const unsub = onSnapshot(collection(db, 'teams', profile.teamId, 'records'), snap => {
      setTeamRegionPhotos(buildRegionPhotos(snap.docs))
      const counts = {}
      const seoulCounts = {}
      const guPhotos = {}
      snap.docs.forEach(d => {
        const data = d.data()
        const regionId = SVG_TO_REGION[data.regionNum]
        if (regionId) counts[regionId] = (counts[regionId] || 0) + 1
        if (data.gu) {
          seoulCounts[data.gu] = (seoulCounts[data.gu] || 0) + 1
          if (!guPhotos[data.gu]) {
            const url = data.photoURLs?.[0] || data.photoURL || null
            if (url) guPhotos[data.gu] = url
          }
        }
      })
      setTeamRecordCounts(counts)
      setSeoulRecordCounts(seoulCounts)
      setSeoulGuPhotos(guPhotos)
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

  const seoulGus = isGuest
    ? guestSeoulGus
    : (profile?.teamId && teamData ? teamData.seoulGus || [] : profile?.seoulGus || [])

  // 서울 구가 하나라도 색칠됐으면 전국지도에서 서울 색칠
  const effectiveVisitedRegions = useMemo(() => {
    if (!seoulGus.length) return visitedRegions
    const hasSeoul = visitedRegions.some(n => SVG_TO_REGION[String(n)] === 'seoul')
    if (hasSeoul) return visitedRegions
    return [...visitedRegions, SEOUL_REPRESENTATIVE_SVG]
  }, [visitedRegions, seoulGus])

  const dataLoaded = isGuest || (profile !== null && (!profile?.teamId || teamData !== null))
  const effectiveRegionPhotos = profile?.teamId ? teamRegionPhotos : regionPhotos
  const effectiveRecordCounts = profile?.teamId ? teamRecordCounts : recordCounts
  const hasPhotos = Object.keys(effectiveRegionPhotos).length > 0
  const completionRate = getCompletionRate(effectiveVisitedRegions)
  const regionInfo = selectedRegion ? REGION_MAP[selectedRegion] : null
  const selectedRegionId = selectedRegion ? SVG_TO_REGION[selectedRegion] : null
  const isVisited = selectedRegionId
    ? effectiveVisitedRegions.some(n => SVG_TO_REGION[n] === selectedRegionId)
    : false
  const isSeoulSelected = selectedRegionId === 'seoul'
  // 탭 2 이전에 직접 색칠한 기존 사용자 대응
  const isSeoulInVisitedRegions = visitedRegions.some(n => SVG_TO_REGION[String(n)] === 'seoul')
  const hasSeoulRecords = (effectiveRecordCounts['seoul'] || 0) > 0

  const regionResults = searchOpen && searchQuery.trim() && searchQuery !== '사랑해!!' ? searchRegions(searchQuery) : []
  const guResults = searchOpen && searchQuery.trim() && searchQuery !== '사랑해!!' ? searchGus(searchQuery) : []

  const closeSearch = () => { setSearchOpen(false); setSearchQuery('') }
  const openSearch = () => { setSearchOpen(true); setShowPhotoMap(false) }

  const handlePhotoClick = (regionId) => {
    if (!showPhotoMap) return
    // 서울은 SEOUL_REPRESENTATIVE_SVG(number 227)로 처리 — gu 기록 타입 통일
    const svgNum = regionId === 'seoul' ? SEOUL_REPRESENTATIVE_SVG : REGION_TO_SVG[regionId]
    if (!svgNum) return
    onOpenRecord(svgNum)
    navigate('/records')
  }

  const handleSeoulGuPhotoClick = (gu) => {
    onOpenRecord(SEOUL_REPRESENTATIVE_SVG, gu)
    navigate('/records')
  }

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

  const addGu = async (gu) => {
    if (isGuest) {
      const updated = [...new Set([...guestSeoulGus, gu])]
      setGuestSeoulGus(updated)
      localStorage.setItem('guestSeoulGus', JSON.stringify(updated))
      return
    }
    if (profile?.teamId) {
      await setDoc(doc(db, 'teams', profile.teamId), { seoulGus: arrayUnion(gu) }, { merge: true })
    } else {
      await setDoc(doc(db, 'users', user.uid), { seoulGus: arrayUnion(gu) }, { merge: true })
    }
  }

  const removeGu = async (gu) => {
    if (isGuest) {
      const updated = guestSeoulGus.filter(g => g !== gu)
      setGuestSeoulGus(updated)
      localStorage.setItem('guestSeoulGus', JSON.stringify(updated))
      return
    }
    const newGus = seoulGus.filter(g => g !== gu)
    if (profile?.teamId) {
      await setDoc(doc(db, 'teams', profile.teamId), { seoulGus: newGus }, { merge: true })
    } else {
      await setDoc(doc(db, 'users', user.uid), { seoulGus: newGus }, { merge: true })
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

  const markGuVisited = async () => {
    if (!selectedGu || seoulGus.includes(selectedGu)) return
    playPaintSound()
    // 첫 구 색칠 시 서울이 visitedIds에 새로 추가되므로 배지 체크
    const isSeoulNew = seoulGus.length === 0 && !visitedRegions.some(n => SVG_TO_REGION[String(n)] === 'seoul')
    const prevIds = effectiveVisitedRegions.map(n => REGION_MAP[n]?.id).filter(Boolean)
    await addGu(selectedGu)
    if (isSeoulNew) {
      const nextIds = [...visitedRegions, SEOUL_REPRESENTATIVE_SVG].map(n => REGION_MAP[n]?.id).filter(Boolean)
      const earned = getNewBadges(prevIds, nextIds, records)
      if (earned.length) { playBadgeSound(); setNewBadges(earned) }
    }
  }

  const markGuAndRecord = async () => {
    if (!selectedGu) return
    if (!seoulGus.includes(selectedGu)) {
      playPaintSound()
      const isSeoulNew = seoulGus.length === 0 && !visitedRegions.some(n => SVG_TO_REGION[String(n)] === 'seoul')
      const prevIds = effectiveVisitedRegions.map(n => REGION_MAP[n]?.id).filter(Boolean)
      await addGu(selectedGu)
      if (isSeoulNew) {
        const nextIds = [...visitedRegions, SEOUL_REPRESENTATIVE_SVG].map(n => REGION_MAP[n]?.id).filter(Boolean)
        const earned = getNewBadges(prevIds, nextIds, records)
        if (earned.length) { playBadgeSound(); setNewBadges(earned) }
      }
    }
    onOpenRecord(SEOUL_REPRESENTATIVE_SVG, selectedGu)
    navigate('/record')
  }

  const unmarkVisited = async () => {
    if (isRemoving || !selectedRegion || !user || !selectedRegionId) return
    setIsRemoving(true)
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
      if (isTeamMode) {
        const teamSnap = await getDocs(query(
          collection(db, 'teams', profile.teamId, 'records'),
          where('regionNum', 'in', toRemove)
        ))
        if (teamSnap.size > 0) {
          const ok = await confirm(
            `⚠️ ${capturedRegionName}의 기록 ${teamSnap.size}개가 모두 삭제됩니다.\n색칠도 함께 취소할까요?`,
            { confirmText: '삭제하기', cancelText: '아니요', destructive: true }
          )
          if (!ok) return
          for (const d of teamSnap.docs) await deleteDoc(d.ref)
        } else {
          const ok = await confirm(`${capturedRegionName} 색칠을 취소할까요?`, { confirmText: '지우기', cancelText: '아니요', destructive: true })
          if (!ok) return
        }
      } else {
        const personalSnap = await getDocs(query(
          collection(db, 'users', user.uid, 'records'),
          where('regionNum', 'in', toRemove)
        ))
        if (personalSnap.size > 0) {
          const ok = await confirm(
            `⚠️ ${capturedRegionName}의 기록 ${personalSnap.size}개가 모두 삭제됩니다.\n색칠도 함께 취소할까요?`,
            { confirmText: '삭제하기', cancelText: '아니요', destructive: true }
          )
          if (!ok) return
          for (const d of personalSnap.docs) await deleteDoc(d.ref)
        } else {
          const ok = await confirm(`${capturedRegionName} 색칠을 취소할까요?`, { confirmText: '지우기', cancelText: '아니요', destructive: true })
          if (!ok) return
        }
      }

      if (profile?.teamId && teamData) {
        const newRegions = (teamData.visitedRegions || []).filter(n => SVG_TO_REGION[n] !== capturedRegionId)
        await setDoc(doc(db, 'teams', profile.teamId), { visitedRegions: newRegions }, { merge: true })
      } else {
        const newRegions = (profile?.visitedRegions || []).filter(n => SVG_TO_REGION[n] !== capturedRegionId)
        await setDoc(doc(db, 'users', user.uid), { visitedRegions: newRegions }, { merge: true })
      }
      setSelectedRegion(null)
    } finally {
      setIsRemoving(false)
    }
  }

  const unmarkGu = async () => {
    if (!selectedGu) return
    if (isGuest) {
      const ok = await confirm(`서울 ${selectedGu} 색칠을 취소할까요?`, { confirmText: '지우기', cancelText: '아니요', destructive: true })
      if (!ok) return
      await removeGu(selectedGu)
      setSelectedGu(null)
      return
    }
    const isTeamMode = !!(profile?.teamId && teamData)
    const coll = isTeamMode
      ? collection(db, 'teams', profile.teamId, 'records')
      : collection(db, 'users', user.uid, 'records')
    const guSnap = await getDocs(query(coll, where('gu', '==', selectedGu)))
    if (guSnap.size > 0) {
      const ok = await confirm(
        `⚠️ 서울 ${selectedGu}의 기록 ${guSnap.size}개가 모두 삭제됩니다.\n색칠도 함께 취소할까요?`,
        { confirmText: '삭제하기', cancelText: '아니요', destructive: true }
      )
      if (!ok) return
      for (const d of guSnap.docs) await deleteDoc(d.ref)
    } else {
      const ok = await confirm(`서울 ${selectedGu} 색칠을 취소할까요?`, { confirmText: '지우기', cancelText: '아니요', destructive: true })
      if (!ok) return
    }
    await removeGu(selectedGu)
    setSelectedGu(null)
  }

  // ── 서울 마이그레이션 ──────────────────────────────────────────
  const startMigration = async () => {
    const coll = profile?.teamId
      ? collection(db, 'teams', profile.teamId, 'records')
      : collection(db, 'users', user.uid, 'records')
    const snap = await getDocs(coll)
    const oldRecs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => !r.gu && SVG_TO_REGION[String(r.regionNum)] === 'seoul')
      .sort((a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0))
    setMigrationRecords(oldRecs)
    setMigrationIdx(0)
    setMigrationAssignments({})
    setMigrating(true)
  }

  const switchToSeoulTab = async (guToSelect = null) => {
    if (!isGuest && isSeoulInVisitedRegions && seoulGus.length === 0) {
      await startMigration()
    } else {
      setActiveTab('seoul')
      setSelectedRegion(null)
      if (guToSelect) setSelectedGu(guToSelect)
    }
  }

  const completeMigration = async (singleGu, assignments) => {
    const gusToColor = new Set()
    if (singleGu) gusToColor.add(singleGu)
    for (const [recordId, gu] of Object.entries(assignments)) {
      const docRef = profile?.teamId
        ? doc(db, 'teams', profile.teamId, 'records', recordId)
        : doc(db, 'users', user.uid, 'records', recordId)
      await updateDoc(docRef, { gu, regionName: `서울특별시 ${gu}` })
      gusToColor.add(gu)
    }
    for (const gu of gusToColor) await addGu(gu)
    const seoulFilter = n => SVG_TO_REGION[String(n)] !== 'seoul'
    if (profile?.teamId) {
      const newRegions = (teamData.visitedRegions || []).filter(seoulFilter)
      await setDoc(doc(db, 'teams', profile.teamId), { visitedRegions: newRegions }, { merge: true })
    } else {
      const newRegions = (profile?.visitedRegions || []).filter(seoulFilter)
      await setDoc(doc(db, 'users', user.uid), { visitedRegions: newRegions }, { merge: true })
    }
    setMigrating(false)
    setActiveTab('seoul')
  }

  const handleMigrationGuSelect = async (gu) => {
    if (migrationRecords.length === 0) {
      await completeMigration(gu, {})
      return
    }
    const record = migrationRecords[migrationIdx]
    const newAssignments = { ...migrationAssignments, [record.id]: gu }
    if (migrationIdx < migrationRecords.length - 1) {
      setMigrationAssignments(newAssignments)
      setMigrationIdx(prev => prev + 1)
    } else {
      await completeMigration(null, newAssignments)
    }
  }

  const handleMigrationCancel = async () => {
    const hasRecs = migrationRecords.length > 0
    const msg = hasRecs
      ? '⚠️ 취소하면 서울 기록이 모두 삭제됩니다.\n정말 취소하시겠어요?'
      : '⚠️ 취소하면 서울 색칠이 지워집니다.\n정말 취소하시겠어요?'
    const ok = await confirm(msg, { confirmText: '취소하기', destructive: true })
    if (!ok) return
    if (hasRecs) {
      for (const r of migrationRecords) {
        const docRef = profile?.teamId
          ? doc(db, 'teams', profile.teamId, 'records', r.id)
          : doc(db, 'users', user.uid, 'records', r.id)
        await deleteDoc(docRef)
      }
    }
    const seoulFilter = n => SVG_TO_REGION[String(n)] !== 'seoul'
    if (profile?.teamId) {
      const newRegions = (teamData.visitedRegions || []).filter(seoulFilter)
      await setDoc(doc(db, 'teams', profile.teamId), { visitedRegions: newRegions }, { merge: true })
    } else {
      const newRegions = (profile?.visitedRegions || []).filter(seoulFilter)
      await setDoc(doc(db, 'users', user.uid), { visitedRegions: newRegions }, { merge: true })
    }
    setMigrating(false)
  }

  const seoulProgress = `${seoulGus.length}/25구`

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      left: '0px', right: '0px',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: '0',
      display: 'flex', flexDirection: 'column',
      background: "url('/바다픽셀.png') center/cover no-repeat",
    }}>
      {newBadges.length > 0 && <BadgePopup badges={newBadges} onClose={() => setNewBadges([])} />}
      {modal}

      {/* ── 서울 마이그레이션 오버레이 ── */}
      {migrating && (() => {
        const currentRec = migrationRecords[migrationIdx]
        const hasRecs = migrationRecords.length > 0
        const assignedGus = Object.values(migrationAssignments)
        const photoURL = currentRec?.photoURLs?.[0] || currentRec?.photoURL || null
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: '#FFFDF8',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            {/* 헤더 */}
            <div style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#2D2D2D', letterSpacing: '-0.3px' }}>
                  {hasRecs ? '이 기록은 서울 어느 구인가요?' : '어느 구를 색칠할까요?'}
                </h2>
                <p style={{ fontSize: 13, color: '#B0B0B0', marginTop: 2 }}>
                  {hasRecs
                    ? `기록 ${migrationIdx + 1} / ${migrationRecords.length} — 지도에서 구를 선택하세요`
                    : '지도에서 구를 선택하세요'}
                </p>
              </div>
              <button onClick={handleMigrationCancel} style={{
                width: 28, height: 28, borderRadius: 14,
                background: '#F0F0F0', color: '#888', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>✕</button>
            </div>

            {/* 현재 기록 미리보기 */}
            {currentRec && (
              <div style={{ padding: '0 16px 8px' }}>
                <div style={{
                  background: 'white', borderRadius: 14,
                  padding: '12px 14px',
                  border: '1.5px solid #FFD6E0',
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  {photoURL && (
                    <img src={photoURL} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: '#FF7BA9', fontWeight: 600, marginBottom: 2 }}>📍 서울 기록</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D2D', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {currentRec.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#B0B0B0', marginTop: 2 }}>
                      {currentRec.travelStartDate?.toDate?.()?.toLocaleDateString('ko-KR') || currentRec.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 서울 지도 */}
            <div style={{ flex: 1, padding: '0 8px 8px', minHeight: 0 }}>
              <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 20 }}>
                <SeoulMap
                  visitedGus={assignedGus}
                  selectedGu={null}
                  onGuClick={handleMigrationGuSelect}
                  onPhotoClick={handleMigrationGuSelect}
                  recordCounts={{}}
                  guPhotos={{}}
                  showPhotos={false}
                />
              </div>
            </div>
          </div>
        )
      })()}

      {/* 이스터에그 */}
      {searchQuery === '사랑해!!' && (
        <>
          {HEART_PARTICLES.map((h, i) => (
            <div key={i} style={{
              position: 'fixed', bottom: 0, left: h.x,
              fontSize: h.size, zIndex: 9999,
              animation: `heartFloat ${h.dur} ease-out ${h.delay} forwards`,
              pointerEvents: 'none', lineHeight: 1,
            }}>❤️</div>
          ))}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: 52, fontWeight: 900, color: '#FF3D90',
              textShadow: '0 4px 24px rgba(255,61,144,0.45)',
              animation: 'heartTextPop 0.45s ease-out forwards',
            }}>사랑해!!</div>
          </div>
        </>
      )}

      {/* ── 게이지 바 ── */}
      <div style={{ flexShrink: 0, padding: '6px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flexShrink: 0, background: '#FF7BA9', color: 'white',
            fontFamily: "'Press Start 2P', cursive", fontSize: 9,
            padding: '5px 8px', borderRadius: 10,
            boxShadow: '0 2px 6px rgba(255,143,171,0.35)',
          }}>
            {activeTab === 'seoul'
              ? `${seoulGus.length}/25`
              : `${completionRate}%`
            }
          </div>
          <div style={{ flex: 1, position: 'relative', height: 40 }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 24,
              borderRadius: 12,
              border: '2px solid rgba(91,141,184,0.5)',
              background: 'rgba(255,255,255,0.5)',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: activeTab === 'seoul'
                  ? `${(seoulGus.length / 25) * 100}%`
                  : `${completionRate}%`,
                background: 'linear-gradient(90deg, #FFE55A, #FFBC00)',
                transition: 'width 0.6s ease',
              }} />
              <div style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                fontFamily: "'Press Start 2P', cursive", fontSize: 7,
                color: 'rgba(60,60,60,0.5)', zIndex: 2, pointerEvents: 'none',
              }}>
                {activeTab === 'seoul'
                  ? `${seoulGus.length}/25`
                  : `${effectiveVisitedRegions.length}/${TOTAL_REGIONS}`
                }
              </div>
            </div>
            <img
              src="/도트삐야_아이콘.png" alt=""
              style={{
                position: 'absolute', bottom: 16,
                left: activeTab === 'seoul'
                  ? `clamp(14px, ${(seoulGus.length / 25) * 100}%, calc(100% - 14px))`
                  : `clamp(14px, ${completionRate}%, calc(100% - 14px))`,
                transform: 'translateX(-50%)',
                width: 28, height: 28, objectFit: 'contain',
                transition: 'left 0.6s ease',
                pointerEvents: 'none', zIndex: 2,
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 검색 바 ── */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 20, padding: '0 12px 5px' }}>
        {searchOpen ? (
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', height: 36 }}>
            <input
              autoFocus type="text" inputMode="search"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="지역 검색(예: 강남구, 서대문구...)"
              style={{
                flex: 1, height: '100%', padding: '0 14px', borderRadius: 18,
                border: 'none', outline: 'none', fontSize: 13,
                background: 'rgba(255,255,255,0.82)', color: '#2D2D2D',
                boxSizing: 'border-box',
              }}
            />
            <button onClick={closeSearch} style={{
              width: 30, height: 30, borderRadius: 15, flexShrink: 0,
              background: 'rgba(255,255,255,0.6)', color: '#555', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        ) : (
          <button onClick={openSearch} style={{
            width: '100%', padding: '5px 14px', borderRadius: 18,
            background: 'rgba(255,255,255,0.82)', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <img src="/도트돋보기삐야.png" alt="" style={{ width: 40, height: 27, flexShrink: 0, objectFit: 'contain' }} />
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
              지역 검색(예: 강남구, 서대문구...)
            </span>
          </button>
        )}

        {/* 검색 결과 드롭다운 */}
        {searchOpen && searchQuery.trim() && searchQuery !== '사랑해!!' && (
          <div style={{
            position: 'absolute', top: '100%', left: 12, right: 12,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            zIndex: 20, maxHeight: 260, overflowY: 'auto',
          }}>
            {/* 구 결과 */}
            {guResults.map((gu, idx) => (
              <button key={`gu-${gu}`}
                onClick={() => {
                  switchToSeoulTab(gu)
                  closeSearch()
                }}
                style={{
                  width: '100%', padding: '11px 16px',
                  textAlign: 'left', fontSize: 14, color: '#2D2D2D',
                  background: 'none', fontWeight: 500,
                  borderBottom: '1px solid #F0F0F0',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 11, color: '#FF8FAB', fontWeight: 700, background: '#FFE8EF', padding: '2px 6px', borderRadius: 6 }}>서울</span>
                🏙️ {gu}
              </button>
            ))}
            {/* 전국 지역 결과 */}
            {regionResults.map((r, idx) => (
              <button key={r.svgNum}
                onClick={() => {
                  setActiveTab('korea')
                  setSelectedRegion(r.svgNum)
                  setSelectedGu(null)
                  closeSearch()
                }}
                style={{
                  width: '100%', padding: '11px 16px',
                  textAlign: 'left', fontSize: 14, color: '#2D2D2D',
                  background: 'none', fontWeight: 500,
                  borderBottom: idx < regionResults.length - 1 ? '1px solid #F0F0F0' : 'none',
                }}
              >
                📍 {r.name}
              </button>
            ))}
            {guResults.length === 0 && regionResults.length === 0 && (
              <p style={{ padding: '14px 16px', fontSize: 13, color: '#B0B0B0', textAlign: 'center' }}>
                검색 결과가 없어요
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 탭 ── */}
      <div style={{ flexShrink: 0, padding: '0 12px 6px', display: 'flex', gap: 6 }}>
        <button
          onClick={() => { setActiveTab('korea'); setSelectedGu(null) }}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: activeTab === 'korea' ? '#FF7BA9' : 'rgba(255,255,255,0.72)',
            color: activeTab === 'korea' ? 'white' : '#888',
            border: activeTab === 'korea' ? 'none' : '1px solid rgba(255,180,200,0.5)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            boxShadow: activeTab === 'korea' ? '0 2px 8px rgba(255,123,169,0.3)' : 'none',
            transition: 'all 0.18s',
          }}
        >🗺️ 전국 탐방</button>
        <button
          onClick={() => switchToSeoulTab()}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: activeTab === 'seoul' ? '#FF7BA9' : 'rgba(255,255,255,0.72)',
            color: activeTab === 'seoul' ? 'white' : '#888',
            border: activeTab === 'seoul' ? 'none' : '1px solid rgba(255,180,200,0.5)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            boxShadow: activeTab === 'seoul' ? '0 2px 8px rgba(255,123,169,0.3)' : 'none',
            transition: 'all 0.18s',
          }}
        >🏙️ 도전! 서울탐방</button>
      </div>

      {/* ── 지도 ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, touchAction: 'none', overflow: 'hidden' }}>
        {activeTab === 'korea' ? (
          <>
            <KoreaMap
              visitedRegions={effectiveVisitedRegions}
              highlightedRegion={selectedRegion}
              recordCounts={effectiveRecordCounts}
              onRegionClick={svgNum => { closeSearch(); setSelectedRegion(svgNum); setSelectedGu(null) }}
              dataLoaded={dataLoaded}
              regionPhotos={effectiveRegionPhotos}
              showPhotoMap={showPhotoMap}
              onPhotoClick={handlePhotoClick}
            />
            {hasPhotos && (
              <button
                onClick={() => setShowPhotoMap(v => !v)}
                style={{
                  position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', right: 12, zIndex: 10,
                  background: showPhotoMap ? '#FF8FAB' : 'rgba(255,255,255,0.9)',
                  color: showPhotoMap ? 'white' : '#FF8FAB',
                  border: '1.5px solid #FFD6E0', borderRadius: 20, padding: '6px 14px',
                  fontSize: 12, fontWeight: 600,
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >{showPhotoMap ? '사진 on' : '사진 off'}</button>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              <SeoulMap
                visitedGus={seoulGus}
                selectedGu={selectedGu}
                onGuClick={gu => { setSelectedGu(gu); setSelectedRegion(null) }}
                onPhotoClick={handleSeoulGuPhotoClick}
                recordCounts={seoulRecordCounts}
                guPhotos={seoulGuPhotos}
                showPhotos={showSeoulPhotos}
              />
              {Object.keys(seoulGuPhotos).length > 0 && (
                <button
                  onClick={() => setShowSeoulPhotos(v => !v)}
                  style={{
                    position: 'absolute', bottom: 12, left: 12, zIndex: 10,
                    background: showSeoulPhotos ? '#FF8FAB' : 'rgba(255,255,255,0.9)',
                    color: showSeoulPhotos ? 'white' : '#FF8FAB',
                    border: '1.5px solid #FFD6E0', borderRadius: 20, padding: '6px 14px',
                    fontSize: 12, fontWeight: 600,
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {showSeoulPhotos ? '사진 on' : '사진 off'}
                </button>
              )}
          </div>
        )}
      </div>

      {/* ── 전국 탭: 서울 선택 시 특별 팝업 ── */}
      {activeTab === 'korea' && selectedRegion && isSeoulSelected && (() => {
        const isTop = TOP_POPUP_REGIONS.has(selectedRegion)
        return (
          <div style={isTop ? {
            position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 120px)',
            left: '0px', right: '0px', zIndex: 150,
            background: 'white', borderRadius: '0 0 20px 20px',
            padding: '14px 16px 16px',
            boxShadow: '0 4px 24px rgba(255,123,169,0.15)',
            animation: 'slideDown 0.22s ease',
          } : {
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            left: '0px', right: '0px', zIndex: 150,
            background: 'white', borderRadius: 20,
            padding: '14px 16px 16px',
            boxShadow: '0 4px 28px rgba(255,123,169,0.15)',
            animation: 'slideUp 0.22s ease',
          }}>
            {!isTop && <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '0 auto 10px' }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#2D2D2D' }}>서울특별시 🏙️</p>
              <button onClick={() => setSelectedRegion(null)} style={{
                width: 26, height: 26, borderRadius: 13,
                background: '#F5F5F5', color: '#888', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
            {seoulGus.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <p style={{ fontSize: 13, color: '#FF7BA9', fontWeight: 700 }}>{seoulGus.length}/25구 탐방 중!</p>
                  <p style={{ fontSize: 12, color: '#C0C0C0' }}>{Math.round(seoulGus.length / 25 * 100)}%</p>
                </div>
                <div style={{ width: '100%', height: 7, background: '#FFE8EF', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(seoulGus.length / 25) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FF8FAB, #FF5499)', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
              </div>
            )}
            {hasSeoulRecords && isSeoulInVisitedRegions && (
              <button
                onClick={() => { onOpenRecord(selectedRegion); navigate('/records') }}
                style={{ ...compactBtn, background: '#FFE8EF', color: '#FF7BA9', marginBottom: 6 }}
              >
                📖 기존 서울 기록 보기
              </button>
            )}
            <button
              onClick={() => switchToSeoulTab()}
              style={{ ...compactBtn, flex: 'none', width: '100%', background: 'linear-gradient(135deg, #FF7BA9, #FF5499)' }}
            >
              🏙️ 서울 구별 탐방하기
            </button>
            {isTop && <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '10px auto 0' }} />}
          </div>
        )
      })()}

      {/* ── 전국 탭: 일반 지역 팝업 ── */}
      {activeTab === 'korea' && selectedRegion && !isSeoulSelected && (() => {
        const isTop = TOP_POPUP_REGIONS.has(selectedRegion)
        return (
          <div style={isTop ? {
            position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 120px)',
            left: '0px', right: '0px', zIndex: 150,
            background: 'white', borderRadius: '0 0 20px 20px',
            padding: '14px 16px 6px',
            boxShadow: '0 4px 24px rgba(255,123,169,0.15)',
            animation: 'slideDown 0.22s ease',
          } : {
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            left: '0px', right: '0px', zIndex: 150,
            background: 'white', borderRadius: 20,
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
                  <p style={{ fontSize: 13, marginTop: 1, fontWeight: 700, color: '#4A90D9' }}>독도는 우리땅 🇰🇷</p>
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
                    fontSize: 13, fontWeight: 600, opacity: isRemoving ? 0.6 : 1,
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
                <button onClick={markVisited} style={{ ...compactBtn }}>🎨 색칠하기</button>
                <button onClick={markAndRecord} style={{ ...compactBtn, background: '#FFE8EF', color: '#FF7BA9' }}>🎨 색칠+기록</button>
              </div>
            )}
            {isTop && <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '10px auto 0' }} />}
          </div>
        )
      })()}

      {/* ── 서울 탭: 구 팝업 ── */}
      {activeTab === 'seoul' && selectedGu && (() => {
        const isGuVisited = seoulGus.includes(selectedGu)
        return (
          <div style={{
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            left: '0px', right: '0px', zIndex: 150,
            background: 'white', borderRadius: 20,
            padding: '14px 16px 16px',
            boxShadow: '0 4px 28px rgba(255,123,169,0.15)',
            animation: 'slideUp 0.22s ease',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '0 auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#2D2D2D' }}>서울 {selectedGu}</p>
                <p style={{ fontSize: 13, marginTop: 2, fontWeight: 600, color: isGuVisited ? '#FF7BA9' : '#C0C0C0' }}>
                  {isGuVisited ? '✅ 방문 완료!' : '아직 방문하지 않은 구예요'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isGuVisited && (
                  <button onClick={unmarkGu} style={{
                    padding: '4px 10px', borderRadius: 12,
                    background: '#FFF0F0', color: '#FF6B6B', fontSize: 13, fontWeight: 600,
                  }}>색칠 취소</button>
                )}
                <button onClick={() => setSelectedGu(null)} style={{
                  width: 26, height: 26, borderRadius: 13,
                  background: '#F5F5F5', color: '#888', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            </div>
            {isGuVisited ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { onOpenRecord(SEOUL_REPRESENTATIVE_SVG, selectedGu); navigate('/records') }} style={{ ...compactBtn }}>
                  📖 기록 보기
                </button>
                <button onClick={markGuAndRecord} style={{ ...compactBtn, background: '#FFE8EF', color: '#FF7BA9' }}>
                  ✍️ 기록 추가
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={markGuVisited} style={{ ...compactBtn }}>🎨 색칠하기</button>
                <button onClick={markGuAndRecord} style={{ ...compactBtn, background: '#FFE8EF', color: '#FF7BA9' }}>🎨 색칠+기록</button>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

const compactBtn = {
  flex: 1, padding: '11px 8px', borderRadius: 14,
  background: '#FF7BA9', color: 'white',
  fontSize: 14, fontWeight: 700,
  letterSpacing: '-0.2px', textAlign: 'center',
}

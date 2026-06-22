import { useState, useEffect, Fragment } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove, collection, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmModal'

const profileCache = {}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function TeamPage({ user, onSelectRecord }) {
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState('main')
  const [editingName, setEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [memberProfiles, setMemberProfiles] = useState({})
  const [recentRecords, setRecentRecords] = useState([])
  const [showAllRecords, setShowAllRecords] = useState(false)
  const navigate = useNavigate()
  const { confirm, modal } = useConfirm()

  const isGuest = user?.isAnonymous

  useEffect(() => {
    if (!user || isGuest) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : {})
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

  useEffect(() => {
    if (!teamData?.members?.length) return
    const fetchMembers = async () => {
      const toFetch = teamData.members.filter(uid => !profileCache[uid])
      for (const uid of toFetch) {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists()) profileCache[uid] = snap.data()
      }
      const profiles = {}
      for (const uid of teamData.members) {
        if (profileCache[uid]) profiles[uid] = profileCache[uid]
      }
      setMemberProfiles(profiles)
    }
    fetchMembers()
  }, [teamData?.members?.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile?.teamId) return
    const q = showAllRecords
      ? query(collection(db, 'teams', profile.teamId, 'records'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'teams', profile.teamId, 'records'), orderBy('createdAt', 'desc'), limit(5))
    const unsub = onSnapshot(q, snap => {
      setRecentRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [profile?.teamId, showAllRecords])

  const clearPersonalData = async () => {
    const recordsSnap = await getDocs(collection(db, 'users', user.uid, 'records'))
    for (const d of recordsSnap.docs) await deleteDoc(d.ref)
    await updateDoc(doc(db, 'users', user.uid), { visitedRegions: [], seoulGus: [] })
  }

  const confirmClear = async (message) => {
    const hasData = (profile?.visitedRegions?.length || 0) > 0 || (profile?.seoulGus?.length || 0) > 0
    if (!hasData) return true
    return confirm(message, { confirmText: '계속', destructive: true })
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    if (profile?.teamId) return alert('이미 팀에 가입되어 있어요. 먼저 팀에서 나간 뒤 시도해주세요.')
    const ok = await confirmClear(
      '⚠️ 개인 지도에 색칠된 지역이 있어요.\n팀 생성 시 개인 지도와 기록이 모두 초기화됩니다.\n계속하시겠어요?'
    )
    if (!ok) return
    // 코드 충돌 방지: 이미 존재하는 코드면 재생성
    let code = generateCode()
    while ((await getDoc(doc(db, 'teams', code))).exists()) {
      code = generateCode()
    }
    await setDoc(doc(db, 'teams', code), {
      name: teamName,
      code,
      members: [user.uid],
      visitedRegions: [],
      createdAt: new Date(),
    })
    await clearPersonalData()
    await updateDoc(doc(db, 'users', user.uid), { teamId: code })
    setMode('main')
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return
    if (profile?.teamId) return alert('이미 팀에 가입되어 있어요. 먼저 팀에서 나간 뒤 시도해주세요.')
    const teamRef = doc(db, 'teams', joinCode.toUpperCase())
    const snap = await getDoc(teamRef)
    if (!snap.exists()) return alert('존재하지 않는 팀 코드예요')
    const ok = await confirmClear(
      `⚠️ 개인 지도에 색칠된 지역이 있어요.\n"${snap.data().name}" 팀 참여 시 개인 지도와 기록이 모두 초기화됩니다.\n계속하시겠어요?`
    )
    if (!ok) return
    await updateDoc(teamRef, { members: arrayUnion(user.uid) })
    await clearPersonalData()
    await updateDoc(doc(db, 'users', user.uid), { teamId: joinCode.toUpperCase() })
    setMode('main')
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveTeam = async () => {
    const memberCount = teamData?.members?.length || 0

    if (memberCount <= 2) {
      const ok = await confirm(
        `⚠️ 현재 팀원이 ${memberCount}명이에요.\n나가면 팀이 해체되고 모든 팀 기록이 영구 삭제됩니다.\n계속하시겠어요?`,
        { confirmText: '해체하기', destructive: true }
      )
      if (!ok) return
      const teamRecords = await getDocs(collection(db, 'teams', profile.teamId, 'records'))
      for (const d of teamRecords.docs) await deleteDoc(d.ref)
      await deleteDoc(doc(db, 'teams', profile.teamId))
      for (const uid of (teamData.members || [])) {
        if (uid !== user.uid) {
          // 상대방 personal records도 삭제 → 깨끗한 개인 지도로 복귀
          const otherPersonalSnap = await getDocs(collection(db, 'users', uid, 'records'))
          for (const d of otherPersonalSnap.docs) await deleteDoc(d.ref)
          await updateDoc(doc(db, 'users', uid), { teamId: null, visitedRegions: [], seoulGus: [] })
        }
      }
    } else {
      const ok = await confirm(
        '팀에서 나가면 빈 개인 지도로 돌아가요.\n같은 초대 코드로 다시 참여하면 팀 기록을 이어받을 수 있어요.\n계속하시겠어요?',
        { confirmText: '나가기', destructive: true }
      )
      if (!ok) return
      await updateDoc(doc(db, 'teams', profile.teamId), { members: arrayRemove(user.uid) })
    }

    const personalRecords = await getDocs(collection(db, 'users', user.uid, 'records'))
    for (const d of personalRecords.docs) await deleteDoc(d.ref)
    await updateDoc(doc(db, 'users', user.uid), { teamId: null, visitedRegions: [], seoulGus: [] })
  }

  const saveTeamName = async () => {
    const name = newTeamName.trim()
    if (!name || name === teamData.name) { setEditingName(false); return }
    await updateDoc(doc(db, 'teams', profile.teamId), { name })
    setEditingName(false)
  }

  const handleRecordClick = (record) => {
    if (onSelectRecord) onSelectRecord({ recordId: record.id, teamId: profile.teamId })
    navigate('/record-detail')
  }

  // 게스트 모드 — profile 로딩 전에 먼저 처리
  if (isGuest) {
    return (
      <div style={{
        position: 'fixed', top: 0, bottom: 0,
        left: '0px', right: '0px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'env(safe-area-inset-top, 0px) 32px 80px',
        textAlign: 'center', background: '#FFFDF8', overflowY: 'auto',
      }}>
        <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 16, opacity: 0.6 }} />
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
          팀 기능은 회원만 사용할 수 있어요
        </p>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 32, lineHeight: 1.6, fontFamily: "'Nanum Square Round', sans-serif" }}>
          게스트 모드에서는 팀 연결이 불가능해요.{'\n'}
          회원가입 후 팀을 만들어보세요!
        </p>
        <button
          onClick={() => navigate('/register')}
          style={btnStyle}
        >
          회원가입하기 🐥
        </button>
      </div>
    )
  }

  // 프로필 로딩 중
  if (profile === null) {
    return (
      <div style={{
        position: 'fixed', top: 0, bottom: 0,
        left: '0px', right: '0px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FFFDF8',
      }}>
        <p style={{ color: '#FFB3C6', fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  // 팀 소속이지만 팀 데이터 로딩 중
  if (profile?.teamId && !teamData) {
    return (
      <div style={{
        position: 'fixed', top: 0, bottom: 0,
        left: '0px', right: '0px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FFFDF8',
      }}>
        <p style={{ color: '#FFB3C6', fontSize: 14 }}>팀 정보 불러오는 중...</p>
      </div>
    )
  }

  if (profile?.teamId && teamData) {
    return (
      <div style={{ position: 'fixed', top: 0, bottom: 0, left: '0px', right: '0px', padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', background: '#FFFDF8', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {modal}
        {/* 팀 이름 + 수정 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {editingName ? (
            <>
              <input
                autoFocus
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTeamName()}
                style={{ ...inputStyle, flex: 1, fontSize: 18, fontWeight: 'bold', padding: '8px 12px' }}
              />
              <button onClick={saveTeamName} style={{ padding: '8px 14px', borderRadius: 12, background: '#FF8FAB', color: 'white', fontSize: 13, fontWeight: 700 }}>저장</button>
              <button onClick={() => setEditingName(false)} style={{ padding: '8px 12px', borderRadius: 12, background: '#F5F5F5', color: '#888', fontSize: 13 }}>취소</button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#333', fontFamily: "'Gowun Dodum', sans-serif" }}>{teamData.name}</h2>
              <button
                onClick={() => { setNewTeamName(teamData.name); setEditingName(true) }}
                style={{ padding: '4px 10px', borderRadius: 10, background: '#FFE8EF', color: '#FF8FAB', fontSize: 13, fontWeight: 600 }}
              >
                이름 변경
              </button>
            </>
          )}
        </div>

        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
          팀원 {teamData.members?.length || 0}명
        </p>

        {/* 팀원 목록 */}
        <div style={{ padding: '16px 20px', background: '#FFF0F5', borderRadius: 16, border: '1.5px solid #FFD6E0' }}>
          <p style={{ fontSize: 13, color: '#B0B0B0', marginBottom: 12 }}>팀원</p>
          {teamData.members?.map(uid => {
            const mp = memberProfiles[uid]
            return (
              <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <img
                  src={mp?.photoURL || '/도트삐야_아이콘.png'}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFD6E0', flexShrink: 0 }}
                />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D2D', fontFamily: "'Gowun Dodum', sans-serif" }}>
                    {mp?.nickname || '여행자'}
                    {uid === user.uid && <span style={{ fontSize: 12, color: '#FF8FAB', marginLeft: 6, fontFamily: "'NeoDGM', sans-serif" }}>나</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 최근 기록 / 전체 기록 */}
        {recentRecords.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D2D' }}>
                {showAllRecords ? '전체 기록' : '최근 기록'}
              </p>
              <button
                onClick={() => setShowAllRecords(v => !v)}
                style={{ fontSize: 12, color: '#FF8FAB', background: 'none', padding: '2px 0' }}
              >
                {showAllRecords ? '접기 ↑' : '더보기 →'}
              </button>
            </div>
            {(showAllRecords
            ? [...recentRecords].sort((a, b) => {
                const da = a.travelStartDate?.toDate?.() || a.travelDate?.toDate?.() || a.createdAt?.toDate?.() || new Date(0)
                const db2 = b.travelStartDate?.toDate?.() || b.travelDate?.toDate?.() || b.createdAt?.toDate?.() || new Date(0)
                return db2 - da
              })
            : recentRecords
          ).map((record, idx, list) => {
              const displayDate = record.travelStartDate?.toDate?.() || record.travelDate?.toDate?.() || record.createdAt?.toDate?.()
              const dateStr = displayDate
                ? displayDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
                : ''
              const author = memberProfiles[record.authorUid]
              const date = displayDate
              const prevDate = idx > 0
                ? (list[idx - 1].travelStartDate?.toDate?.() || list[idx - 1].travelDate?.toDate?.() || list[idx - 1].createdAt?.toDate?.())
                : null
              const showMonthHeader = showAllRecords && date && (
                !prevDate ||
                date.getFullYear() !== prevDate.getFullYear() ||
                date.getMonth() !== prevDate.getMonth()
              )
              return (
                <Fragment key={record.id}>
                  {showMonthHeader && (
                    <p style={{ fontSize: 12, color: '#FF8FAB', fontWeight: 700, marginTop: idx > 0 ? 16 : 0, marginBottom: 8 }}>
                      {date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                    </p>
                  )}
                  <button
                    onClick={() => handleRecordClick(record)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: 'white', borderRadius: 14,
                      padding: '14px 16px', marginBottom: 10,
                      border: '1px solid #FFF0F5',
                      boxShadow: '0 2px 8px rgba(255,123,169,0.08)',
                      display: 'block',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: 8 }}>
                        <p style={{ fontSize: 13, color: '#FF7BA9', fontWeight: 600, marginBottom: 3 }}>
                          📍 {record.gu ? `서울 ${record.gu}` : record.regionName}
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D2D', marginBottom: 3, fontFamily: "'Gowun Dodum', sans-serif" }}>
                          {record.title}
                        </p>
                        <p style={{ fontSize: 12, color: '#B0B0B0' }}>
                          {author?.nickname || '여행자'} · {dateStr}
                        </p>
                      </div>
                      {record.photoURL || record.photoURLs?.[0] ? (
                        <img
                          src={record.photoURL || record.photoURLs[0]}
                          alt=""
                          style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : null}
                    </div>
                  </button>
                </Fragment>
              )
            })}
          </div>
        )}

        {/* 초대 코드 */}
        <div style={{ ...cardStyle, marginTop: 24 }}>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>초대 코드</p>
          <p style={{ fontSize: 32, fontWeight: 'bold', color: '#FF8FAB', letterSpacing: 6, fontFamily: "'Nanum Square Round', sans-serif" }}>
            {teamData.code}
          </p>
        </div>

        <button
          onClick={() => handleCopy(`나랑 같이 우리나라 도장깨기 하지 않을래..? ૮ • ﻌ -ა ♥\n초대 코드: ${teamData.code}\nhttps://apps.apple.com/kr/app/%EC%B1%84%EC%9B%8C%EC%A7%80%EB%8F%84/id6773252339`)}
          style={btnStyle}>
          {copied ? '✅ 복사됨!' : '📋 팀 코드 복사하기'}
        </button>

        {/* 팀 나가기 */}
        <button
          onClick={handleLeaveTeam}
          style={{ marginTop: 32, width: '100%', padding: '13px', borderRadius: 14, background: '#FFF0F0', color: '#FF6B6B', fontSize: 14, fontWeight: 600 }}
        >
          팀에서 나가기
        </button>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div style={{ position: 'fixed', top: 0, bottom: 0, left: '0px', right: '0px', padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', background: '#FFFDF8', overflowY: 'auto' }}>
        {modal}
        <button onClick={() => setMode('main')} style={{ background: 'none', fontSize: 20, marginBottom: 16 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>팀 만들기</h2>
        <p style={{ fontSize: 13, color: '#B0B0B0', marginBottom: 24, lineHeight: 1.6, fontFamily: "'Nanum Square Round', sans-serif" }}>
          팀원들과 함께 지도를 채워보세요! 팀에 참여하면 팀 지도로 함께 시작해요.
        </p>
        <input
          placeholder="팀 이름"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleCreateTeam} style={btnStyle}>팀 만들기</button>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div style={{ position: 'fixed', top: 0, bottom: 0, left: '0px', right: '0px', padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', background: '#FFFDF8', overflowY: 'auto' }}>
        {modal}
        <button onClick={() => setMode('main')} style={{ background: 'none', fontSize: 20, marginBottom: 16 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>팀 참여하기</h2>
        <p style={{ fontSize: 13, color: '#B0B0B0', marginBottom: 24, lineHeight: 1.6, fontFamily: "'Nanum Square Round', sans-serif" }}>
          초대 코드를 입력해서 팀에 참여하세요. 팀이 색칠해놓은 지도부터 함께 시작해요!
        </p>
        <input
          placeholder="초대 코드 6자리"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          style={inputStyle}
          maxLength={6}
        />
        <button onClick={handleJoinTeam} style={btnStyle}>참여하기</button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      left: '0px', right: '0px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'env(safe-area-inset-top, 0px) 32px 80px',
      background: '#FFFDF8', overflowY: 'auto',
    }}>
      <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 16, opacity: 0.7 }} />
      <p style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>아직 팀이 없어요</p>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 32, textAlign: 'center' }}>
        함께 지도를 채울 팀을 만들거나 참여해보세요!
      </p>
      <button onClick={() => setMode('create')} style={btnStyle}>팀 만들기</button>
      <button onClick={() => setMode('join')} style={{ ...btnStyle, background: '#FFE8EF', color: '#FF8FAB', marginTop: 8 }}>
        초대 코드로 참여하기
      </button>
    </div>
  )
}

const cardStyle = {
  background: '#FFF0F5',
  borderRadius: 16,
  padding: '20px 24px',
  marginBottom: 16,
  textAlign: 'center',
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #FFD6E0',
  fontSize: 14,
  outline: 'none',
  background: 'white',
  marginBottom: 12,
  display: 'block',
  fontFamily: "'Nanum Square Round', sans-serif",
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

import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function TeamPage({ user }) {
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState('main')

  const isGuest = user?.isAnonymous

  useEffect(() => {
    if (!user || isGuest) return
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

  const clearPersonalData = async () => {
    await updateDoc(doc(db, 'users', user.uid), {
      visitedRegions: [],
    })
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    const confirmed = window.confirm(
      '⚠️ 팀을 만들면 개인 색칠 데이터와 기록이 초기화돼요.\n\n팀원들과 함께 처음부터 시작하게 됩니다. 계속 하시겠어요?'
    )
    if (!confirmed) return
    const code = generateCode()
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
    const teamRef = doc(db, 'teams', joinCode.toUpperCase())
    const snap = await getDoc(teamRef)
    if (!snap.exists()) return alert('존재하지 않는 팀 코드예요')
    const confirmed = window.confirm(
      `⚠️ "${snap.data().name}" 팀에 참여하면 개인 색칠 데이터와 기록이 초기화돼요.\n\n팀이 색칠해놓은 지도부터 함께 시작하게 됩니다. 계속 하시겠어요?`
    )
    if (!confirmed) return
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

  // 게스트 모드
  if (isGuest) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
        padding: '0 32px',
        textAlign: 'center',
      }}>
        <img src="/삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 16, opacity: 0.6 }} />
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
          팀 기능은 회원만 사용할 수 있어요
        </p>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 32, lineHeight: 1.6 }}>
          게스트 모드에서는 팀 연결이 불가능해요.{'\n'}
          회원가입 후 팀을 만들어보세요!
        </p>
        <button
          onClick={() => window.location.href = '/register'}
          style={btnStyle}
        >
          회원가입하기 🐥
        </button>
      </div>
    )
  }

  if (profile?.teamId && teamData) {
    return (
      <div style={{ padding: '24px 20px 100px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
          {teamData.name}
        </h2>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>
          팀원 {teamData.members?.length || 0}명
        </p>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>초대 코드</p>
          <p style={{ fontSize: 32, fontWeight: 'bold', color: '#FF8FAB', letterSpacing: 6 }}>
            {teamData.code}
          </p>
        </div>
        <button onClick={() => handleCopy(teamData.code)} style={btnStyle}>
          {copied ? '✅ 복사됨!' : '📋 코드 복사하기'}
        </button>
        <button
          onClick={() => handleCopy(`나랑 같이 우리나라 도장깨기 하지 않을래..? ૮ • ﻌ -ა ♥\n초대 코드: ${teamData.code}`)}
          style={{ ...btnStyle, background: '#FFE8EF', color: '#FF8FAB', marginTop: 8 }}>
          💌 초대 문구 복사하기
        </button>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div style={{ padding: '24px 20px' }}>
        <button onClick={() => setMode('main')} style={{ background: 'none', fontSize: 20, marginBottom: 16 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>팀 만들기</h2>
        <p style={{ fontSize: 13, color: '#FF8FAB', marginBottom: 24, lineHeight: 1.6 }}>
          ⚠️ 팀 생성 시 개인 색칠 데이터와 기록이 초기화돼요. 팀원들과 함께 처음부터 시작해요!
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
      <div style={{ padding: '24px 20px' }}>
        <button onClick={() => setMode('main')} style={{ background: 'none', fontSize: 20, marginBottom: 16 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>팀 참여하기</h2>
        <p style={{ fontSize: 13, color: '#FF8FAB', marginBottom: 24, lineHeight: 1.6 }}>
          ⚠️ 팀 참여 시 개인 색칠 데이터와 기록이 초기화돼요. 팀이 색칠해놓은 지도부터 함께 시작해요!
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
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      padding: '0 32px',
    }}>
      <img src="/삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 16, opacity: 0.7 }} />
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
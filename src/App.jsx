import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, messaging, requestNotificationPermission, onMessage } from './firebase'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import TeamPage from './pages/TeamPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import RecordPage from './pages/RecordPage'
import RecordListPage from './pages/RecordListPage'
import RecordDetailPage from './pages/RecordDetailPage'
import TabBar from './components/TabBar'
import SplashScreen from './components/SplashScreen'
import OnboardingScreen from './components/OnboardingScreen'
import TwemojiImg from './components/TwemojiImg'

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" />
  return children
}

function CompleteProfileScreen({ user, onComplete }) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (nickname.length < 2) return setError('닉네임은 2자 이상이어야 해요')
    setSaving(true)
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      const data = {
        nickname,
        email: user.email || null,
        photoURL: user.photoURL || null,
      }
      // 기존 문서가 없는 신규 유저만 초기값 세팅 (게스트 지역 마이그레이션)
      if (!snap.exists()) {
        const guestRegions = (() => {
          try { return JSON.parse(localStorage.getItem('guestVisitedRegions') || '[]') } catch { return [] }
        })()
        data.visitedRegions = guestRegions
        data.teamId = null
        data.createdAt = new Date()
      }
      await setDoc(doc(db, 'users', user.uid), data, { merge: true })
      localStorage.removeItem('guestVisitedRegions')
      onComplete()
    } catch {
      setError('저장에 실패했어요')
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#FFF9FB', padding: '0 32px',
    }}>
      <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 12 }} />
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FF8FAB', marginBottom: 6 }}>거의 다 왔어요!</h1>
      <p style={{ fontSize: 13, color: '#B0B0B0', marginBottom: 24 }}>채워지도에서 사용할 닉네임을 입력해주세요</p>
      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="닉네임 (2자 이상)"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          style={{
            padding: '14px 18px', borderRadius: 16,
            border: '1.5px solid #FFD6E0', fontSize: 14,
            outline: 'none', background: 'white', width: '100%',
          }}
          autoFocus
        />
        {error && <p style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{error}</p>}
        <button type="submit" disabled={saving} style={{
          width: '100%', padding: '15px', borderRadius: 16,
          background: saving ? '#FFB3C6' : 'linear-gradient(135deg, #FF7BA9, #FF5499)',
          color: 'white', fontSize: 15, fontWeight: 700,
          boxShadow: saving ? 'none' : '0 4px 16px rgba(255,123,169,0.4)',
        }}>
          {saving ? '저장 중...' : '시작하기 🐥'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [hasTeam, setHasTeam] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [recordRegion, setRecordRegion] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [notification, setNotification] = useState(null)
  const onboardingChecked = useRef(false)

  useEffect(() => {
    // 안전망: 8초 안에 auth 응답 없으면 강제로 로딩 해제
    const timeout = setTimeout(() => setLoading(false), 8000)

    const unsub = onAuthStateChanged(auth, async (u) => {
      clearTimeout(timeout)
      let profileComplete = true
      try {
        if (u && !u.isAnonymous) {
          const snap = await getDoc(doc(db, 'users', u.uid))
          profileComplete = snap.exists() && !!snap.data().nickname
          setNeedsProfile(!profileComplete)
        } else {
          setNeedsProfile(false)
        }
      } catch (err) {
        console.error('Auth state handler error:', err)
        setNeedsProfile(false)
      }
      setUser(u)
      setLoading(false)
      if (u && profileComplete && !onboardingChecked.current) {
        onboardingChecked.current = true
        if (!localStorage.getItem('onboardingDone')) {
          setShowOnboarding(true)
        }
        requestNotificationPermission(u.uid)
      }
    })
    return () => { clearTimeout(timeout); unsub() }
  }, [])

  useEffect(() => {
    if (!user || user.isAnonymous) { setHasTeam(false); return }
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      setHasTeam(!!(snap.exists() && snap.data().teamId))
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user || !messaging) return
    const unsub = onMessage(messaging, (payload) => {
      setNotification({
        title: payload.notification?.title,
        body: payload.notification?.body,
      })
      setTimeout(() => setNotification(null), 4000)
    })
    return unsub
  }, [user])

  const handleOnboardingDone = () => {
    localStorage.setItem('onboardingDone', 'true')
    setShowOnboarding(false)
  }

  const handleProfileComplete = () => {
    setNeedsProfile(false)
    if (!onboardingChecked.current) {
      onboardingChecked.current = true
      if (!localStorage.getItem('onboardingDone')) {
        setShowOnboarding(true)
      }
    }
    if (user) requestNotificationPermission(user.uid)
  }

  if (loading) return <SplashScreen />
  if (needsProfile && user) return <CompleteProfileScreen user={user} onComplete={handleProfileComplete} />

  return (
    <BrowserRouter>
      {showOnboarding && <OnboardingScreen onDone={handleOnboardingDone} />}

      {notification && (
        <div style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          borderRadius: 16,
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          maxWidth: 320,
          width: '90%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: '1.5px solid #FFD6E0',
        }}>
          <TwemojiImg code="1f514" size={24} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{notification.title}</p>
            <p style={{ fontSize: 13, color: '#aaa' }}>{notification.body}</p>
          </div>
        </div>
      )}

      <Routes>
        {/* 게스트(익명) 유저는 로그인/회원가입 페이지에 접근 가능 */}
        <Route path="/login" element={user && !user.isAnonymous ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user && !user.isAnonymous ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <MapPage user={user} onOpenRecord={setRecordRegion} />
          </ProtectedRoute>
        } />
        <Route path="/record" element={
          <ProtectedRoute user={user}>
            <RecordPage user={user} regionNum={recordRegion} />
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute user={user}>
            <RecordListPage
              user={user}
              regionNum={recordRegion}
              onSelectRecord={setSelectedRecord}
            />
          </ProtectedRoute>
        } />
        <Route path="/record-detail" element={
          <ProtectedRoute user={user}>
            <RecordDetailPage
              user={user}
              recordId={selectedRecord?.recordId}
              teamId={selectedRecord?.teamId}
            />
          </ProtectedRoute>
        } />
        <Route path="/team" element={<ProtectedRoute user={user}><TeamPage user={user} onSelectRecord={setSelectedRecord} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage user={user} /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute user={user}><EditProfilePage user={user} /></ProtectedRoute>} />
      </Routes>
      {user && <TabBar hasTeam={hasTeam} />}
    </BrowserRouter>
  )
}

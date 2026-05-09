import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, messaging, requestNotificationPermission, onMessage } from './firebase'
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
import './index.css'

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recordRegion, setRecordRegion] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      if (u) {
        await requestNotificationPermission(u.uid)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = onMessage(messaging, (payload) => {
      setNotification({
        title: payload.notification?.title,
        body: payload.notification?.body,
      })
      setTimeout(() => setNotification(null), 4000)
    })
    return unsub
  }, [user])

  if (loading) return <SplashScreen />

  return (
    <BrowserRouter>
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
          <span style={{ fontSize: 24 }}>🔔</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{notification.title}</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>{notification.body}</p>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
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
        <Route path="/team" element={<ProtectedRoute user={user}><TeamPage user={user} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage user={user} /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute user={user}><EditProfilePage user={user} /></ProtectedRoute>} />
      </Routes>
      {user && <TabBar />}
    </BrowserRouter>
  )
}
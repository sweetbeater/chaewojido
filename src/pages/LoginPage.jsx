import { useState } from 'react'
import { signInWithEmailAndPassword, signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, OAuthProvider, signInWithCredential } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'

const DOTS = [
  { left: '6%',  top: '7%',  s: 8, c: '#FFD85C' },
  { left: '20%', top: '3%',  s: 5, c: '#8FE3CF' },
  { left: '38%', top: '5%',  s: 6, c: '#FF7BA9' },
  { left: '58%', top: '2%',  s: 4, c: '#FFD85C' },
  { left: '76%', top: '6%',  s: 7, c: '#8FE3CF' },
  { left: '90%', top: '3%',  s: 5, c: '#FF7BA9' },
  { left: '3%',  top: '18%', s: 5, c: '#8FE3CF' },
  { left: '88%', top: '16%', s: 6, c: '#FFD85C' },
  { left: '14%', top: '28%', s: 4, c: '#FF7BA9' },
  { left: '72%', top: '22%', s: 8, c: '#FFD85C' },
  { left: '46%', top: '12%', s: 5, c: '#8FE3CF' },
  { left: '28%', top: '22%', s: 6, c: '#FFD85C' },
  { left: '64%', top: '17%', s: 4, c: '#FF7BA9' },
  { left: '93%', top: '30%', s: 5, c: '#8FE3CF' },
  { left: '7%',  top: '36%', s: 6, c: '#FFD85C' },
  { left: '80%', top: '38%', s: 4, c: '#FF7BA9' },
  { left: '50%', top: '30%', s: 5, c: '#FFD85C' },
  { left: '32%', top: '38%', s: 4, c: '#8FE3CF' },
]

const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

function generateNonce(len = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => chars[b % chars.length]).join('')
}
async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않아요')
    }
  }

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const snap = await getDoc(doc(db, 'users', result.user.uid))
      if (!snap.exists()) {
        await signOut(auth)
        setError('가입된 계정이 없어요. 먼저 회원가입을 해주세요.')
        return
      }
      // nickname 없으면 App.jsx의 CompleteProfileScreen이 처리
      navigate('/')
    } catch {
      setError('구글 로그인에 실패했어요')
    }
  }

  const handleGuest = async () => {
    try {
      await signInAnonymously(auth)
      navigate('/')
    } catch {
      setError('게스트 로그인에 실패했어요')
    }
  }

  const handleApple = async () => {
    try {
      const rawNonce = generateNonce()
      const hashedNonce = await sha256hex(rawNonce)
      const res = await SignInWithApple.authorize({
        clientId: 'io.chaewojido.app',
        redirectURI: '',
        scopes: 'email name',
        nonce: hashedNonce,
      })
      const credential = new OAuthProvider('apple.com').credential({
        idToken: res.response.identityToken,
        rawNonce,
      })
      const { user } = await signInWithCredential(auth, credential)
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) {
        await signOut(auth)
        setError('가입된 계정이 없어요. 먼저 회원가입을 해주세요.')
        return
      }
      navigate('/')
    } catch (err) {
      const cancelled = ['USER_CANCELLED', 'SIGN_IN_CANCELLED'].includes(err.code) ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('cancel'))
      if (!cancelled) setError('애플 로그인에 실패했어요')
    }
  }

  const handleReset = async () => {
    if (!email.trim()) return setError('비밀번호를 재설정할 이메일을 입력해주세요')
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      setError('')
    } catch {
      setError('이메일을 찾을 수 없어요')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(155deg, #4A0E8F 0%, #9B3FD4 22%, #E91E8C 50%, #FF5C47 75%, #FFD166 100%)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* 픽셀 도트 장식 */}
      {DOTS.map((d, i) => (
        <div key={i} style={{
          position: 'absolute', left: d.left, top: d.top,
          width: d.s, height: d.s, background: d.c, opacity: 0.7,
          pointerEvents: 'none',
        }} />
      ))}

      {/* 히어로 섹션 */}
      <div style={{
        flex: '0 1 auto', minHeight: 160,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'calc(env(safe-area-inset-top, 0px) + 32px) 28px 28px',
        position: 'relative', zIndex: 1,
      }}>
        {/* 삐야 픽셀 프레임 */}
        <div style={{
          width: 96, height: 96,
          background: 'rgba(255,255,255,0.18)',
          border: '3px solid rgba(255,255,255,0.5)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 0 0 3px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
        }}>
          <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 78, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }} />
        </div>

        <h1 style={{
          fontFamily: "'NeoDGM', sans-serif",
          fontSize: 38,
          fontWeight: 400,
          color: 'white',
          marginBottom: 8,
          textShadow: '0 2px 16px rgba(0,0,0,0.25)',
          lineHeight: 1.2,
        }}>
          채워지도
        </h1>
        <p style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.75)',
          letterSpacing: '0.3px',
          textShadow: '0 1px 6px rgba(0,0,0,0.2)',
        }}>
          삐야와 함께하는 지도 탐방
        </p>
      </div>

      {/* 폼 카드 */}
      <div style={{
        background: 'white',
        borderRadius: '28px 28px 0 0',
        padding: `32px 28px calc(env(safe-area-inset-bottom, 0px) + 28px)`,
        boxShadow: '0 -6px 32px rgba(0,0,0,0.12)',
        position: 'relative', zIndex: 1,
      }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email" placeholder="이메일"
            value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password" placeholder="비밀번호"
            value={password} onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center', fontWeight: 500 }}>{error}</p>}
          {resetSent && <p style={{ color: '#FF7BA9', fontSize: 13, textAlign: 'center', fontWeight: 500 }}>재설정 이메일을 보냈어요 ✉️</p>}
          <button type="submit" style={primaryBtn}>로그인</button>
        </form>

        <button onClick={handleReset} style={{ marginTop: 10, fontSize: 13, color: '#B0B0B0', background: 'none', display: 'block', margin: '10px auto 0' }}>
          비밀번호를 잊으셨나요?
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
          <span style={{ fontSize: 13, color: '#C0C0C0' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
        </div>

        {isNative ? (
          <div style={{ ...outlineBtn, opacity: 0.45, cursor: 'not-allowed', flexDirection: 'column', gap: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GoogleIcon />
              구글로 로그인
            </span>
            <span style={{ fontSize: 11, color: '#999' }}>iOS 앱에서는 지원되지 않아요</span>
          </div>
        ) : (
          <button onClick={handleGoogle} style={{
            ...outlineBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <GoogleIcon />
            구글로 로그인
          </button>
        )}
        {isNative && (
          <p style={{ fontSize: 12, color: '#AAA', textAlign: 'center', marginTop: 6, lineHeight: 1.6 }}>
            구글로 가입하셨다면 해당 이메일을 입력 후<br />
            '비밀번호를 잊으셨나요?'를 눌러 비밀번호를 설정해주세요
          </p>
        )}

        {isNative && (
          <button onClick={handleApple} style={{ ...outlineBtn, marginTop: 10, background: '#000', color: '#fff', borderColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AppleIcon />
            Apple로 로그인
          </button>
        )}

        <button onClick={handleGuest} style={{ ...outlineBtn, marginTop: 10, color: '#888', borderColor: '#E0E0E0' }}>
          👤 게스트로 시작하기
        </button>

        <p style={{ fontSize: 10, color: '#C0C0C0', marginTop: 8, textAlign: 'center', lineHeight: 1.7 }}>
          게스트 모드는 서버 저장 및 팀 기능을 사용할 수 없어요
        </p>

        <button onClick={() => navigate('/register')} style={{ marginTop: 16, fontSize: 13, color: '#B0B0B0', background: 'none', display: 'block', margin: '16px auto 0' }}>
          아직 계정이 없으신가요? <span style={{ color: '#FF7BA9', fontWeight: 700 }}>회원가입</span>
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="15" height="18" viewBox="0 0 15 18" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.42 9.6c-.01-1.59.84-2.99 2.08-3.79-.81-1.16-2.07-1.86-3.48-1.89-1.48-.14-2.9.87-3.65.87-.76 0-1.92-.85-3.16-.83C2.21 4.01.5 5.17.5 7.84c0 3.44 2.3 8.68 4.81 8.68 1.22.01 1.7-.79 3.17-.79 1.46 0 1.91.79 3.18.77 2.1-.03 3.57-3.97 3.84-5.4-1.55-.65-3.08-2.05-3.08-3.5zM9.56 2.56C10.37 1.57 10.85.34 10.75 0 9.6.05 8.27.77 7.43 1.79c-.76.92-1.28 2.18-1.16 3.46 1.24.1 2.5-.61 3.29-2.69z"/>
    </svg>
  )
}

const inputStyle = {
  padding: '14px 18px', borderRadius: 16,
  border: '1.5px solid #FFD6E0', fontSize: 14,
  outline: 'none', background: 'white', width: '100%',
  letterSpacing: '-0.1px',
}

const primaryBtn = {
  width: '100%', padding: '15px', borderRadius: 16,
  background: 'linear-gradient(135deg, #FF7BA9, #FF5499)',
  color: 'white', fontSize: 15, fontWeight: 700,
  letterSpacing: '-0.2px',
  boxShadow: '0 4px 16px rgba(255,123,169,0.4)',
}

const outlineBtn = {
  width: '100%', padding: '13px', borderRadius: 16,
  background: 'white', border: '1.5px solid #FFD6E0',
  color: '#2D2D2D', fontSize: 14, fontWeight: 600,
}

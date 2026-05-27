import { useState } from 'react'
import { createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential, linkWithPopup, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'

function getGuestRegions() {
  try { return JSON.parse(localStorage.getItem('guestVisitedRegions') || '[]') } catch { return [] }
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

const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (nickname.length < 2) return setError('닉네임은 2자 이상이어야 해요')
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      return setError('비밀번호는 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 해요')
    }
    if (password !== passwordConfirm) return setError('비밀번호가 일치하지 않아요')
    try {
      const guestRegions = getGuestRegions()
      const currentUser = auth.currentUser
      let user
      if (currentUser?.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password)
        const result = await linkWithCredential(currentUser, credential)
        user = result.user
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        user = result.user
      }
      await setDoc(doc(db, 'users', user.uid), {
        nickname,
        email,
        visitedRegions: guestRegions,
        teamId: null,
        createdAt: new Date(),
      })
      if (guestRegions.length) localStorage.removeItem('guestVisitedRegions')
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use' || err.code === 'auth/credential-already-in-use') {
        setError('이미 사용 중인 이메일이에요')
      } else {
        setError('회원가입에 실패했어요. 이미 사용 중인 이메일일 수 있어요')
      }
    }
  }

  const handleGoogleRegister = async () => {
    try {
      const currentUser = auth.currentUser
      if (currentUser?.isAnonymous) {
        await linkWithPopup(currentUser, new GoogleAuthProvider())
        // 신규 구글 유저 — App.jsx의 needsProfile 체크가 닉네임 입력 화면을 띄워줌
      } else {
        const result = await signInWithPopup(auth, new GoogleAuthProvider())
        const snap = await getDoc(doc(db, 'users', result.user.uid))
        if (snap.exists() && snap.data().nickname) {
          await signOut(auth)
          setError('이미 가입된 구글 계정이에요. 로그인해주세요.')
          return
        }
        // 신규 구글 유저 — App.jsx의 needsProfile 체크가 닉네임 입력 화면을 띄워줌
      }
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use') {
        setError('이미 가입된 구글 계정이에요. 로그인해주세요.')
      } else {
        setError('구글 회원가입에 실패했어요')
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '0 32px',
      background: '#FFF9FB',
    }}>
      <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 8 }} />
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#FF8FAB', marginBottom: 24, letterSpacing: '-0.5px' }}>회원가입</h1>

      <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="닉네임 (2자 이상)"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="비밀번호 (영문+숫자+특수문자 포함)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChange={e => setPasswordConfirm(e.target.value)}
          style={{
            ...inputStyle,
            borderColor: passwordConfirm && password !== passwordConfirm ? '#FF6B6B' : '#FFD6E0',
          }}
        />
        <p style={{ fontSize: 13, color: '#C0C0C0', marginTop: -6, lineHeight: 1.5 }}>
          영문, 숫자, 특수문자(!@#$%^&*)를 모두 포함해야 해요
        </p>
        {error && <p style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{error}</p>}
        <button type="submit" style={btnStyle}>가입하기</button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px', width: '100%' }}>
        <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
        <span style={{ fontSize: 13, color: '#C0C0C0' }}>또는</span>
        <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
      </div>

      {isNative ? (
        <div style={{
          width: '100%', padding: '13px', borderRadius: 12,
          background: 'white', border: '1.5px solid #E0E0E0',
          color: '#999', fontSize: 14, fontWeight: 600,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          opacity: 0.45, cursor: 'not-allowed',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GoogleIcon />
            구글로 회원가입
          </span>
          <span style={{ fontSize: 11 }}>iOS 앱에서는 지원되지 않아요</span>
        </div>
      ) : (
        <button onClick={handleGoogleRegister} style={{
          width: '100%', padding: '13px', borderRadius: 12,
          background: 'white', border: '1.5px solid #E0E0E0',
          color: '#2D2D2D', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <GoogleIcon />
          구글로 회원가입
        </button>
      )}

      <button
        onClick={() => navigate('/login')}
        style={{ marginTop: 16, fontSize: 13, color: '#aaa', background: 'none' }}
      >
        이미 계정이 있으신가요? <span style={{ color: '#FF8FAB', fontWeight: 700 }}>로그인</span>
      </button>
    </div>
  )
}

const inputStyle = {
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #FFD6E0',
  fontSize: 14,
  outline: 'none',
  background: 'white',
  width: '100%',
}

const btnStyle = {
  padding: '14px',
  borderRadius: 12,
  background: '#FF8FAB',
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  marginTop: 4,
}

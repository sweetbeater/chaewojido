import { useState } from 'react'
import { createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'

function getGuestRegions() {
  try { return JSON.parse(localStorage.getItem('guestVisitedRegions') || '[]') } catch { return [] }
}

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
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#FF8FAB', marginBottom: 24, letterSpacing: '-0.5px' }}>이메일 회원가입</h1>

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

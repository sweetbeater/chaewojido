import { useState } from 'react'
import { signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않아요')
    }
  }

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate('/')
    } catch (err) {
      setError('구글 로그인에 실패했어요')
    }
  }

  const handleGuest = async () => {
    try {
      await signInAnonymously(auth)
      navigate('/')
    } catch (err) {
      setError('게스트 로그인에 실패했어요')
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '0 32px',
      background: '#FFF9FB',
    }}>
      <img src="/삐야_아이콘.png" alt="삐야" style={{ width: 100, marginBottom: 8 }} />
      <h1 style={{ fontSize: 28, color: '#FF8FAB', marginBottom: 4 }}>채워지도</h1>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 32 }}>삐야와 함께 여행 지도를 채워보세요</p>

      <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        {error && <p style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{error}</p>}
        <button type="submit" style={btnStyle}>로그인</button>
      </form>

      {/* 구글 로그인 */}
      <button onClick={handleGoogle} style={{
        ...btnStyle,
        background: 'white',
        color: '#333',
        border: '1.5px solid #FFD6E0',
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span>🔵</span> 구글로 로그인
      </button>

      {/* 게스트 모드 */}
      <button onClick={handleGuest} style={{
        ...btnStyle,
        background: '#F5F5F5',
        color: '#999',
        marginTop: 8,
      }}>
        게스트로 시작하기
      </button>

      <p style={{ fontSize: 11, color: '#ccc', marginTop: 8, textAlign: 'center', lineHeight: 1.6 }}>
        게스트 모드는 서버 저장 및 팀 기능을 사용할 수 없어요
      </p>

      <button
        onClick={() => navigate('/register')}
        style={{ marginTop: 16, fontSize: 13, color: '#aaa', background: 'none' }}
      >
        아직 계정이 없으신가요? <span style={{ color: '#FF8FAB' }}>회원가입</span>
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
}

const btnStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: 12,
  background: '#FF8FAB',
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
}
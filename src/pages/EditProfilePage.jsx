import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection, arrayRemove } from 'firebase/firestore'
import { updatePassword, deleteUser, reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function EditProfilePage({ user }) {
  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const navigate = useNavigate()
  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com')

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setProfile(data)
        setNickname(data.nickname || '')
        setPreview(data.photoURL || null)
      }
    })
  }, [user])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      let photoURL = profile?.photoURL || null

      // 사진 업로드
      if (photo) {
        const storageRef = ref(storage, `profiles/${user.uid}`)
        await uploadBytes(storageRef, photo)
        photoURL = await getDownloadURL(storageRef)
      }

      const updates = { photoURL }

      if (nickname !== profile?.nickname) {
        updates.nickname = nickname
      }

      await updateDoc(doc(db, 'users', user.uid), updates)

      // 비밀번호 변경 (이메일 유저만)
      if (!isGoogleUser && newPassword) {
        if (!currentPassword) {
          setMessage('현재 비밀번호를 입력해주세요')
          setLoading(false)
          return
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
      }

      setMessage('✅ 저장됐어요!')
      setNewPassword('')
      setCurrentPassword('')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/wrong-password') {
        setMessage('현재 비밀번호가 틀렸어요')
      } else {
        setMessage('저장에 실패했어요')
      }
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    try {
      if (isGoogleUser) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider())
      } else {
        if (!deletePassword) return setMessage('비밀번호를 입력해주세요')
        const credential = EmailAuthProvider.credential(user.email, deletePassword)
        await reauthenticateWithCredential(user, credential)
      }

      // 개인 기록 삭제
      const personalRecords = await getDocs(collection(db, 'users', user.uid, 'records'))
      for (const d of personalRecords.docs) await deleteDoc(d.ref)

      // 팀 처리
      if (profile?.teamId) {
        const teamSnap = await getDoc(doc(db, 'teams', profile.teamId))
        if (teamSnap.exists()) {
          const members = teamSnap.data().members || []
          if (members.length <= 2) {
            // 2명 팀 → 팀 해체: 팀 기록 전체 삭제 + 팀 문서 삭제 + 남은 멤버 초기화
            const teamRecords = await getDocs(collection(db, 'teams', profile.teamId, 'records'))
            for (const d of teamRecords.docs) await deleteDoc(d.ref)
            await deleteDoc(doc(db, 'teams', profile.teamId))
            for (const uid of members) {
              if (uid !== user.uid) {
                await updateDoc(doc(db, 'users', uid), { teamId: null, visitedRegions: [] })
              }
            }
          } else {
            // 3명+ → 탈퇴자만 멤버에서 제거, 팀 기록은 유지
            await updateDoc(doc(db, 'teams', profile.teamId), { members: arrayRemove(user.uid) })
          }
        }
      }

      // 유저 문서 삭제
      await deleteDoc(doc(db, 'users', user.uid))

      await deleteUser(user)
      navigate('/login')
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setMessage('비밀번호가 틀렸어요')
      } else if (err.code === 'auth/popup-closed-by-user') {
        setMessage('구글 인증이 취소됐어요')
      } else {
        setMessage('탈퇴에 실패했어요')
      }
    }
  }

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 100px', background: '#FFF9FB', minHeight: '100vh' }}>
      <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', fontSize: 22, color: '#FF8FAB', padding: '10px 16px 10px 4px', display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer', minHeight: 44 }}>←</button>
      <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 24 }}>프로필 수정</h2>

      {/* 프로필 사진 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <label style={{ cursor: 'pointer', position: 'relative' }}>
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          <img
            src={preview || '/삐야_아이콘.png'}
            alt="프로필"
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFD6E0' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: '#FF8FAB', borderRadius: '50%',
            width: 28, height: 28, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>📷</div>
        </label>
      </div>

      {/* 닉네임 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>닉네임</p>
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* 비밀번호 변경 — 이메일 유저만 표시 */}
      {!isGoogleUser && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>비밀번호 변경</p>
          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="새 비밀번호 (영문+숫자+특수문자)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {message && (
        <p style={{
          textAlign: 'center', fontSize: 13, marginBottom: 16,
          color: message.includes('✅') ? '#4CAF50' : '#FF6B6B'
        }}>
          {message}
        </p>
      )}

      <button onClick={handleSave} disabled={loading} style={{
        ...btnStyle, marginBottom: 12,
        background: loading ? '#FFB3C6' : '#FF8FAB',
      }}>
        {loading ? '저장 중...' : '저장하기'}
      </button>

      {/* 회원 탈퇴 */}
      <button
        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
        style={{ ...btnStyle, background: '#F5F5F5', color: '#999' }}
      >
        회원 탈퇴
      </button>

      {showDeleteConfirm && (
        <div style={{
          marginTop: 16, padding: 20,
          background: '#FFF0F0', borderRadius: 16,
          border: '1.5px solid #FFD6D6',
        }}>
          <p style={{ fontSize: 14, color: '#FF6B6B', fontWeight: 'bold', marginBottom: 8 }}>
            ⚠️ 정말 탈퇴하시겠어요?
          </p>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
            탈퇴하면 모든 데이터가 삭제되고 복구할 수 없어요.
          </p>
          {isGoogleUser ? (
            <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              구글 계정으로 본인 확인 후 탈퇴됩니다.
            </p>
          ) : (
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
          )}
          <button onClick={handleDelete} style={{ ...btnStyle, background: '#FF6B6B' }}>
            탈퇴하기
          </button>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #FFD6E0',
  fontSize: 14,
  outline: 'none',
  background: 'white',
  display: 'block',
  fontFamily: 'inherit',
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
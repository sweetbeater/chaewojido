import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection, arrayRemove, query, where } from 'firebase/firestore'
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, OAuthProvider } from 'firebase/auth'
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
  const isAppleUser = user?.providerData?.some(p => p.providerId === 'apple.com')
  const isOAuthUser = isGoogleUser || isAppleUser

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

      if (photo) {
        const storageRef = ref(storage, `profiles/${user.uid}`)
        await uploadBytes(storageRef, photo)
        photoURL = await getDownloadURL(storageRef)
      }

      const updates = { photoURL }
      if (nickname !== profile?.nickname) updates.nickname = nickname
      await updateDoc(doc(db, 'users', user.uid), updates)

      // 닉네임/프로필사진을 해당 모드의 기록에만 반영
      const recordUpdate = { authorNickname: nickname || profile?.nickname || '여행자', authorPhotoURL: photoURL }
      if (profile?.teamId) {
        // 팀 모드: 팀 기록만 업데이트
        const teamSnap = await getDocs(query(
          collection(db, 'teams', profile.teamId, 'records'),
          where('authorUid', '==', user.uid)
        ))
        await Promise.all(teamSnap.docs.map(d => updateDoc(d.ref, recordUpdate)))
      } else {
        // 개인 모드: 개인 기록만 업데이트
        const personalSnap = await getDocs(collection(db, 'users', user.uid, 'records'))
        await Promise.all(personalSnap.docs.map(d => updateDoc(d.ref, recordUpdate)))
      }

      // 비밀번호 변경 (이메일 유저만)
      if (!isOAuthUser && newPassword) {
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
      // 이메일 유저: 비밀번호 재확인
      if (!isOAuthUser) {
        if (!deletePassword) return setMessage('비밀번호를 입력해주세요')
        const credential = EmailAuthProvider.credential(user.email, deletePassword)
        await reauthenticateWithCredential(user, credential)
      }

      // Apple 유저: deleteUser가 requires-recent-login을 던지면 Firestore가 먼저 삭제되는
      // 문제(재시작 시 CompleteProfileScreen 표시)를 막기 위해 삭제 전 선제 재인증.
      // Face ID/Touch ID로 진행되므로 UX 부담 최소화.
      if (isAppleUser) {
        try {
          const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
          const result = await FirebaseAuthentication.signInWithApple()
          const cred = new OAuthProvider('apple.com').credential({
            idToken: result.credential?.idToken,
            rawNonce: result.credential?.nonce,
          })
          await reauthenticateWithCredential(user, cred)
        } catch (appleErr) {
          const cancelled = appleErr.code === 'SIGN_IN_CANCELLED' ||
            (typeof appleErr.message === 'string' && appleErr.message.toLowerCase().includes('cancel'))
          if (cancelled) return
          throw appleErr
        }
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
            const teamRecords = await getDocs(collection(db, 'teams', profile.teamId, 'records'))
            for (const d of teamRecords.docs) await deleteDoc(d.ref)
            await deleteDoc(doc(db, 'teams', profile.teamId))
            for (const uid of members) {
              if (uid !== user.uid) {
                await updateDoc(doc(db, 'users', uid), { teamId: null, visitedRegions: [] })
              }
            }
          } else {
            await updateDoc(doc(db, 'teams', profile.teamId), { members: arrayRemove(user.uid) })
          }
        }
      }

      // 유저 문서 삭제
      await deleteDoc(doc(db, 'users', user.uid))

      await deleteUser(user)
      navigate('/login')
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setMessage('보안을 위해 앱을 재시작 후 다시 시도해주세요')
      } else if (err.code === 'auth/wrong-password') {
        setMessage('비밀번호가 틀렸어요')
      } else {
        console.error(err)
        setMessage('탈퇴에 실패했어요')
      }
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: '#FFF9FB', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
    <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 100px' }}>
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

      {/* 비밀번호 변경 — 이메일 유저만 */}
      {!isOAuthUser && (
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
          {!isOAuthUser && (
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

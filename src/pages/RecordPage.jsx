import { useState } from 'react'
import { doc, setDoc, collection } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { REGION_MAP } from '../utils/regions'

export default function RecordPage({ user, regionNum }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  const regionInfo = REGION_MAP[regionNum]

  useState(() => {
    if (!user) return
    import('../firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'users', user.uid)).then(snap => {
          if (snap.exists()) setProfile(snap.data())
        })
      })
    })
  }, [user])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return alert('제목을 입력해주세요')
    setLoading(true)
    try {
      let photoURL = null
      if (photo) {
        const storageRef = ref(storage, `records/${user.uid}/${Date.now()}_${photo.name}`)
        await uploadBytes(storageRef, photo)
        photoURL = await getDownloadURL(storageRef)
      }

      const recordData = {
        regionNum,
        regionName: regionInfo?.name || '알 수 없는 지역',
        title,
        content,
        photoURL,
        authorUid: user.uid,
        createdAt: new Date(),
      }

      // 개인 기록 저장
      const personalRef = doc(collection(db, 'users', user.uid, 'records'))
      await setDoc(personalRef, recordData)

      // 팀 기록 저장
      if (profile?.teamId) {
        const teamRef = doc(collection(db, 'teams', profile.teamId, 'records'))
        await setDoc(teamRef, recordData)
      }

      navigate('/')
    } catch (err) {
      console.error(err)
      alert('저장에 실패했어요')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px 20px 100px', background: '#FFF9FB', minHeight: '100vh' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', fontSize: 20, marginBottom: 16, color: '#FF8FAB' }}>←</button>
      <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>여행 기록</h2>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>{regionInfo?.name || '지역'}</p>

      {/* 사진 업로드 */}
      <label style={{
        display: 'block',
        width: '100%',
        height: 200,
        borderRadius: 16,
        border: '2px dashed #FFD6E0',
        overflow: 'hidden',
        marginBottom: 16,
        cursor: 'pointer',
        background: preview ? 'none' : '#FFF0F5',
      }}>
        <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        {preview ? (
          <img src={preview} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 32 }}>📷</p>
            <p style={{ fontSize: 13, color: '#FFB3C6' }}>사진 추가하기</p>
          </div>
        )}
      </label>

      {/* 제목 */}
      <input
        placeholder="제목 (예: 2024 여름 부산 여행)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={inputStyle}
      />

      {/* 내용 */}
      <textarea
        placeholder="여행 기록을 남겨보세요 ✍️"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={5}
        style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
      />

      <button onClick={handleSubmit} disabled={loading} style={{
        width: '100%',
        padding: '14px',
        borderRadius: 12,
        background: loading ? '#FFB3C6' : '#FF8FAB',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
      }}>
        {loading ? '저장 중...' : '기록 저장하기 🐥'}
      </button>
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
  marginBottom: 12,
  display: 'block',
  fontFamily: 'inherit',
}
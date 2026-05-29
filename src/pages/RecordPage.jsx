import { useState, useEffect, useRef } from 'react'
import { doc, setDoc, collection, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { REGION_MAP } from '../utils/regions'

const MAX_PHOTOS = 15

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function RecordPage({ user, regionNum }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [travelDate, setTravelDate] = useState(todayString)
  const [saveStatus, setSaveStatus] = useState('')
  const [profile, setProfile] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const regionInfo = REGION_MAP[regionNum]

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data())
    })
  }, [user])

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const added = files.slice(0, MAX_PHOTOS - photos.length)
    setPhotos(prev => [...prev, ...added])
    setPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return alert('제목을 입력해주세요')
    setSaveStatus('준비 중...')
    try {
      const photoURLs = []
      for (let i = 0; i < photos.length; i++) {
        setSaveStatus(`사진 ${i + 1}/${photos.length} 업로드 중...`)
        const storageRef = ref(storage, `records/${user.uid}/${Date.now()}_${photos[i].name}`)
        await uploadBytes(storageRef, photos[i])
        photoURLs.push(await getDownloadURL(storageRef))
      }
      setSaveStatus('저장 중...')
      const [y, m, d] = travelDate.split('-').map(Number)
      const personalRef = doc(collection(db, 'users', user.uid, 'records'))
      const recordData = {
        regionNum, regionName: regionInfo?.name || '알 수 없는 지역',
        title, content,
        photoURL: photoURLs[0] || null,
        photoURLs,
        travelDate: new Date(y, m - 1, d, 12, 0, 0),
        authorUid: user.uid,
        authorNickname: profile?.nickname || '여행자',
        personalRecordId: personalRef.id,
        createdAt: new Date(),
      }
      await setDoc(personalRef, recordData)
      if (profile?.teamId) {
        const teamRef = doc(collection(db, 'teams', profile.teamId, 'records'))
        await setDoc(teamRef, recordData)
      }
      setSaveStatus('저장됨 ✓')
      setTimeout(() => navigate('/'), 700)
    } catch (err) {
      console.error(err)
      setSaveStatus('')
      alert('저장에 실패했어요')
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      left: 0, right: 0,
      background: '#FFFDF8', overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotos}
        style={{ display: 'none' }}
      />

      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>

        <button onClick={() => navigate('/')} style={{
          background: 'none', fontSize: 22, color: '#FF7BA9',
          padding: '10px 16px 10px 4px', display: 'flex', alignItems: 'center',
          marginBottom: 12, minHeight: 44,
        }}>←</button>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#2D2D2D', marginBottom: 2, letterSpacing: '-0.5px' }}>
          여행 기록 ✍️
        </h2>
        <p style={{ fontSize: 13, color: '#B0B0B0', marginBottom: 20 }}>
          {regionInfo?.name || '지역'}
        </p>

        {/* 사진 업로드 */}
        {previews.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
              {previews.map((src, idx) => (
                <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={src} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14 }} />
                  <button
                    onClick={() => removePhoto(idx)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 22, height: 22, borderRadius: 11,
                      background: 'rgba(0,0,0,0.5)', color: 'white',
                      fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flexShrink: 0, width: 120, height: 120, borderRadius: 14,
                    border: '2px dashed #FFD6E0', background: '#FFF0F5',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 22 }}>📷</span>
                  <span style={{ fontSize: 13, color: '#FFB3C6' }}>{photos.length}/{MAX_PHOTOS}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', width: '100%', height: 160,
              borderRadius: 20, border: '2px dashed #FFD6E0',
              marginBottom: 16, cursor: 'pointer',
              background: '#FFF0F5',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <p style={{ fontSize: 30 }}>📷</p>
            <p style={{ fontSize: 13, color: '#FFB3C6', fontWeight: 500 }}>사진 추가하기 (최대 15장)</p>
          </div>
        )}

        {/* 여행 날짜 */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#B0B0B0', marginBottom: 5 }}>여행 날짜</p>
          <input
            type="date"
            value={travelDate}
            onChange={e => setTravelDate(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0 }}
          />
        </div>

        <input
          placeholder="제목을 입력해 주세요"
          value={title} onChange={e => setTitle(e.target.value)}
          style={{ ...inputStyle, fontSize: 18 }}
        />
        <textarea
          placeholder="여행의 기억을 기록해보세요 🗺️"
          value={content} onChange={e => setContent(e.target.value)}
          rows={6}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.9, fontSize: 16 }}
        />

        <button onClick={handleSubmit} disabled={!!saveStatus} style={{
          width: '100%', padding: '15px', borderRadius: 18,
          background: saveStatus ? (saveStatus === '저장됨 ✓' ? '#4CAF50' : '#FFB3C6') : 'linear-gradient(135deg, #FF7BA9, #FF5499)',
          color: 'white', fontSize: 15, fontWeight: 700,
          marginTop: 4, letterSpacing: '-0.2px',
          boxShadow: saveStatus ? 'none' : '0 4px 16px rgba(255,123,169,0.35)',
          transition: 'background 0.3s',
        }}>
          {saveStatus || '기록 저장하기 🐥'}
        </button>

      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 18px',
  borderRadius: 16, border: '1.5px solid #FFD6E0',
  fontSize: 14, outline: 'none', background: 'white',
  marginBottom: 12, display: 'block', letterSpacing: '-0.1px',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, collection, addDoc, onSnapshot, updateDoc, deleteDoc, getDocs, query, where, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmModal'
import DatePicker from '../components/DatePicker'

const ROTATIONS = [-1.4, 0.9, -0.7, 1.2, -1.0, 0.6]

const CORNER_DECOR = [
  { char: '★', color: '#FFD85C' },
  { char: '♥', color: '#FF7BA9' },
  { char: '✿', color: '#8FE3CF' },
  { char: '◆', color: '#B5A0E8' },
  { char: '✦', color: '#FF9EC0' },
  { char: '♪', color: '#FFBD76' },
]
const CORNERS = [
  { key: 'tl', pos: { top: 3, left: 3 } },
  { key: 'tr', pos: { top: 3, right: 3 } },
  { key: 'bl', pos: { bottom: 28, left: 3 } },
  { key: 'br', pos: { bottom: 28, right: 3 } },
]

export default function RecordDetailPage({ user, recordId, teamId }) {
  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [profile, setProfile] = useState(null)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [memberProfiles, setMemberProfiles] = useState({})
  const [editing, setEditing] = useState(false)
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editPhotos, setEditPhotos] = useState([])
  const [editPreviews, setEditPreviews] = useState([])
  const [editExistingURLs, setEditExistingURLs] = useState([])
  const [editSaveStatus, setEditSaveStatus] = useState('')
  const [editTravelDate, setEditTravelDate] = useState('')
  const [editTravelEndDate, setEditTravelEndDate] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const { confirm, modal } = useConfirm()

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data())
    })
  }, [user])

  useEffect(() => {
    if (!teamId) return
    getDoc(doc(db, 'teams', teamId)).then(snap => {
      if (!snap.exists()) return
      const members = snap.data().members || []
      Promise.all(members.map(uid => getDoc(doc(db, 'users', uid)))).then(snaps => {
        const profiles = {}
        snaps.forEach(s => { if (s.exists()) profiles[s.id] = s.data() })
        setMemberProfiles(profiles)
      })
    })
  }, [teamId])

  useEffect(() => {
    if (!recordId) return
    setCommentsLoading(true)
    if (teamId) {
      const unsub = onSnapshot(doc(db, 'teams', teamId, 'records', recordId), snap => {
        if (snap.exists()) setRecord({ id: snap.id, ...snap.data() })
      })
      const unsubComments = onSnapshot(
        collection(db, 'teams', teamId, 'records', recordId, 'comments'),
        { includeMetadataChanges: true },
        snap => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          data.sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
          setComments(data)
          if (!snap.metadata.fromCache) setCommentsLoading(false)
        }
      )
      const timeout = setTimeout(() => setCommentsLoading(false), 10000)
      return () => { unsub(); unsubComments(); clearTimeout(timeout) }
    } else {
      setCommentsLoading(false)
      const unsub = onSnapshot(doc(db, 'users', user.uid, 'records', recordId), snap => {
        if (snap.exists()) setRecord({ id: snap.id, ...snap.data() })
      })
      return unsub
    }
  }, [recordId, teamId])

  const isOwner = record?.authorUid === user?.uid

  const handleLike = async () => {
    if (!record || !user) return
    const ref = doc(db, 'teams', teamId, 'records', recordId)
    const likes = record.likes || []
    if (likes.includes(user.uid)) {
      await updateDoc(ref, { likes: arrayRemove(user.uid) })
    } else {
      await updateDoc(ref, { likes: arrayUnion(user.uid) })
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    await addDoc(collection(db, 'teams', teamId, 'records', recordId, 'comments'), {
      text: newComment,
      authorUid: user.uid,
      authorNickname: profile?.nickname || '여행자',
      authorPhotoURL: profile?.photoURL || null,
      createdAt: new Date(),
    })
    setNewComment('')
  }

  const handleDeleteComment = async (commentId) => {
    if (!await confirm('댓글을 삭제할까요?', { confirmText: '삭제', destructive: true })) return
    await deleteDoc(doc(db, 'teams', teamId, 'records', recordId, 'comments', commentId))
  }

  const handleDelete = async () => {
    if (!await confirm('기록을 삭제할까요?', { confirmText: '삭제', destructive: true })) return
    if (teamId) {
      // 팀 모드: 팀 기록만 삭제
      await deleteDoc(doc(db, 'teams', teamId, 'records', recordId))
    } else {
      // 개인 모드: 개인 기록만 삭제, 해당 지역 기록이 없으면 visitedRegions에서 제거
      await deleteDoc(doc(db, 'users', user.uid, 'records', recordId))
      const remaining = await getDocs(query(
        collection(db, 'users', user.uid, 'records'),
        where('regionNum', '==', record.regionNum)
      ))
      if (remaining.empty) {
        await updateDoc(doc(db, 'users', user.uid), { visitedRegions: arrayRemove(record.regionNum) })
      }
    }
    navigate(-1)
  }

  const handleStartEdit = () => {
    setEditTitle(record.title)
    setEditContent(record.content || '')
    const existingURLs = record.photoURLs?.length
      ? record.photoURLs
      : record.photoURL ? [record.photoURL] : []
    setEditExistingURLs(existingURLs)
    setEditPhotos([])
    setEditPreviews([])
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const startObj = record.travelStartDate?.toDate?.() || record.travelDate?.toDate?.() || record.createdAt?.toDate?.() || new Date()
    const endObj = record.travelEndDate?.toDate?.() || startObj
    setEditTravelDate(fmt(startObj))
    setEditTravelEndDate(fmt(endObj))
    setEditSaveStatus('')
    setEditing(true)
  }

  const handleEditSave = async () => {
    if (!editTitle.trim()) return alert('제목을 입력해주세요')
    if (editTravelEndDate < editTravelDate) return alert('종료일은 시작일보다 빠를 수 없어요')
    setEditSaveStatus('준비 중...')
    try {
      const newURLs = []
      for (let i = 0; i < editPhotos.length; i++) {
        setEditSaveStatus(`사진 ${i + 1}/${editPhotos.length} 업로드 중...`)
        const storageRef = ref(storage, `records/${user.uid}/${Date.now()}_${editPhotos[i].name}`)
        await uploadBytes(storageRef, editPhotos[i])
        newURLs.push(await getDownloadURL(storageRef))
      }
      setEditSaveStatus('저장 중...')
      const allPhotoURLs = [...editExistingURLs, ...newURLs]
      const [sy, sm, sd] = editTravelDate.split('-').map(Number)
      const [ey, em, ed] = editTravelEndDate.split('-').map(Number)
      const updateRef = teamId
        ? doc(db, 'teams', teamId, 'records', recordId)
        : doc(db, 'users', user.uid, 'records', recordId)
      await updateDoc(updateRef, {
        title: editTitle,
        content: editContent,
        photoURL: allPhotoURLs[0] || null,
        photoURLs: allPhotoURLs,
        travelStartDate: new Date(sy, sm - 1, sd, 12, 0, 0),
        travelEndDate: new Date(ey, em - 1, ed, 12, 0, 0),
      })
      setEditSaveStatus('저장됨 ✓')
      setTimeout(() => setEditing(false), 700)
    } catch (err) {
      console.error(err)
      setEditSaveStatus('')
      alert('저장에 실패했어요')
    }
  }

  const pageWrapper = (children) => (
    <>
      {modal}
      {fullscreenPhoto && (
        <div
          onClick={() => setFullscreenPhoto(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={fullscreenPhoto}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }}
          />
          <button
            onClick={() => setFullscreenPhoto(null)}
            style={{
              position: 'absolute',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
              right: 24,
              width: 52, height: 52, borderRadius: 26,
              background: 'rgba(255,255,255,0.15)', color: 'white',
              fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >✕</button>
        </div>
      )}
      <div style={{
        position: 'fixed', top: 0, bottom: 0,
        left: 0,
        right: 0,
        background: '#FFFDF8', overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          {children}
        </div>
      </div>
    </>
  )

  if (!record) return pageWrapper(
    <div style={{ textAlign: 'center', padding: 40, color: '#FF7BA9' }}>불러오는 중...</div>
  )

  const travelStartObj = record.travelStartDate?.toDate?.() || record.travelDate?.toDate?.()
  const travelEndObj = record.travelEndDate?.toDate?.()
  const travelDateStr = (() => {
    if (!travelStartObj) return ''
    const fmt = d => d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    if (!travelEndObj || travelStartObj.toDateString() === travelEndObj.toDateString()) return fmt(travelStartObj)
    return `${fmt(travelStartObj)} ~ ${fmt(travelEndObj)}`
  })()
  const createdDateStr = record.createdAt?.toDate?.()?.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) || ''

  const isLiked = (record.likes || []).includes(user.uid)
  const photoUrls = record.photoURLs?.length ? record.photoURLs : record.photoURL ? [record.photoURL] : []

  if (editing) {
    return pageWrapper(
      <>
        {/* 항상 마운트된 단일 file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={e => {
            const files = Array.from(e.target.files || [])
            if (!files.length) return
            const total = editExistingURLs.length + editPhotos.length
            const added = files.slice(0, 15 - total)
            setEditPhotos(prev => [...prev, ...added])
            setEditPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />
        <button onClick={() => setEditing(false)} style={{ background: 'none', fontSize: 22, color: '#FF7BA9', padding: '10px 16px 10px 4px', display: 'flex', alignItems: 'center', marginBottom: 8, minHeight: 44 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#333', marginBottom: 20 }}>기록 수정</h2>

        {editExistingURLs.length === 0 && editPreviews.length === 0 ? (
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
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
            {editExistingURLs.map((url, idx) => (
              <div key={`ex-${idx}`} style={{ position: 'relative', flexShrink: 0, width: 120, height: 120, borderRadius: 14, overflow: 'hidden', background: '#F0F0F0' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', WebkitBackfaceVisibility: 'hidden' }} />
                <button
                  onClick={() => setEditExistingURLs(prev => prev.filter((_, i) => i !== idx))}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>
            ))}
            {editPreviews.map((src, idx) => (
              <div key={`new-${idx}`} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={src} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14 }} />
                <button
                  onClick={() => {
                    setEditPhotos(prev => prev.filter((_, i) => i !== idx))
                    setEditPreviews(prev => prev.filter((_, i) => i !== idx))
                  }}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>
            ))}
            {(editExistingURLs.length + editPhotos.length) < 15 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ flexShrink: 0, width: 120, height: 120, borderRadius: 14, border: '2px dashed #FFD6E0', background: '#FFF0F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 4 }}
              >
                <span style={{ fontSize: 22 }}>📷</span>
                <span style={{ fontSize: 13, color: '#FFB3C6' }}>{editExistingURLs.length + editPhotos.length}/15</span>
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#B0B0B0', marginBottom: 5 }}>여행 날짜</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DatePicker
              value={editTravelDate}
              max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()}
              onChange={v => {
                setEditTravelDate(v)
                if (editTravelEndDate < v) setEditTravelEndDate(v)
              }}
            />
            <span style={{ color: '#B0B0B0', fontSize: 13, flexShrink: 0 }}>~</span>
            <DatePicker
              value={editTravelEndDate}
              min={editTravelDate}
              max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()}
              onChange={v => setEditTravelEndDate(v)}
            />
          </div>
        </div>
        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" style={{ ...inputStyle, fontSize: 18, fontFamily: "'Gowun Dodum', sans-serif" }} />
        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="내용" rows={5} style={{ ...inputStyle, resize: 'none', lineHeight: 1.9, fontSize: 16, fontFamily: "'Gowun Dodum', sans-serif" }} />
        <button onClick={handleEditSave} disabled={!!editSaveStatus} style={{
          width: '100%', padding: '14px', borderRadius: 16,
          background: editSaveStatus === '저장됨 ✓' ? '#4CAF50' : editSaveStatus ? '#FFB3C6' : 'linear-gradient(135deg, #FF7BA9, #FF5499)',
          color: 'white', fontSize: 15, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(255,123,169,0.3)',
          transition: 'background 0.3s',
        }}>
          {editSaveStatus || '저장하기'}
        </button>
      </>
    )
  }

  return pageWrapper(
    <>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', fontSize: 22, color: '#FF7BA9', padding: '10px 16px 10px 4px', display: 'flex', alignItems: 'center', minHeight: 44 }}>←</button>
        {isOwner && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleStartEdit} style={actionBtn}>수정</button>
            <button onClick={handleDelete} style={{ ...actionBtn, color: '#FF6B6B', borderColor: '#FFCDD2' }}>삭제</button>
          </div>
        )}
      </div>

      {/* 폴라로이드 사진 */}
      {photoUrls.length > 0 && (
        <div style={{ marginBottom: 28, marginLeft: -20, marginRight: -20, overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 20,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            padding: '12px 28px 24px',
          }}>
            {photoUrls.map((url, i) => (
              <div key={i} style={{
                flexShrink: 0,
                width: 'calc(100vw - 80px)',
                maxWidth: 300,
                background: 'white',
                padding: '10px 10px 44px',
                borderRadius: 3,
                boxShadow: '0 8px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)',
                transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`,
                scrollSnapAlign: 'center',
                position: 'relative',
              }}>
                {CORNERS.map(({ key, pos }, ci) => {
                  const decor = CORNER_DECOR[(i * 4 + ci) % CORNER_DECOR.length]
                  return (
                    <span key={key} style={{ position: 'absolute', fontSize: 10, lineHeight: 1, pointerEvents: 'none', color: decor.color, ...pos }}>
                      {decor.char}
                    </span>
                  )
                })}
                <img src={url} alt={`사진 ${i + 1}`}
                  onClick={() => setFullscreenPhoto(url)}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                  style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    objectFit: 'cover',
                    display: 'block',
                    cursor: 'pointer',
                  }} />
                <p style={{
                  textAlign: 'right', marginTop: 10, paddingRight: 2,
                  fontSize: 14, color: '#C4B0B4',
                }}>
                  {travelDateStr}
                </p>
              </div>
            ))}
          </div>
          {photoUrls.length > 1 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#C0C0C0', marginTop: -8 }}>
              ← {photoUrls.length}장의 사진 →
            </p>
          )}
        </div>
      )}

      {/* 기록 내용 */}
      <div style={{
        background: 'white', borderRadius: 20,
        padding: '22px 22px 20px',
        marginBottom: 16,
        boxShadow: '0 2px 12px rgba(255,123,169,0.08)',
        border: '1px solid #FFF0F5',
      }}>
        <p style={{ fontSize: 13, color: '#FF7BA9', marginBottom: 8, fontWeight: 600, letterSpacing: '0.2px' }}>
          📍 {record.gu ? `서울 ${record.gu}` : record.regionName}
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#2D2D2D', marginBottom: 12, lineHeight: 1.4, fontFamily: "'Gowun Dodum', sans-serif" }}>
          {record.title}
        </p>
        {record.content && (
          <p style={{ fontSize: 17, color: '#555', lineHeight: 2.0, marginBottom: 14, fontFamily: "'Gowun Dodum', sans-serif" }}>
            {record.content}
          </p>
        )}
        {travelDateStr && (
          <p style={{ fontSize: 12, color: '#FFB3C6', marginBottom: 4 }}>
            {travelDateStr} 여행 기록
          </p>
        )}
        <p style={{ fontSize: 13, color: '#C8C8C8' }}>
          {createdDateStr}
        </p>
      </div>

      {/* 좋아요 */}
      {teamId && (
        <div style={{ background: 'white', borderRadius: 16, padding: '14px 20px', marginBottom: 12, border: '1px solid #FFF0F5' }}>
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', fontSize: 16 }}>
            <span style={{ fontSize: 24 }}>{isLiked ? '❤️' : '🤍'}</span>
            <span style={{ color: isLiked ? '#FF7BA9' : '#aaa', fontWeight: 700 }}>
              {(record.likes || []).length}
            </span>
          </button>
        </div>
      )}

      {/* 댓글 */}
      {teamId && (
        <div style={{ background: 'white', borderRadius: 20, padding: '20px 20px', border: '1px solid #FFF0F5' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16 }}>
            💬 댓글 {comments.length}개
          </p>
          {commentsLoading && comments.length === 0 ? (
            <p style={{ fontSize: 13, color: '#FFB3C6', marginBottom: 16 }}>댓글 불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>첫 댓글을 남겨보세요 😊</p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {comments.map(comment => {
                const authorProfile = memberProfiles[comment.authorUid]
                const displayName = authorProfile?.nickname || comment.authorNickname || '여행자'
                const displayPhoto = authorProfile?.photoURL || comment.authorPhotoURL
                return (
                  <div key={comment.id} style={{ padding: '10px 0', borderBottom: '1px solid #FFF0F5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {displayPhoto
                            ? <img src={displayPhoto} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFD6E0', flexShrink: 0 }} />
                          }
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#FF7BA9', fontFamily: "'Gowun Dodum', sans-serif" }}>{displayName}</p>
                        </div>
                        <p style={{ fontSize: 13, color: '#555', fontFamily: "'Nanum Square Round', sans-serif" }}>{comment.text}</p>
                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>
                          {comment.createdAt?.toDate?.().toLocaleDateString('ko-KR') || ''}
                        </p>
                      </div>
                      {comment.authorUid === user?.uid && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{ padding: '4px 8px', fontSize: 12, color: '#FF6B6B', background: 'none', flexShrink: 0, marginLeft: 8 }}
                        >삭제</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="댓글 입력..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 14, border: '1.5px solid #FFD6E0', fontSize: 13, outline: 'none', background: 'white', fontFamily: "'Nanum Square Round', sans-serif" }}
            />
            <button onClick={handleComment} style={{
              padding: '10px 18px', borderRadius: 14,
              background: 'linear-gradient(135deg, #FF7BA9, #FF5499)',
              color: 'white', fontSize: 13, fontWeight: 700,
            }}>등록</button>
          </div>
        </div>
      )}
    </>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  borderRadius: 14, border: '1.5px solid #FFD6E0',
  fontSize: 14, outline: 'none', background: 'white',
  marginBottom: 12, display: 'block', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const actionBtn = {
  padding: '7px 16px', borderRadius: 20,
  background: 'white', border: '1.5px solid #FFD6E0',
  color: '#FF7BA9', fontSize: 13, fontWeight: 700,
  cursor: 'pointer',
}

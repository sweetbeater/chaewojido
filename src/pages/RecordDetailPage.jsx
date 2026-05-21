import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, collection, addDoc, onSnapshot, updateDoc, deleteDoc, getDocs, query, where, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmModal'

const ROTATIONS = [-1.4, 0.9, -0.7, 1.2, -1.0, 0.6]

export default function RecordDetailPage({ user, recordId, teamId }) {
  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [profile, setProfile] = useState(null)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editPhoto, setEditPhoto] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
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
      await deleteDoc(doc(db, 'teams', teamId, 'records', recordId))
    } else {
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
    setEditPreview(record.photoURL || record.photoURLs?.[0] || null)
    setEditPhoto(null)
    setEditing(true)
  }

  const handleEditSave = async () => {
    if (!editTitle.trim()) return alert('제목을 입력해주세요')
    setEditLoading(true)
    try {
      let photoURL = record.photoURL || null
      if (editPhoto) {
        const storageRef = ref(storage, `records/${user.uid}/${Date.now()}_${editPhoto.name}`)
        await uploadBytes(storageRef, editPhoto)
        photoURL = await getDownloadURL(storageRef)
      }
      const updateRef = teamId
        ? doc(db, 'teams', teamId, 'records', recordId)
        : doc(db, 'users', user.uid, 'records', recordId)
      await updateDoc(updateRef, {
        title: editTitle, content: editContent, photoURL,
      })
      setEditing(false)
    } catch (err) {
      console.error(err)
      alert('저장에 실패했어요')
    }
    setEditLoading(false)
  }

  const pageWrapper = (children) => (
    <>
      {modal}
      <div style={{
        position: 'fixed', top: 0, bottom: 0,
        left: 'max(0px, calc(50vw - 215px))',
        right: 'max(0px, calc(50vw - 215px))',
        background: '#FFFDF8', overflowY: 'auto',
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

  const dateStr = record.createdAt?.toDate
    ? record.createdAt.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

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
          onChange={e => {
            const file = e.target.files[0]
            if (!file) return
            setEditPhoto(file)
            setEditPreview(URL.createObjectURL(file))
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />
        <button onClick={() => setEditing(false)} style={{ background: 'none', fontSize: 22, color: '#FF7BA9', padding: '10px 16px 10px 4px', display: 'flex', alignItems: 'center', marginBottom: 8, minHeight: 44 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#333', marginBottom: 20 }}>기록 수정</h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'block', width: '100%', height: 200,
            borderRadius: 16, border: '2px dashed #FFD6E0',
            overflow: 'hidden', marginBottom: 16, cursor: 'pointer',
            background: editPreview ? 'none' : '#FFF0F5',
          }}
        >
          {editPreview ? (
            <img src={editPreview} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ fontSize: 32 }}>📷</p>
              <p style={{ fontSize: 13, color: '#FFB3C6' }}>사진 추가하기</p>
            </div>
          )}
        </div>

        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" style={{ ...inputStyle, fontSize: 18 }} />
        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="내용" rows={5} style={{ ...inputStyle, resize: 'none', lineHeight: 1.9, fontSize: 16 }} />
        <button onClick={handleEditSave} disabled={editLoading} style={{
          width: '100%', padding: '14px', borderRadius: 16,
          background: editLoading ? '#FFB3C6' : 'linear-gradient(135deg, #FF7BA9, #FF5499)',
          color: 'white', fontSize: 15, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(255,123,169,0.3)',
        }}>
          {editLoading ? '저장 중...' : '저장하기'}
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
                {['topLeft','topRight','bottomLeft','bottomRight'].map(pos => (
                  <span key={pos} style={{
                    position: 'absolute', fontSize: 10, lineHeight: 1, pointerEvents: 'none',
                    ...(pos === 'topLeft'     ? { top: 3,  left: 3  } : {}),
                    ...(pos === 'topRight'    ? { top: 3,  right: 3 } : {}),
                    ...(pos === 'bottomLeft'  ? { bottom: 28, left: 3 } : {}),
                    ...(pos === 'bottomRight' ? { bottom: 28, right: 3 } : {}),
                  }}>★</span>
                ))}
                <img src={url} alt={`사진 ${i + 1}`} style={{
                  width: '100%',
                  aspectRatio: '4/5',
                  objectFit: 'cover',
                  display: 'block',
                }} />
                <p style={{
                  textAlign: 'right', marginTop: 10, paddingRight: 2,
                  fontSize: 14, color: '#C4B0B4',
                }}>
                  {dateStr}
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
          📍 {record.regionName}
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#2D2D2D', marginBottom: 12, lineHeight: 1.4 }}>
          {record.title}
        </p>
        {record.content && (
          <p style={{ fontSize: 17, color: '#555', lineHeight: 2.0, marginBottom: 14 }}>
            {record.content}
          </p>
        )}
        <p style={{ fontSize: 13, color: '#C8C8C8' }}>
          {dateStr}
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
              {comments.map(comment => (
                <div key={comment.id} style={{ padding: '10px 0', borderBottom: '1px solid #FFF0F5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#FF7BA9', marginBottom: 2 }}>{comment.authorNickname}</p>
                      <p style={{ fontSize: 13, color: '#555' }}>{comment.text}</p>
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
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="댓글 입력..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 14, border: '1.5px solid #FFD6E0', fontSize: 13, outline: 'none', background: 'white' }}
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
}

const actionBtn = {
  padding: '7px 16px', borderRadius: 20,
  background: 'white', border: '1.5px solid #FFD6E0',
  color: '#FF7BA9', fontSize: 13, fontWeight: 700,
  cursor: 'pointer',
}

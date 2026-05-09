import { useState, useEffect } from 'react'
import { doc, getDoc, collection, addDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function RecordDetailPage({ user, recordId, teamId }) {
  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data())
    })
  }, [user])

  useEffect(() => {
    if (!recordId || !teamId) return

    // 기록 불러오기
    const unsub = onSnapshot(doc(db, 'teams', teamId, 'records', recordId), (snap) => {
      if (snap.exists()) setRecord({ id: snap.id, ...snap.data() })
    })

    // 댓글 불러오기
    const unsubComments = onSnapshot(
      collection(db, 'teams', teamId, 'records', recordId, 'comments'),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
        setComments(data)
      }
    )

    return () => { unsub(); unsubComments() }
  }, [recordId, teamId])

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

  if (!record) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#FF8FAB' }}>불러오는 중...</div>
  )

  const isLiked = (record.likes || []).includes(user.uid)

  return (
    <div style={{ padding: '24px 20px 120px', background: '#FFF9FB', minHeight: '100vh' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', fontSize: 20, marginBottom: 16, color: '#FF8FAB' }}>←</button>

      {/* 사진 */}
      {record.photoURL && (
        <img src={record.photoURL} alt="여행 사진" style={{
          width: '100%', height: 240, objectFit: 'cover',
          borderRadius: 16, marginBottom: 16,
        }} />
      )}

      {/* 기록 내용 */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#FF8FAB', marginBottom: 6 }}>{record.regionName}</p>
        <p style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>{record.title}</p>
        {record.content && (
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 12 }}>{record.content}</p>
        )}
        <p style={{ fontSize: 11, color: '#ccc' }}>
          {record.createdAt?.toDate
            ? record.createdAt.toDate().toLocaleDateString('ko-KR')
            : '날짜 없음'}
        </p>
      </div>

      {/* 좋아요 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
        <button onClick={handleLike} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', fontSize: 16,
        }}>
          <span style={{ fontSize: 24 }}>{isLiked ? '❤️' : '🤍'}</span>
          <span style={{ color: isLiked ? '#FF8FAB' : '#aaa', fontWeight: 'bold' }}>
            {(record.likes || []).length}
          </span>
        </button>
      </div>

      {/* 댓글 */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
          댓글 {comments.length}개
        </p>

        {comments.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>첫 댓글을 남겨보세요 😊</p>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {comments.map(comment => (
              <div key={comment.id} style={{
                padding: '10px 0',
                borderBottom: '1px solid #FFF0F5',
              }}>
                <p style={{ fontSize: 13, fontWeight: 'bold', color: '#FF8FAB', marginBottom: 2 }}>
                  {comment.authorNickname}
                </p>
                <p style={{ fontSize: 13, color: '#555' }}>{comment.text}</p>
                <p style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>
                  {comment.createdAt?.toDate
                    ? comment.createdAt.toDate().toLocaleDateString('ko-KR')
                    : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 입력 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="댓글 입력..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: 12, border: '1.5px solid #FFD6E0',
              fontSize: 13, outline: 'none', background: 'white',
            }}
          />
          <button onClick={handleComment} style={{
            padding: '10px 16px', borderRadius: 12,
            background: '#FF8FAB', color: 'white',
            fontSize: 13, fontWeight: 'bold',
          }}>
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
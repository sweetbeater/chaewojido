import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { REGION_MAP } from '../utils/regions'

export default function RecordListPage({ user, regionNum, onSelectRecord }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [mode, setMode] = useState('personal')
  const navigate = useNavigate()

  const regionInfo = REGION_MAP[regionNum]

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data())
    })
  }, [user])

  useEffect(() => {
    if (!user || !regionNum) return
    fetchRecords()
  }, [user, regionNum, mode, profile])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      let q
      if (mode === 'team' && profile?.teamId) {
        q = query(
          collection(db, 'teams', profile.teamId, 'records'),
          where('regionNum', '==', regionNum),
          orderBy('createdAt', 'desc')
        )
      } else {
        q = query(
          collection(db, 'users', user.uid, 'records'),
          where('regionNum', '==', regionNum),
          orderBy('createdAt', 'desc')
        )
      }
      const snap = await getDocs(q)
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleSelectRecord = (record) => {
    if (mode === 'team' && profile?.teamId) {
      onSelectRecord({ recordId: record.id, teamId: profile.teamId })
      navigate('/record-detail')
    }
  }

  return (
    <div style={{ padding: '24px 20px 100px', background: '#FFF9FB', minHeight: '100vh' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', fontSize: 20, marginBottom: 16, color: '#FF8FAB' }}>←</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>
          {regionInfo?.name || '지역'} 기록
        </h2>
        {profile?.teamId && (
          <div style={{ display: 'flex', gap: 8 }}>
            {['personal', 'team'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: mode === m ? '#FF8FAB' : '#FFE8EF',
                color: mode === m ? 'white' : '#FF8FAB',
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                {m === 'personal' ? '개인' : '팀'}
              </button>
            ))}
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>총 {records.length}개의 기록</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#FF8FAB' }}>불러오는 중...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <img src="/삐야_아이콘.png" alt="삐야" style={{ width: 80, opacity: 0.5, marginBottom: 12 }} />
          <p style={{ color: '#aaa', fontSize: 14 }}>아직 기록이 없어요</p>
          <button onClick={() => navigate('/record')} style={{
            marginTop: 16, padding: '12px 24px',
            borderRadius: 12, background: '#FF8FAB',
            color: 'white', fontSize: 14, fontWeight: 'bold',
          }}>
            첫 기록 남기기 ✍️
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {records.map(record => (
            <div
              key={record.id}
              onClick={() => handleSelectRecord(record)}
              style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(255,143,171,0.1)',
                cursor: mode === 'team' && profile?.teamId ? 'pointer' : 'default',
              }}
            >
              {record.photoURL && (
                <img src={record.photoURL} alt="여행 사진"
                  style={{ width: '100%', height: 180, objectFit: 'cover' }} />
              )}
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>
                  {record.title}
                </p>
                {record.content && (
                  <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 8 }}>
                    {record.content}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 11, color: '#ccc' }}>
                    {record.createdAt?.toDate
                      ? record.createdAt.toDate().toLocaleDateString('ko-KR')
                      : '날짜 없음'}
                  </p>
                  {mode === 'team' && (
                    <p style={{ fontSize: 11, color: '#FFB3C6' }}>
                      ❤️ {(record.likes || []).length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate('/record')} style={{
            width: '100%', padding: '14px',
            borderRadius: 12, background: '#FFE8EF',
            color: '#FF8FAB', fontSize: 16, fontWeight: 'bold',
          }}>
            기록 추가하기 ✍️
          </button>
        </div>
      )}
    </div>
  )
}
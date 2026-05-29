import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { REGION_MAP } from '../utils/regions'

export default function RecordListPage({ user, regionNum, onSelectRecord }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverConfirmed, setServerConfirmed] = useState(false)
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  const regionInfo = REGION_MAP[regionNum]

  useEffect(() => {
    if (!user) return
    if (user.isAnonymous) {
      setProfile({})
      return
    }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => setProfile(snap.exists() ? snap.data() : {}))
      .catch(() => setProfile({}))
  }, [user])

  useEffect(() => {
    if (!user || !regionNum || profile === null) return

    setLoading(true)
    setServerConfirmed(false)

    const coll = profile?.teamId
      ? collection(db, 'teams', profile.teamId, 'records')
      : collection(db, 'users', user.uid, 'records')

    const q = query(coll, where('regionNum', '==', regionNum), orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, { includeMetadataChanges: true }, snap => {
      // 캐시 결과가 빈 경우: 서버 응답 대기 (빈 캐시로 인한 false empty 방지)
      if (snap.metadata.fromCache && snap.empty) return
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      if (!snap.metadata.fromCache) setServerConfirmed(true)
      setLoading(false)
    }, err => {
      console.error(err)
      setServerConfirmed(true)
      setLoading(false)
    })
    const timeout = setTimeout(() => setLoading(false), 5000)
    // 8초 후에도 서버 미확인 시 강제로 확정 (네트워크 불량 대비)
    const serverTimeout = setTimeout(() => setServerConfirmed(true), 8000)
    return () => { unsub(); clearTimeout(timeout); clearTimeout(serverTimeout) }
  }, [user, regionNum, profile])

  const handleSelectRecord = (record) => {
    const teamId = profile?.teamId || null
    onSelectRecord({ recordId: record.id, teamId })
    navigate('/record-detail')
  }

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px calc(env(safe-area-inset-bottom, 0px) + 100px)', background: '#FFF9FB', minHeight: '100vh' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: 22, color: '#FF8FAB', padding: '10px 16px 10px 4px', display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer', minHeight: 44 }}>←</button>
      <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
        {regionInfo?.name || '지역'} 기록
      </h2>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>
        {loading ? '불러오는 중...' : `총 ${records.length}개의 기록`}
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#FF8FAB' }}>불러오는 중...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 80, opacity: 0.5, marginBottom: 12 }} />
          {serverConfirmed ? (
            <>
              <p style={{ color: '#aaa', fontSize: 14 }}>아직 기록이 없어요</p>
              <button onClick={() => navigate('/record')} style={{
                marginTop: 16, padding: '12px 24px',
                borderRadius: 12, background: '#FF8FAB',
                color: 'white', fontSize: 14, fontWeight: 'bold',
              }}>
                첫 기록 남기기 ✍️
              </button>
            </>
          ) : (
            <p style={{ color: '#FFB3C6', fontSize: 14 }}>기록 확인 중...</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {records.map(record => {
            const thumbURL = record.photoURLs?.[0] || record.photoURL || null
            return (
              <div
                key={record.id}
                onClick={() => handleSelectRecord(record)}
                style={{
                  background: 'white', borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(255,143,171,0.1)',
                  cursor: 'pointer',
                }}
              >
                {thumbURL && (
                  <img src={thumbURL} alt="여행 사진"
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
                    <p style={{ fontSize: 13, color: '#ccc' }}>
                      {record.createdAt?.toDate
                        ? record.createdAt.toDate().toLocaleDateString('ko-KR')
                        : '날짜 없음'}
                    </p>
                    {profile?.teamId && (
                      <p style={{ fontSize: 13, color: '#FFB3C6' }}>
                        ❤️ {(record.likes || []).length}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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

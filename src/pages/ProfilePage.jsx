import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { REGION_MAP, TOTAL_REGIONS, getCompletionRate } from '../utils/regions'
import { BADGES, getEarnedBadges } from '../utils/badges'

export default function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data())
    })
    return unsub
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const visitedRegions = profile?.visitedRegions || []
  const visitedIds = visitedRegions.map(n => REGION_MAP[n]?.id).filter(Boolean)
  const earnedBadges = getEarnedBadges(visitedIds)
  const earnedIds = new Set(earnedBadges.map(b => b.id))

  return (
    <div style={{ padding: '24px 20px 100px' }}>
      {/* 프로필 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={profile?.photoURL || '/삐야_아이콘.png'}
            alt="프로필"
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFD6E0' }}
          />
          <div>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>
              {profile?.nickname || '여행자'}
            </p>
            <p style={{ fontSize: 13, color: '#aaa' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/edit-profile')}
          style={{
            padding: '8px 16px', borderRadius: 20,
            background: '#FFE8EF', color: '#FF8FAB',
            fontSize: 13, fontWeight: 'bold',
          }}
        >
          수정
        </button>
      </div>

      {/* 완성률 */}
      <div style={{
        background: '#FFF0F5',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>내 지도 완성률</p>
        <p style={{ fontSize: 36, fontWeight: 'bold', color: '#FF8FAB' }}>
          {getCompletionRate(visitedRegions)}%
        </p>
        <p style={{ fontSize: 13, color: '#aaa' }}>{visitedRegions.length} / {TOTAL_REGIONS} 지역</p>
        <div style={{
          marginTop: 12, height: 8,
          borderRadius: 4, background: '#FFD6E0', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 4, background: '#FF8FAB',
            width: `${getCompletionRate(visitedRegions)}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 배지 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>배지</h3>
          <p style={{ fontSize: 12, color: '#aaa' }}>{earnedBadges.length} / {BADGES.length}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {BADGES.map(badge => {
            const earned = earnedIds.has(badge.id)
            return (
              <div key={badge.id} style={{
                background: earned ? '#FFF0F5' : '#F5F5F5',
                borderRadius: 16,
                padding: '16px 12px',
                textAlign: 'center',
                opacity: earned ? 1 : 0.45,
                border: earned ? '1.5px solid #FFD6E0' : '1.5px solid transparent',
                transition: 'all 0.3s',
              }}>
                <p style={{ fontSize: 32, marginBottom: 6 }}>{badge.icon}</p>
                <p style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
                  {badge.name}
                </p>
                <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>
                  {badge.description}
                </p>
                {earned && (
                  <p style={{ fontSize: 10, color: '#FF8FAB', marginTop: 4, fontWeight: 'bold' }}>
                    ✅ 획득완료
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 로그아웃 */}
      <button onClick={handleLogout} style={{
        width: '100%',
        padding: '14px',
        borderRadius: 12,
        background: '#F5F5F5',
        color: '#999',
        fontSize: 16,
        fontWeight: 'bold',
      }}>
        로그아웃
      </button>
    </div>
  )
}
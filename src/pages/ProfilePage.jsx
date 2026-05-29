import { useState, useEffect } from 'react'
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db, requestNotificationPermission, disableNotifications } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { REGION_MAP } from '../utils/regions'
import { BADGES, getEarnedBadges } from '../utils/badges'
import TwemojiImg from '../components/TwemojiImg'

export default function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [records, setRecords] = useState([])
  const [notifWorking, setNotifWorking] = useState(false)
  const [nativePermDenied, setNativePermDenied] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const navigate = useNavigate()

  const isNativeApp = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()
  const hasFcmToken = !!profile?.fcmToken

  useEffect(() => {
    if (!isNativeApp) return
    import('@capacitor-firebase/messaging').then(({ FirebaseMessaging }) => {
      FirebaseMessaging.checkPermissions().then(({ receive }) => {
        setNativePermDenied(receive === 'denied')
      }).catch(() => {})
    })
  }, [isNativeApp])

  // 네이티브(WKWebView)에서는 Notification API 없음 → checkPermissions + fcmToken으로 상태 판단
  const notifPermission = isNativeApp
    ? (nativePermDenied ? 'denied' : hasFcmToken ? 'granted' : 'default')
    : (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setProfile(snap.data())
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!profile?.teamId) { setTeamData(null); return }
    const unsub = onSnapshot(doc(db, 'teams', profile.teamId), snap => {
      if (snap.exists()) setTeamData(snap.data())
    })
    return unsub
  }, [profile?.teamId])

  useEffect(() => {
    if (!user || user.isAnonymous || profile === null) return
    const coll = profile?.teamId
      ? collection(db, 'teams', profile.teamId, 'records')
      : collection(db, 'users', user.uid, 'records')
    getDocs(coll).then(snap => setRecords(snap.docs.map(d => d.data())))
  }, [user, profile?.teamId])

  const visitedRegions = user?.isAnonymous
    ? (() => { try { return JSON.parse(localStorage.getItem('guestVisitedRegions') || '[]') } catch { return [] } })()
    : (profile?.teamId && teamData ? teamData.visitedRegions || [] : profile?.visitedRegions || [])
  const visitedIds = visitedRegions.map(n => REGION_MAP[n]?.id).filter(Boolean)
  const earnedBadges = getEarnedBadges(visitedIds, records)
  const earnedIds = new Set(earnedBadges.map(b => b.id))

  const sortedBadges = [
    ...BADGES.filter(b => earnedIds.has(b.id)),
    ...BADGES.filter(b => !earnedIds.has(b.id)),
  ]

  return (
    <div style={{ position: 'fixed', top: 0, bottom: 0, left: 'max(0px, calc(50vw - 215px))', right: 'max(0px, calc(50vw - 215px))', padding: 'calc(env(safe-area-inset-top, 0px) + 28px) 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', background: '#FFFDF8', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

      {/* 배지 상세 모달 */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #ffffff 0%, #FFF0F8 100%)',
              borderRadius: 28, padding: '28px 24px 24px',
              width: '82%', maxWidth: 300, textAlign: 'center',
              boxShadow: '0 24px 60px rgba(255,123,169,0.28)',
              border: '1.5px solid rgba(255,214,224,0.9)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: 14,
                background: '#F0F0F0', color: '#888', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
            <div style={{ marginBottom: 14 }}>
              {earnedIds.has(selectedBadge.id)
                ? <TwemojiImg code={selectedBadge.icon} size={64} />
                : <span style={{ fontSize: 48, opacity: 0.22, lineHeight: 1 }}>?</span>
              }
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#2D2D2D', marginBottom: 6 }}>
              {selectedBadge.name}
            </p>
            {earnedIds.has(selectedBadge.id) && (
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7, marginBottom: 14 }}>
                {selectedBadge.description}
              </p>
            )}
            {earnedIds.has(selectedBadge.id) ? (
              <div style={{ padding: '8px 16px', borderRadius: 20, background: '#FFE8EF', display: 'inline-block' }}>
                <span style={{ fontSize: 12, color: '#FF7BA9', fontWeight: 700 }}>✅ 획득 완료</span>
              </div>
            ) : (
              <div style={{ padding: '8px 16px', borderRadius: 20, background: '#F5F5F5', display: 'inline-block' }}>
                <span style={{ fontSize: 12, color: '#B0B0B0', fontWeight: 700 }}>🔒 미획득</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 프로필 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <img
            src={profile?.photoURL || '/도트삐야_아이콘.png'} alt="프로필"
            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFD6E0', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <p style={{ fontSize: 19, fontWeight: 800, color: '#2D2D2D', letterSpacing: '-0.3px' }}>
              {profile?.nickname || '여행자'}
            </p>
            <p style={{ fontSize: 13, color: '#B0B0B0', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user?.isAnonymous ? '게스트 모드' : user?.email}
            </p>
          </div>
        </div>
        {user?.isAnonymous ? (
          <button onClick={async () => { await signOut(auth); navigate('/login') }} style={{
            padding: '7px 16px', borderRadius: 20,
            background: '#F0F0F0', color: '#888',
            fontSize: 13, fontWeight: 700,
          }}>
            나가기
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end', flexShrink: 0 }}>
            <button onClick={() => navigate('/edit-profile')} style={{
              padding: '7px 16px', borderRadius: 20,
              background: '#FFE8EF', color: '#FF7BA9',
              fontSize: 13, fontWeight: 700,
            }}>
              정보 수정
            </button>
            <button onClick={async () => { await signOut(auth); navigate('/login') }} style={{
              padding: '5px 12px', borderRadius: 20,
              background: '#F0F0F0', color: '#B0B0B0',
              fontSize: 13, fontWeight: 600,
            }}>
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* 알림 설정 */}
      {!user?.isAnonymous && (
        <div style={{ marginBottom: 28, padding: '14px 18px', background: 'white', borderRadius: 16, border: '1px solid #FFF0F5', boxShadow: '0 2px 10px rgba(255,123,169,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D2D', marginBottom: 3 }}>🔔 푸시 알림</p>
              <p style={{ fontSize: 12, color: notifPermission === 'granted' && hasFcmToken ? '#4CAF50' : '#FF6B6B' }}>
                {notifPermission === 'unsupported' ? '이 기기는 알림을 지원하지 않아요'
                  : notifPermission === 'denied' ? '알림이 차단됨 — 기기 설정에서 허용해주세요'
                  : hasFcmToken ? '알림 정상 연결됨'
                  : '알림 미연결 — 아래 버튼으로 설정해주세요'}
              </p>
            </div>
            {notifPermission !== 'denied' && notifPermission !== 'unsupported' && (
              hasFcmToken ? (
                <button
                  disabled={notifWorking}
                  onClick={async () => {
                    setNotifWorking(true)
                    await disableNotifications(user.uid)
                    setNotifWorking(false)
                  }}
                  style={{
                    padding: '7px 14px', borderRadius: 12, flexShrink: 0,
                    background: '#FFF0F0', color: notifWorking ? '#FFB3B3' : '#FF6B6B',
                    fontSize: 13, fontWeight: 600,
                    opacity: notifWorking ? 0.6 : 1,
                  }}
                >
                  {notifWorking ? '처리 중...' : '알림 끄기'}
                </button>
              ) : (
                <button
                  disabled={notifWorking}
                  onClick={async () => {
                    setNotifWorking(true)
                    const result = await requestNotificationPermission(user.uid)
                    if (result === 'denied') setNativePermDenied(true)
                    setNotifWorking(false)
                  }}
                  style={{
                    padding: '7px 14px', borderRadius: 12, flexShrink: 0,
                    background: '#FF8FAB', color: 'white',
                    fontSize: 13, fontWeight: 600,
                    opacity: notifWorking ? 0.6 : 1,
                  }}
                >
                  {notifWorking ? '처리 중...' : '알림 켜기'}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* 배지 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#2D2D2D', letterSpacing: '-0.3px' }}>배지</h3>
          <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: '#C0C0C0' }}>
            {earnedBadges.length}/{BADGES.length}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {sortedBadges.map(badge => {
            const earned = earnedIds.has(badge.id)
            return (
              <div key={badge.id} onClick={() => setSelectedBadge(badge)} style={{ cursor: 'pointer',
                background: earned ? 'white' : '#F5F5F5',
                borderRadius: 14,
                padding: '12px 6px',
                textAlign: 'center',
                border: earned ? '1.5px solid #FFD6E0' : '1.5px solid transparent',
                boxShadow: earned ? '0 4px 12px rgba(255,123,169,0.15)' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ marginBottom: 5, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {earned
                    ? <TwemojiImg code={badge.icon} size={26} />
                    : <span style={{ fontSize: 20, opacity: 0.25, lineHeight: 1 }}>?</span>
                  }
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: earned ? '#2D2D2D' : '#B0B0B0', marginBottom: 2, letterSpacing: '-0.2px', lineHeight: 1.3 }}>
                  {badge.name}
                </p>
                {earned ? (
                  <p style={{ fontSize: 9, color: '#FF7BA9', marginTop: 3, fontWeight: 700 }}>✅ 획득</p>
                ) : (
                  <p style={{ fontSize: 12, marginTop: 2 }}>🔒</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

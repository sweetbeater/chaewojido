import { useNavigate, useLocation } from 'react-router-dom'
import TwemojiImg from './TwemojiImg'

const tabs = [
  { path: '/', label: '지도', twemoji: '1f5fa' },
  { path: '/team', label: null, twemoji: '1f91d' },
  { path: '/profile', label: '내 정보', customSrc: '/도트삐야_아이콘.png' },
]

export default function TabBar({ hasTeam }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (pathname === '/login' || pathname === '/register') return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'env(safe-area-inset-bottom, 0px)',
      left: 14,
      right: 14,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 24,
      boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
      border: '1px solid rgba(255,220,235,0.5)',
      display: 'flex',
      justifyContent: 'space-around',
      paddingTop: 5,
      paddingBottom: 5,
      zIndex: 100,
    }}>
      {tabs.map(tab => {
        const active = pathname === tab.path
        const label = tab.path === '/team' ? (hasTeam ? '팀' : '연결') : tab.label
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path, tab.path === '/' ? { state: { activeTab: 'korea' } } : undefined)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              background: active ? 'rgba(255,123,169,0.12)' : 'none',
              padding: '5px 20px',
              borderRadius: 16,
              transition: 'background 0.2s ease',
            }}
          >
            {tab.customSrc
              ? <img src={tab.customSrc} width={24} height={24} alt="" draggable={false} style={{ objectFit: 'contain', opacity: active ? 1 : 0.35 }} />
              : <TwemojiImg code={tab.twemoji} size={22} style={{ opacity: active ? 1 : 0.35 }} />
            }
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 400,
              color: active ? '#FF7BA9' : '#B0B0B0',
              letterSpacing: '-0.2px',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

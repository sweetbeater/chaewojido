import { useNavigate, useLocation } from 'react-router-dom'

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/', label: '지도', icon: '🗺️' },
    { path: '/team', label: '연결', icon: '🤝' },
    { path: '/profile', label: '내 정보', icon: '🐥' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'white',
      borderTop: '1px solid #FFD6E0',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 16px',
      zIndex: 100,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            fontSize: 22,
            opacity: location.pathname === tab.path ? 1 : 0.4,
          }}
        >
          <span>{tab.icon}</span>
          <span style={{
            fontSize: 11,
            color: location.pathname === tab.path ? '#FF8FAB' : '#999',
            fontWeight: location.pathname === tab.path ? 'bold' : 'normal',
          }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
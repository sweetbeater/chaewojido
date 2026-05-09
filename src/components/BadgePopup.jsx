import { useEffect, useState } from 'react'

export default function BadgePopup({ badges, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (badges.length > 0) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [badges])

  if (!badges.length) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }} onClick={() => { setVisible(false); setTimeout(onClose, 300) }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '32px 24px',
        textAlign: 'center',
        maxWidth: 320,
        width: '90%',
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        transition: 'transform 0.3s ease',
      }}>
        <p style={{ fontSize: 13, color: '#FF8FAB', fontWeight: 'bold', marginBottom: 8 }}>
          🎉 새 배지 획득!
        </p>
        {badges.map(badge => (
          <div key={badge.id} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 64, marginBottom: 8 }}>{badge.icon}</p>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
              {badge.name}
            </p>
            <p style={{ fontSize: 13, color: '#aaa' }}>{badge.description}</p>
          </div>
        ))}
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }} style={{
          marginTop: 8,
          padding: '12px 32px',
          borderRadius: 12,
          background: '#FF8FAB',
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
        }}>
          확인 🐥
        </button>
      </div>
    </div>
  )
}
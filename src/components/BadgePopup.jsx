import { useEffect, useState } from 'react'
import TwemojiImg from './TwemojiImg'

const PIXEL = "'Press Start 2P', cursive"

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2
  const dist = 80 + (i % 4) * 24
  const chars = ['★', '✦', '✧', '★', '✦', '⭐', '💛', '💗', '🌟'][i % 9]
  return {
    id: i,
    emoji: chars,
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
    delay: i * 0.025,
    size: 11 + (i % 4) * 3,
    duration: 0.6 + (i % 3) * 0.1,
  }
})

export default function BadgePopup({ badges, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!badges.length) return
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 4000)
    return () => clearTimeout(t)
  }, [badges])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!badges.length) return null

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* 파티클 */}
      {visible && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {PARTICLES.map(p => (
            <span
              key={p.id}
              style={{
                position: 'absolute',
                left: '50%', top: '42%',
                fontSize: p.size, lineHeight: 1,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                animation: `particleFly ${p.duration}s ease-out ${p.delay}s both`,
              }}
            >
              {p.emoji}
            </span>
          ))}
        </div>
      )}

      {/* 카드 */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #ffffff 0%, #FFF0F8 100%)',
          borderRadius: 36,
          padding: '28px 28px 24px',
          textAlign: 'center',
          maxWidth: 300,
          width: '85%',
          maxHeight: '82vh',
          display: 'flex', flexDirection: 'column',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.72) translateY(40px)',
          transition: 'transform 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 28px 72px rgba(255,123,169,0.32)',
          border: '1.5px solid rgba(255,214,224,0.9)',
        }}
      >
        {/* LEVEL UP! 픽셀 헤더 */}
        <div style={{
          fontFamily: PIXEL,
          fontSize: 10,
          color: '#FFD85C',
          marginBottom: 4,
          letterSpacing: '1px',
          textShadow: '0 0 10px rgba(255,216,92,0.6)',
          animation: visible ? 'badgeSpin 0.5s ease 0.05s both' : 'none',
          flexShrink: 0,
        }}>
          LEVEL UP!
        </div>
        <p style={{ fontSize: 13, color: '#FF7BA9', fontWeight: 800, marginBottom: 14, letterSpacing: '0.5px', flexShrink: 0 }}>
          새 배지 획득
        </p>

        {/* 배지 목록 — 여러 개일 때 스크롤 */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {badges.map(badge => {
            const iconSize = badges.length === 1 ? 76 : badges.length === 2 ? 54 : 42
            return (
              <div key={badge.id} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'inline-block', marginBottom: 10,
                  animation: visible ? 'badgeSpin 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.12s both' : 'none',
                }}>
                  <TwemojiImg code={badge.icon} size={iconSize} />
                </div>
                <p style={{ fontSize: badges.length >= 3 ? 16 : 20, fontWeight: 800, color: '#2D2D2D', marginBottom: 4, letterSpacing: '-0.3px' }}>
                  {badge.name}
                </p>
                <p style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.5 }}>{badge.description}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={handleClose}
          style={{
            marginTop: 12,
            padding: '13px 0',
            width: '100%',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #FF7BA9, #FF5499)',
            color: 'white',
            fontFamily: PIXEL,
            fontSize: 9,
            letterSpacing: '1px',
            boxShadow: '0 6px 20px rgba(255,123,169,0.45)',
            flexShrink: 0,
          }}
        >
          OK!
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'

// App Store 출시 후 이 URL을 App Store 링크로 교체하세요
const APP_URL = 'https://apps.apple.com/app/id6773252339'

export default function DesktopPromo() {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(APP_URL, {
      width: 120,
      margin: 1,
      color: { dark: '#2D2D2D', light: '#FAFAFA' },
    })
      .then(url => setQrUrl(url))
      .catch(() => {})
  }, [])

  return createPortal(
    <div
      className="desktop-promo-card"
      style={{
        position: 'fixed',
        left: 'calc(50% + 235px)',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 164,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22,
        border: '1.5px solid #FFD6E0',
        boxShadow: '0 8px 32px rgba(255,100,150,0.14), 0 2px 8px rgba(0,0,0,0.07)',
        padding: '22px 16px 18px',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        fontFamily: "'NeoDGM', sans-serif",
      }}
    >
      <img
        src="/삐야_아이콘.png"
        width={62}
        height={62}
        alt=""
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(255,100,150,0.2)' }}
      />

      <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#2D2D2D', letterSpacing: '-0.3px' }}>
          채워지도
        </p>
        <p style={{ fontSize: 10, color: '#B0B0B0', marginTop: 3, letterSpacing: '-0.1px' }}>
          우리나라 도장깨기 🗺️
        </p>
      </div>

      <div style={{
        width: '100%', height: 1,
        background: 'linear-gradient(90deg, transparent, #FFD6E0, transparent)',
      }} />

      {qrUrl ? (
        <img
          src={qrUrl}
          width={120}
          height={120}
          alt="App Store QR"
          style={{ borderRadius: 10, display: 'block' }}
        />
      ) : (
        <div style={{
          width: 120, height: 120, borderRadius: 10,
          background: '#FFF0F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28 }}>📱</span>
        </div>
      )}

      <div style={{
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        <p style={{ fontSize: 10, color: '#FF7BA9', fontWeight: 700, letterSpacing: '-0.1px' }}>
          App Store 무료 다운로드
        </p>
        <p style={{ fontSize: 9, color: '#C0C0C0', marginTop: 2 }}>
          QR코드를 스캔해보세요
        </p>
      </div>
    </div>,
    document.body
  )
}

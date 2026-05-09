export default function SplashScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#FFF9FB',
    }}>
      <img
        src="/삐야_아이콘.png"
        alt="삐야"
        style={{ width: 120, height: 120, objectFit: 'contain' }}
      />
      <p style={{
        marginTop: 16,
        fontSize: 18,
        color: '#FF8FAB',
        fontWeight: 'bold',
      }}>채워지도 불러오는 중...</p>
    </div>
  )
}
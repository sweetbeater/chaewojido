// 사진첩에서 선택한 사진을 앱으로 불러오는 동안 표시하는 로딩 오버레이.
// 네이티브 사진첩이 닫힌 뒤 onChange가 불릴 때까지의 빈 구간을 메워준다.
export default function PhotoLoadingOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>사진을 불러오는 중이에요…</p>
    </div>
  )
}

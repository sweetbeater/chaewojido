import { useState, useCallback } from 'react'

function ConfirmModal({ lines, confirmText, cancelText, destructive, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFFDF8', borderRadius: 20,
        padding: '24px 20px 20px', width: '100%', maxWidth: 320,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {lines.filter(Boolean).map((line, i, arr) => (
          <p key={i} style={{
            fontSize: i === 0 ? 15 : 13,
            fontWeight: i === 0 ? 700 : 400,
            color: i === 0 ? '#2D2D2D' : '#888',
            marginBottom: i < arr.length - 1 ? 6 : 20,
            lineHeight: 1.55,
          }}>{line}</p>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '13px 0', borderRadius: 12,
            background: '#F0F0F0', color: '#666', fontSize: 14, fontWeight: 600,
          }}>{cancelText}</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '13px 0', borderRadius: 12,
            background: destructive ? '#FF6B6B' : '#FF8FAB',
            color: 'white', fontSize: 14, fontWeight: 700,
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [state, setState] = useState(null)

  const confirm = useCallback(
    (message, { confirmText = '확인', cancelText = '취소', destructive = false } = {}) =>
      new Promise(resolve => setState({ lines: message.split('\n'), confirmText, cancelText, destructive, resolve })),
    []
  )

  const handleConfirm = () => { state?.resolve(true); setState(null) }
  const handleCancel = () => { state?.resolve(false); setState(null) }

  const modal = state ? (
    <ConfirmModal {...state} onConfirm={handleConfirm} onCancel={handleCancel} />
  ) : null

  return { confirm, modal }
}

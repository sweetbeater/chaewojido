import { useState } from 'react'
import TwemojiImg from './TwemojiImg'

const slides = [
  {
    twemoji: '1f5fa',
    title: '채워지도에 오신 걸 환영해요!',
    desc: '삐야와 함께 대한민국 구석구석을\n직접 방문하고 지도를 채워보세요.',
  },
  {
    twemoji: '1f3a8',
    title: '지역을 색칠하고 기록해요',
    desc: '지도에서 지역을 탭하면\n색칠하거나 여행 기록을 남길 수 있어요.\n사진도 최대 15장까지 추가할 수 있어요!',
  },
  {
    twemoji: '1f91d',
    title: '팀과 함께 채워요',
    desc: '팀 탭에서 팀을 만들고 초대 코드를 공유하면\n친구·연인·가족과 함께 지도를 완성할 수 있어요.',
  },
]

export default function OnboardingScreen({ onDone }) {
  const [idx, setIdx] = useState(0)
  const slide = slides[idx]
  const isLast = idx === slides.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(255,143,171,0.08)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 28px',
    }}>
      <div style={{
        background: 'white', borderRadius: 32,
        padding: '40px 28px 32px',
        width: '100%', maxWidth: 360,
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(255,143,171,0.25)',
      }}>
        <img src="/도트삐야_아이콘.png" alt="삐야" style={{ width: 80, marginBottom: 8 }} />
        <div style={{ marginBottom: 16 }}><TwemojiImg code={slide.twemoji} size={48} /></div>

        <p style={{ fontSize: 20, fontWeight: 800, color: '#2D2D2D', letterSpacing: '-0.4px', marginBottom: 14, fontFamily: "'Gowun Dodum', sans-serif" }}>
          {slide.title}
        </p>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 32, fontFamily: "'Nanum Square Round', sans-serif" }}>
          {slide.desc}
        </p>

        {/* 페이지 인디케이터 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
              background: i === idx ? '#FF8FAB' : '#FFD6E0',
              transition: 'width 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {idx > 0 && (
            <button
              onClick={() => setIdx(i => i - 1)}
              style={{ flex: 1, padding: '14px', borderRadius: 16, background: '#F5F5F5', color: '#888', fontSize: 15, fontWeight: 600 }}
            >
              이전
            </button>
          )}
          <button
            onClick={() => isLast ? onDone() : setIdx(i => i + 1)}
            style={{ flex: 2, padding: '14px', borderRadius: 16, background: '#FF8FAB', color: 'white', fontSize: 15, fontWeight: 700 }}
          >
            {isLast ? '시작하기 🐥' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}

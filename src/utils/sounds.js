let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// 색칠 시: 부드러운 브러시 노이즈 "쓱~"
export function playPaintSound() {
  try {
    const ac = getCtx()
    const len = Math.floor(ac.sampleRate * 0.18)
    const buffer = ac.createBuffer(1, len, ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8)
    }
    const source = ac.createBufferSource()
    source.buffer = buffer

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 350
    filter.Q.value = 0.6

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.28, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    source.start()
  } catch (_) {}
}

// 배지 획득 시: 폭죽 — 상승 휘슬 → 폭발 → 별똥별 틱
export function playBadgeSound() {
  try {
    const ac = getCtx()

    // 상승 휘슬
    const whistle = ac.createOscillator()
    const wGain = ac.createGain()
    whistle.type = 'sine'
    whistle.frequency.setValueAtTime(350, ac.currentTime)
    whistle.frequency.linearRampToValueAtTime(1400, ac.currentTime + 0.22)
    wGain.gain.setValueAtTime(0.18, ac.currentTime)
    wGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22)
    whistle.connect(wGain)
    wGain.connect(ac.destination)
    whistle.start(ac.currentTime)
    whistle.stop(ac.currentTime + 0.22)

    // 폭발 노이즈
    const boom = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.12), ac.sampleRate)
    const bd = boom.getChannelData(0)
    for (let i = 0; i < bd.length; i++) {
      bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bd.length, 0.4)
    }
    const boomSrc = ac.createBufferSource()
    boomSrc.buffer = boom
    const boomGain = ac.createGain()
    boomGain.gain.setValueAtTime(0.55, ac.currentTime + 0.22)
    boomGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.44)
    boomSrc.connect(boomGain)
    boomGain.connect(ac.destination)
    boomSrc.start(ac.currentTime + 0.22)

    // 별똥별 틱 (랜덤 고음들)
    const freqs = [700, 900, 1100, 800, 1000, 650, 1200, 750, 950, 600]
    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + 0.25 + i * 0.055 + Math.random() * 0.025
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.18, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13)
      osc.connect(g)
      g.connect(ac.destination)
      osc.start(t)
      osc.stop(t + 0.15)
    })
  } catch (_) {}
}

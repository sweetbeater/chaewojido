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

// 배지 획득 시: 도-미-솔-도 오름차순 차임
export function playBadgeSound() {
  try {
    const ac = getCtx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.11
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.start(t)
      osc.stop(t + 0.25)
    })
  } catch (_) {}
}

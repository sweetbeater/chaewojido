function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate()
}

function parse(str) {
  if (!str) return null
  const parts = str.split('-').map(Number)
  return { y: parts[0], m: parts[1], d: parts[2] }
}

export default function DatePicker({ value, onChange, min, max }) {
  const p = parse(value)
  const minD = parse(min)
  const maxD = parse(max)
  const today = new Date()
  const curYear = today.getFullYear()

  const y = p?.y || curYear
  const m = p?.m || (today.getMonth() + 1)
  const d = Math.min(p?.d || today.getDate(), daysInMonth(y, m))

  const minYear = minD?.y || 1990
  const maxYear = maxD?.y || curYear
  const monthMin = (minD && y === minD.y) ? minD.m : 1
  const monthMax = (maxD && y === maxD.y) ? maxD.m : 12
  const totalDays = daysInMonth(y, m)
  const dayMin = (minD && y === minD.y && m === minD.m) ? minD.d : 1
  const dayMax = (maxD && y === maxD.y && m === maxD.m) ? Math.min(maxD.d, totalDays) : totalDays

  const pad = (n, len = 2) => String(n).padStart(len, '0')
  const emit = (ny, nm, nd) => onChange(`${pad(ny, 4)}-${pad(nm)}-${pad(nd)}`)

  const handleYear = (newY) => {
    const ny = Number(newY)
    const nmMin = (minD && ny === minD.y) ? minD.m : 1
    const nmMax = (maxD && ny === maxD.y) ? maxD.m : 12
    const nm = Math.min(Math.max(m, nmMin), nmMax)
    const ndMax = Math.min(daysInMonth(ny, nm), (maxD && ny === maxD.y && nm === maxD.m) ? maxD.d : 31)
    const ndMin = (minD && ny === minD.y && nm === minD.m) ? minD.d : 1
    const nd = Math.min(Math.max(d, ndMin), ndMax)
    emit(ny, nm, nd)
  }

  const handleMonth = (newM) => {
    const nm = Number(newM)
    const ndMax = Math.min(daysInMonth(y, nm), (maxD && y === maxD.y && nm === maxD.m) ? maxD.d : 31)
    const ndMin = (minD && y === minD.y && nm === minD.m) ? minD.d : 1
    const nd = Math.min(Math.max(d, ndMin), ndMax)
    emit(y, nm, nd)
  }

  return (
    <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
      <select value={y} onChange={e => handleYear(e.target.value)} style={sel}>
        {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(yr => (
          <option key={yr} value={yr}>{yr}년</option>
        ))}
      </select>
      <select value={m} onChange={e => handleMonth(e.target.value)} style={sel}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
          <option key={mo} value={mo} disabled={mo < monthMin || mo > monthMax}>{mo}월</option>
        ))}
      </select>
      <select value={d} onChange={e => emit(y, m, Number(e.target.value))} style={sel}>
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(dy => (
          <option key={dy} value={dy} disabled={dy < dayMin || dy > dayMax}>{dy}일</option>
        ))}
      </select>
    </div>
  )
}

const sel = {
  flex: 1,
  padding: '12px 4px',
  borderRadius: 14,
  border: '1.5px solid #FFD6E0',
  fontSize: 14,
  outline: 'none',
  background: 'white',
  fontFamily: 'inherit',
  minWidth: 0,
  boxSizing: 'border-box',
}

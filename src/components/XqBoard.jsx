// Bàn cờ tướng vẽ bằng SVG. Bấm quân rồi bấm ô đến để đi (dùng tốt trên điện thoại), hoặc kéo thả.
// props (giống Board cờ vua):
//  fen, orientation ('white' = Đỏ ở dưới | 'black'), dests (Map from→[to]) → cho phép đi; null → chỉ xem
//  onMove(from, to), onSelect(sq) (chế độ đánh dấu ô), lastMove [from,to], check (ô Tướng bị chiếu)
//  shapes [{orig, dest?, brush}], marks: Set(ô) tô vòng tròn
import { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'

const CELL = 50, M = 30, MY = 50 // MY: chừa chỗ cho hàng số cột trên/dưới
const W = M * 2 + CELL * 8, H = MY * 2 + CELL * 9
const HAN = { w: { k: '帥', a: '仕', b: '相', n: '傌', r: '俥', c: '炮', p: '兵' }, b: { k: '將', a: '士', b: '象', n: '馬', r: '車', c: '砲', p: '卒' } }
const VI = { k: 'Tướng', a: 'Sĩ', b: 'Tượng', n: 'Mã', r: 'Xe', c: 'Pháo', p: 'Tốt' }
const BRUSH = { green: '#15781B', red: '#c0262d', blue: '#2563eb', yellow: '#e68f00' }

function parseFen(fen) {
  const out = {}
  fen.split(' ')[0].split('/').forEach((row, i) => {
    let f = 0
    for (const ch of row) {
      if (/\d/.test(ch)) { f += Number(ch); continue }
      const t = { e: 'b', h: 'n' }[ch.toLowerCase()] || ch.toLowerCase()
      out['abcdefghi'[f] + (9 - i)] = { type: t, color: ch === ch.toLowerCase() ? 'b' : 'w' }
      f++
    }
  })
  return out
}

export function XqBoard({ fen, orientation = 'white', dests, onMove, onSelect, lastMove, check, shapes = [], marks }) {
  const style = useStore((s) => s.settings.xqPieceStyle || 'viet')
  const pieces = useMemo(() => parseFen(fen), [fen])
  const [sel, setSel] = useState(null)
  const [drag, setDrag] = useState(null) // { from, x, y }
  const svg = useRef(null)
  const flip = orientation === 'black'
  const xy = (sq) => {
    const f = sq.charCodeAt(0) - 97, r = Number(sq[1])
    return flip ? [M + (8 - f) * CELL, MY + r * CELL] : [M + f * CELL, MY + (9 - r) * CELL]
  }
  const sqAt = (x, y) => {
    let f = Math.round((x - M) / CELL), r = Math.round((y - MY) / CELL)
    if (f < 0 || f > 8 || r < 0 || r > 9) return null
    if (flip) f = 8 - f; else r = 9 - r
    return 'abcdefghi'[f] + r
  }
  const toSvg = (e) => {
    const pt = svg.current.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svg.current.getScreenCTM().inverse()); return [p.x, p.y]
  }
  const canMove = !!dests && !onSelect
  const selDests = canMove && sel ? dests.get(sel) || [] : []

  const click = (sq) => {
    if (!sq) return
    if (onSelect) { onSelect(sq); return }
    if (!canMove) return
    if (sel && selDests.includes(sq)) { setSel(null); onMove?.(sel, sq); return }
    setSel(dests.has(sq) ? (sel === sq ? null : sq) : null)
  }
  const down = (e) => {
    const [x, y] = toSvg(e), sq = sqAt(x, y)
    if (canMove && sq && dests.has(sq)) { setDrag({ from: sq, x, y, moved: false }); e.currentTarget.setPointerCapture?.(e.pointerId) }
  }
  const move = (e) => { if (!drag) return; const [x, y] = toSvg(e); setDrag((d) => ({ ...d, x, y, moved: d.moved || Math.hypot(x - xy(d.from)[0], y - xy(d.from)[1]) > 12 })) }
  const up = (e) => {
    const [x, y] = toSvg(e), sq = sqAt(x, y)
    if (drag && drag.moved) {
      const d = drag; setDrag(null)
      if (sq && (dests.get(d.from) || []).includes(sq)) { setSel(null); onMove?.(d.from, sq) }
      return
    }
    setDrag(null)
    click(sq)
  }

  const lines = []
  for (let r = 0; r < 10; r++) lines.push(<line key={'h' + r} x1={M} y1={MY + r * CELL} x2={M + 8 * CELL} y2={MY + r * CELL} />)
  for (let f = 0; f < 9; f++) {
    if (f === 0 || f === 8) lines.push(<line key={'v' + f} x1={M + f * CELL} y1={MY} x2={M + f * CELL} y2={MY + 9 * CELL} />)
    else { lines.push(<line key={'vt' + f} x1={M + f * CELL} y1={MY} x2={M + f * CELL} y2={MY + 4 * CELL} />, <line key={'vb' + f} x1={M + f * CELL} y1={MY + 5 * CELL} x2={M + f * CELL} y2={MY + 9 * CELL} />) }
  }
  const palace = (r0) => [<line key={'p1' + r0} x1={M + 3 * CELL} y1={MY + r0 * CELL} x2={M + 5 * CELL} y2={MY + (r0 + 2) * CELL} />, <line key={'p2' + r0} x1={M + 5 * CELL} y1={MY + r0 * CELL} x2={M + 3 * CELL} y2={MY + (r0 + 2) * CELL} />]
  // số cột: mỗi bên đếm 1–9 từ phải sang trái của mình
  const bottomSide = flip ? 'b' : 'w'
  const colNums = (side, y) => Array.from({ length: 9 }, (_, i) => {
    const x = M + i * CELL
    const n = side === bottomSide ? 9 - i : i + 1
    return <text key={side + i} x={x} y={y} textAnchor="middle" fontSize="14" fill="#5b3a1a" opacity="0.75">{n}</text>
  })
  const markSet = marks || new Set()
  const arrow = (s, i) => {
    const c = BRUSH[s.brush] || BRUSH.green
    const [x1, y1] = xy(s.orig)
    if (!s.dest || s.dest === s.orig) return <circle key={'s' + i} cx={x1} cy={y1} r={CELL * 0.47} fill="none" stroke={c} strokeWidth="4" opacity="0.85" />
    const [x2, y2] = xy(s.dest), len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len
    return <g key={'s' + i} opacity="0.8"><line x1={x1 + ux * 10} y1={y1 + uy * 10} x2={x2 - ux * 16} y2={y2 - uy * 16} stroke={c} strokeWidth="8" strokeLinecap="round" />
      <polygon points={`${x2 - ux * 4},${y2 - uy * 4} ${x2 - ux * 22 - uy * 11},${y2 - uy * 22 + ux * 11} ${x2 - ux * 22 + uy * 11},${y2 - uy * 22 - ux * 11}`} fill={c} /></g>
  }
  const piece = (sq, p, x, y, ghost) => {
    const red = p.color === 'w'
    const label = style === 'han' ? HAN[p.color][p.type] : VI[p.type]
    const fs = style === 'han' ? 26 : label.length <= 3 ? 16 : 12.5
    return (
      <g key={sq + (ghost ? 'g' : '')} transform={`translate(${x},${y})`} style={{ pointerEvents: 'none' }} opacity={ghost ? 0.35 : 1}>
        <circle r="22" fill="#f8e7c4" stroke={red ? '#b91c1c' : '#1f2937'} strokeWidth="2.5" />
        <circle r="18" fill="none" stroke={red ? '#b91c1c' : '#1f2937'} strokeWidth="1" />
        <text y={fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight="700" fill={red ? '#b91c1c' : '#111827'} style={{ fontFamily: style === 'han' ? '"Noto Serif SC","Songti SC",serif' : 'inherit' }}>{label}</text>
      </g>
    )
  }

  return (
    <div className="w-full max-w-[min(92vw,520px)] select-none">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none rounded-xl" style={{ background: '#e9c88f' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setDrag(null)}>
        <g stroke="#5b3a1a" strokeWidth="1.4">{lines}{palace(0)}{palace(7)}</g>
        <rect x={M} y={MY} width={CELL * 8} height={CELL * 9} fill="none" stroke="#5b3a1a" strokeWidth="2.5" />
        <text x={M + 2 * CELL} y={MY + 4.5 * CELL + 7} textAnchor="middle" fontSize="20" fill="#5b3a1a" opacity="0.7">楚 河</text>
        <text x={M + 6 * CELL} y={MY + 4.5 * CELL + 7} textAnchor="middle" fontSize="20" fill="#5b3a1a" opacity="0.7">漢 界</text>
        {colNums(bottomSide === 'w' ? 'b' : 'w', 17)}
        {colNums(bottomSide, H - 6)}
        {lastMove && lastMove.map((sq, i) => { const [x, y] = xy(sq); return <rect key={'lm' + i} x={x - 24} y={y - 24} width="48" height="48" rx="8" fill="#9bc700" opacity="0.45" /> })}
        {check && (() => { const [x, y] = xy(check); return <circle cx={x} cy={y} r="27" fill="#ef4444" opacity="0.55" /> })()}
        {sel && (() => { const [x, y] = xy(sel); return <circle cx={x} cy={y} r="26" fill="#14b8a6" opacity="0.45" /> })()}
        {Object.entries(pieces).map(([sq, p]) => { const [x, y] = xy(sq); return drag?.moved && drag.from === sq ? piece(sq, p, x, y, true) : piece(sq, p, x, y) })}
        {selDests.map((sq) => { const [x, y] = xy(sq); return pieces[sq] ? <circle key={'d' + sq} cx={x} cy={y} r="24" fill="none" stroke="#0f766e" strokeWidth="4" opacity="0.7" /> : <circle key={'d' + sq} cx={x} cy={y} r="8" fill="#0f766e" opacity="0.55" /> })}
        {[...markSet].map((sq) => { const [x, y] = xy(sq); return <circle key={'m' + sq} cx={x} cy={y} r="24" fill="none" stroke={BRUSH.blue} strokeWidth="4" opacity="0.85" /> })}
        {shapes.map(arrow)}
        {drag?.moved && pieces[drag.from] && piece('drag', pieces[drag.from], drag.x, drag.y)}
      </svg>
    </div>
  )
}

// Tiện ích phân tích thế cờ cho người học (dùng chess.js): quân bị treo, nước chiếu, nước ăn quân…
import { Chess, SQUARES } from 'chess.js'

export const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
export const NAME_VI = { p: 'Tốt', n: 'Mã', b: 'Tượng', r: 'Xe', q: 'Hậu', k: 'Vua' }
export const opp = (c) => (c === 'w' ? 'b' : 'w')
export const colorVi = (c) => (c === 'w' ? 'Trắng' : 'Đen')

// Bản sao thế cờ nhưng đổi lượt đi (để xem đối phương có thể làm gì). Trả về null nếu không hợp lệ (vd đang bị chiếu).
export function flipTurn(fen) {
  const p = fen.split(' ')
  p[1] = p[1] === 'w' ? 'b' : 'w'
  p[3] = '-'
  try { return new Chess(p.join(' ')) } catch { return null }
}

export function pieceAt(chess, sq) { return chess.get(sq) || null }

// Quân của `color` đang bị TREO: bị tấn công mà không được bảo vệ, hoặc bị quân rẻ hơn tấn công
export function hangingPieces(fen, color) {
  const c = new Chess(fen)
  const out = []
  for (const sq of SQUARES) {
    const pc = c.get(sq)
    if (!pc || pc.color !== color || pc.type === 'k') continue
    const atk = c.attackers(sq, opp(color))
    if (!atk.length) continue
    const def = c.attackers(sq, color)
    const cheapest = Math.min(...atk.map((s) => VAL[c.get(s).type]))
    if (!def.length || cheapest < VAL[pc.type]) out.push({ sq, type: pc.type, attackers: atk, defenders: def })
  }
  return out
}

// Các ô mà `color` có thể đi tới để CHIẾU vua đối phương (nếu tới lượt `color`)
export function checkingMoves(fen, color) {
  const c = new Chess(fen)
  const board = c.turn() === color ? c : flipTurn(fen)
  if (!board) return []
  return board.moves({ verbose: true }).filter((m) => /[+#]/.test(m.san))
}

// Nước ăn quân có lợi của `color` (ăn quân treo hoặc ăn quân đắt hơn)
export function goodCaptures(fen, color) {
  const hang = new Set(hangingPieces(fen, opp(color)).map((h) => h.sq))
  const c = new Chess(fen)
  const board = c.turn() === color ? c : flipTurn(fen)
  if (!board) return []
  return board.moves({ verbose: true }).filter((m) => m.captured && (hang.has(m.to) || VAL[m.captured] > VAL[m.piece]))
}

// Bảng các ô đi được cho chessground: Map(from -> [to])
export function destsOf(chess) {
  const d = new Map()
  for (const m of chess.moves({ verbose: true })) {
    if (!d.has(m.from)) d.set(m.from, [])
    d.get(m.from).push(m.to)
  }
  return d
}

export function kingSquare(chess, color) {
  for (const sq of SQUARES) { const p = chess.get(sq); if (p && p.type === 'k' && p.color === color) return sq }
  return null
}

export function material(fen) {
  const c = new Chess(fen)
  let w = 0, b = 0
  for (const sq of SQUARES) { const p = c.get(sq); if (p && p.type !== 'k') { if (p.color === 'w') w += VAL[p.type]; else b += VAL[p.type] } }
  return { w, b }
}

export const uciOf = (m) => m.from + m.to + (m.promotion || '')
export function moveUci(chess, u) {
  try { return chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' }) } catch { return null }
}

// Mô tả nhanh nước hớ bằng tiếng Việt: sau khi đi `uci` thì có gì nguy hiểm?
export function dangerAfter(fen, u) {
  const c = new Chess(fen)
  const me = c.turn()
  const m = moveUci(c, u)
  if (!m) return []
  const notes = []
  const mates = c.moves({ verbose: true }).filter((x) => x.san.includes('#'))
  if (mates.length) notes.push(`Đối phương chiếu hết ngay bằng ${mates[0].san}!`)
  const hang = hangingPieces(c.fen(), me).filter((h) => VAL[h.type] >= 3)
  hang.forEach((h) => notes.push(`${NAME_VI[h.type]} ở ${h.sq} bị treo (bị tấn công${h.defenders.length ? ' bởi quân rẻ hơn' : ', không được bảo vệ'}).`))
  return notes
}

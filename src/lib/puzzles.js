// Kho thế cờ: bộ có sẵn (sinh bằng Stockfish, dùng offline) + thế cờ Lichess tải khi có mạng
import { Chess } from 'chess.js'
import LOCAL from '../data/puzzles.json'
import { getState, update } from './store'
import { dueReviews, newStartedToday, reviewOf } from './review'
import { today } from './date'

export const THEMES = {
  mateIn1: 'Chiếu hết 1 nước',
  mateIn2: 'Chiếu hết 2 nước',
  mateIn3: 'Chiếu hết 3 nước',
  hangingPiece: 'Ăn quân bị treo',
  fork: 'Chĩa đôi',
  pin: 'Ghim quân',
  skewer: 'Xiên (ghim ngược)',
  discoveredAttack: 'Tấn công mở',
  capture: 'Ăn quân có lợi',
  check: 'Chiếu để thắng',
  advantage: 'Nước giành ưu thế',
  myBlunder: 'Nước hớ của bạn',
}
// Chủ đề lấy từ Lichess (tên "angle" của API)
export const LICHESS_ANGLES = ['mateIn1', 'mateIn2', 'hangingPiece', 'fork', 'pin', 'skewer', 'discoveredAttack']

export const localPuzzles = LOCAL.map((p) => ({ ...p, source: 'local' }))

export function getPuzzle(id, state = getState()) {
  return localPuzzles.find((p) => p.id === id) || state.puzzles[id]?.data || null
}

// Tải 1 thế cờ từ Lichess (miễn phí, không cần tài khoản)
export async function fetchLichess(angle = 'mix', difficulty = 'easier') {
  const q = new URLSearchParams({ difficulty })
  if (angle && angle !== 'mix') q.set('angle', angle)
  const r = await fetch(`https://lichess.org/api/puzzle/next?${q}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout?.(10000) })
  if (!r.ok) throw new Error(`Lichess trả lỗi ${r.status}`)
  const d = await r.json()
  const c = new Chess()
  // PGN của ván đến đúng thời điểm bắt đầu bài (initialPly là nước cuối của đối phương)
  const sans = String(d.game.pgn).replace(/\{[^}]*\}/g, '').split(/\s+/).filter((t) => t && !/^\d+\.+$/.test(t) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))
  const upto = d.puzzle.initialPly + 1
  let last = null
  for (let i = 0; i < Math.min(upto, sans.length); i++) last = c.move(sans[i])
  const p = {
    id: 'li-' + d.puzzle.id, fen: c.fen(), lastMove: last ? [last.from, last.to] : null, moves: d.puzzle.solution,
    theme: (d.puzzle.themes || []).find((t) => THEMES[t]) || (angle !== 'mix' ? angle : 'advantage'), themes: d.puzzle.themes || [],
    rating: d.puzzle.rating, source: 'lichess', url: `https://lichess.org/training/${d.puzzle.id}`,
  }
  // kiểm tra nước đầu hợp lệ
  const t = new Chess(p.fen)
  try { t.move({ from: p.moves[0].slice(0, 2), to: p.moves[0].slice(2, 4), promotion: p.moves[0][4] || 'q' }) } catch { throw new Error('Thế cờ Lichess không đọc được, thử lại') }
  update((s) => { s.puzzles[p.id] = { ...(s.puzzles[p.id] || { attempts: 0 }), data: p } })
  return p
}

export const isDuePuzzle = (type, id, s = getState()) => { const r = reviewOf(type, id, s); return !!r && r.due <= today() }

// Hàng đợi hôm nay: bài đến hạn ôn trước, rồi bài mới (giới hạn mỗi ngày)
export function dueList(type = 'puzzle', s = getState()) {
  return dueReviews(s).filter((r) => r.type === type).map((r) => getPuzzle(r.refId, s)).filter(Boolean)
}
export function newLeft(type = 'puzzle', s = getState()) {
  return Math.max(0, s.settings.newPuzzlesPerDay - newStartedToday(type, s))
}
export function freshLocal({ theme = 'all', minPly = 1, type = 'puzzle' } = {}, s = getState()) {
  return localPuzzles
    .filter((p) => !reviewOf(type, p.id, s) && p.moves.length >= minPly && (theme === 'all' || p.theme === theme || (theme === 'mate' && p.theme.startsWith('mate'))))
    .sort((a, b) => a.rating - b.rating)
}

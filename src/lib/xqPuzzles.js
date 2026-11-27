// Kho thế cờ TƯỚNG: bộ có sẵn (sinh bằng scripts/gen-xq.mjs, dùng offline) + nước hớ của bạn sau ván với máy
import LOCAL from '../data/xqPuzzles.json'
import { getState } from './store'
import { dueReviews, newStartedToday, reviewOf } from './review'

export const XQ_THEMES = {
  mateIn1: 'Chiếu hết 1 nước',
  mateIn2: 'Chiếu hết 2 nước',
  mateIn3: 'Chiếu hết 3 nước',
  hangingPiece: 'Ăn quân bị treo',
  fork: 'Đòn đôi (bắt hai quân)',
  capture: 'Ăn quân có lợi',
  check: 'Chiếu để thắng quân',
  advantage: 'Nước giành ưu thế',
  myBlunder: 'Nước hớ của bạn',
}
export const isMateTheme = (t) => /^mateIn\d$/.test(t || '')

export const xqLocal = LOCAL.map((p) => ({ ...p, source: 'local' }))

export function getXqPuzzle(id, s = getState()) {
  return xqLocal.find((p) => p.id === id) || s.xqPuzzles?.[id]?.data || null
}
export function xqDueList(type = 'xqpuzzle', s = getState()) {
  return dueReviews(s).filter((r) => r.type === type).map((r) => getXqPuzzle(r.refId, s)).filter(Boolean)
}
export function xqNewLeft(type = 'xqpuzzle', s = getState()) {
  return Math.max(0, (s.settings.newXqPerDay ?? 10) - newStartedToday(type, s))
}
export function xqFresh({ theme = 'all', minPly = 1, type = 'xqpuzzle' } = {}, s = getState()) {
  return xqLocal
    .filter((p) => !reviewOf(type, p.id, s) && p.moves.length >= minPly && (theme === 'all' || p.theme === theme || (theme === 'mate' && isMateTheme(p.theme))))
    .sort((a, b) => a.rating - b.rating)
}

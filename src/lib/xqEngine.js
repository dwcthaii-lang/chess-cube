// Gọi máy cờ tướng trong Web Worker. Mọi lệnh xếp hàng, trả về Promise.
import { MATE } from './xiangqi'
export { LEVELS } from './xiangqi'

let worker = null, nextId = 1
const pending = new Map()
function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./xqWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = (e) => { const { id, res, error } = e.data; const p = pending.get(id); pending.delete(id); if (!p) return; error ? p.reject(new Error(error)) : p.resolve(res) }
  return worker
}
function call(msg) {
  return new Promise((resolve, reject) => { const id = nextId++; pending.set(id, { resolve, reject }); getWorker().postMessage({ ...msg, id }) })
}

// Nước máy đi ở mức `level` (1–8). hist: danh sách hash thế cờ đã qua (tránh lặp)
export const xqBestMove = (fen, level, hist) => call({ cmd: 'pick', fen, level, hist }).then((r) => r.move)
// Phân tích: { move, score (theo góc bên đi, centi-tốt), pv }
export const xqAnalyse = (fen, { depth = 4, timeMs = 1500 } = {}) => call({ cmd: 'analyse', fen, depth, timeMs })
export const isMateScore = (s) => Math.abs(s) > MATE - 200

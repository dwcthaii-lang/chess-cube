// Web Worker chạy máy cờ tướng (để giao diện không bị đứng khi máy nghĩ)
import { Position, search, pickMove } from './xiangqi'

const load = (fen, hist) => { const p = new Position(fen); if (hist) p.hist = hist; return p }

self.onmessage = (e) => {
  const { id, cmd, fen, hist, level, depth, timeMs } = e.data
  try {
    let res
    if (cmd === 'pick') res = { move: pickMove(load(fen, hist), level) }
    else if (cmd === 'analyse') res = search(load(fen, hist), { depth: depth || 4, timeMs: timeMs || 1500 })
    self.postMessage({ id, res })
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) })
  }
}

// Stockfish 19 (bản WASM rút gọn, 1 luồng) chạy trong Web Worker – không cần máy chủ, không cần mạng sau khi tải
let worker = null
let queue = Promise.resolve()
let listeners = []

function getWorker() {
  if (worker) return worker
  const url = new URL('engine/stockfish-19-lite-single.js', document.baseURI)
  worker = new Worker(url)
  worker.onmessage = (e) => { const line = String(e.data); listeners.forEach((l) => l(line)) }
  worker.postMessage('uci')
  worker.postMessage('setoption name Hash value 32')
  return worker
}

function run(cmds, until) {
  // xếp hàng: mỗi lệnh "go" chạy xong mới tới lệnh sau
  const job = queue.then(() => new Promise((resolve) => {
    const w = getWorker()
    const lines = []
    const l = (line) => {
      lines.push(line)
      if (until.test(line)) { listeners = listeners.filter((x) => x !== l); resolve(lines) }
    }
    listeners.push(l)
    cmds.forEach((c) => w.postMessage(c))
  }))
  queue = job.catch(() => {})
  return job
}

export function engineReady() {
  return run(['isready'], /^readyok/)
}

// Điểm theo góc nhìn bên đi. Trả về [{ move, cp, mate, pv }]
export async function analyse(fen, { depth = 12, multipv = 1, movetime } = {}) {
  const go = movetime ? `go movetime ${movetime}` : `go depth ${depth}`
  const lines = await run(['setoption name Skill Level value 20', `setoption name MultiPV value ${multipv}`, `position fen ${fen}`, go], /^bestmove/)
  const best = {}
  for (const l of lines) {
    const m = l.match(/ depth (\d+) .*?multipv (\d+) score (cp|mate) (-?\d+).*? pv (.+)$/)
    if (!m) continue
    best[m[2]] = { depth: Number(m[1]), cp: m[3] === 'cp' ? Number(m[4]) : null, mate: m[3] === 'mate' ? Number(m[4]) : null, pv: m[5].split(' ') }
  }
  return Object.keys(best).sort().map((k) => ({ ...best[k], move: best[k].pv[0] }))
}

// Điểm số thống nhất (centipawn), mate → ±10000
export const scoreOf = (x) => (!x ? 0 : x.mate != null ? (x.mate > 0 ? 10000 - x.mate * 10 : -10000 - x.mate * 10) : x.cp)

// Độ mạnh máy khi đánh: 1 (rất dễ) → 8 (mạnh)
export const LEVELS = [
  null,
  { skill: 0, depth: 1, label: 'Mới học (~400)' },
  { skill: 2, depth: 2, label: 'Rất dễ (~600)' },
  { skill: 4, depth: 3, label: 'Dễ (~800)' },
  { skill: 6, depth: 5, label: 'Trung bình (~1000)' },
  { skill: 9, depth: 7, label: 'Khá (~1200)' },
  { skill: 12, depth: 9, label: 'Mạnh (~1500)' },
  { skill: 16, depth: 11, label: 'Rất mạnh (~1800)' },
  { skill: 20, depth: 14, label: 'Tối đa' },
]

export async function bestMove(fen, level = 3) {
  const L = LEVELS[Math.max(1, Math.min(8, level))]
  const lines = await run([`setoption name Skill Level value ${L.skill}`, 'setoption name MultiPV value 1', `position fen ${fen}`, `go depth ${L.depth}`], /^bestmove/)
  const last = lines[lines.length - 1]
  return last.split(' ')[1]
}

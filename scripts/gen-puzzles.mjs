// Sinh bộ thế cờ chiến thuật + thế cờ "quét nguy hiểm" bằng Stockfish (chạy một lần, kết quả lưu vào src/data/*.json)
// Cách làm: cho máy tự đánh kiểu "người chơi phong trào" (đôi khi đi hớ). Khi một bên vừa đi hớ mà bên kia có
// nước thắng rõ ràng và DUY NHẤT → lưu thành bài. Dùng: node scripts/gen-puzzles.mjs [số bài] [file ra]
import { spawn } from 'node:child_process'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { Chess } from 'chess.js'

const TARGET = Number(process.argv[2] || 240)
const OUT = process.argv[3] || 'src/data/puzzles.json'
const SCAN_OUT = process.argv[4] || 'src/data/scanPositions.json'
const ENGINE = new URL('../node_modules/stockfish/bin/stockfish-19-lite-single.js', import.meta.url).pathname

// ───── Engine UCI ─────
const eng = spawn('node', [ENGINE], { stdio: ['pipe', 'pipe', 'inherit'] })
let buf = ''
let waiter = null
const lines = []
eng.stdout.on('data', (d) => {
  buf += d
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
    lines.push(l)
    if (waiter && waiter.test(l)) { const w = waiter; waiter = null; w.done([...lines]); lines.length = 0 }
  }
})
const send = (c) => eng.stdin.write(c + '\n')
const until = (re) => new Promise((done) => { waiter = { test: (l) => re.test(l), done } })
async function init() { send('uci'); await until(/^uciok/); send('setoption name Hash value 64'); send('isready'); await until(/^readyok/) }

// Phân tích: trả về [{ move, cp, mate, pv }] theo multipv, điểm theo góc nhìn bên đi
async function analyse(fen, { depth = 12, multipv = 2 } = {}) {
  send(`setoption name MultiPV value ${multipv}`)
  send(`position fen ${fen}`)
  send(`go depth ${depth}`)
  const out = await until(/^bestmove/)
  const best = {}
  for (const l of out) {
    const m = l.match(/ depth (\d+) .*multipv (\d+) score (cp|mate) (-?\d+).* pv (.+)$/)
    if (!m || Number(m[1]) !== depth) continue
    best[m[2]] = { cp: m[3] === 'cp' ? Number(m[4]) : null, mate: m[3] === 'mate' ? Number(m[4]) : null, pv: m[5].split(' ') }
  }
  return Object.keys(best).sort().map((k) => ({ ...best[k], move: best[k].pv[0] }))
}
const score = (x) => (x.mate != null ? (x.mate > 0 ? 10000 - x.mate * 10 : -10000 - x.mate * 10) : x.cp)

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
const uci = (c, u) => c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' })

function themeOf(fen, pv, mate) {
  if (mate) return `mateIn${mate}`
  const c = new Chess(fen)
  const first = uci(c, pv[0])
  // ăn quân không được bảo vệ
  if (first.captured) {
    const before = new Chess(fen)
    const defended = before.attackers(first.to, first.color === 'w' ? 'b' : 'w').length > 0
    if (!defended) return 'hangingPiece'
  }
  // chĩa đôi: quân vừa đi tấn công ≥ 2 mục tiêu giá trị (vua hoặc quân ≥ 3 điểm, hoặc quân lớn hơn nó)
  const targets = c.moves({ square: first.to, verbose: true }).filter((m) => m.captured)
  const kingHit = c.inCheck()
  const big = targets.filter((m) => VAL[m.captured] >= 3 && VAL[m.captured] > VAL[first.piece] - 0.5)
  if ((kingHit ? 1 : 0) + big.length >= 2) return 'fork'
  if (first.captured) return 'capture'
  if (kingHit) return 'check'
  return 'advantage'
}

async function main() {
  await init()
  const puzzles = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : []
  const scan = existsSync(SCAN_OUT) ? JSON.parse(readFileSync(SCAN_OUT, 'utf8')) : []
  const seen = new Set(puzzles.map((p) => p.fen))
  let games = 0
  while (puzzles.length < TARGET) {
    games++
    const g = new Chess()
    let prevEval = 0 // điểm của bên vừa đi, trước khi đi
    for (let ply = 0; ply < 90 && !g.isGameOver(); ply++) {
      const fen = g.fen()
      const res = await analyse(fen, { depth: ply < 8 ? 4 : 7, multipv: 3 })
      if (!res.length) break
      const evalNow = score(res[0])
      // chọn nước kiểu người chơi phong trào
      let pick
      const r = Math.random()
      if (ply < 8) pick = res[Math.floor(Math.random() * Math.min(4, res.length))].move
      else if (r < 0.62) pick = res[0].move
      else if (r < 0.82) pick = res[Math.min(1, res.length - 1)].move
      else if (r < 0.9) pick = res[Math.min(2, res.length - 1)].move
      else { const all = g.moves({ verbose: true }); const m = all[Math.floor(Math.random() * all.length)]; pick = m.from + m.to + (m.promotion || '') }
      const mv = uci(g, pick)
      if (!mv) break
      if (g.isGameOver()) break
      // Vị trí quét nguy hiểm: thế trung cuộc bình thường
      if (ply >= 12 && ply % 7 === 0 && scan.length < 220) scan.push({ fen: g.fen(), lastMove: [mv.from, mv.to] })
      if (ply < 10) { prevEval = evalNow; continue }
      // Bên vừa đi có hớ không? Kiểm tra bên còn lại
      const fen2 = g.fen()
      if (seen.has(fen2)) continue
      // lọc nhanh: chỉ phân tích sâu khi thấy bên kia có lợi thế lớn
      const quick = await analyse(fen2, { depth: 7, multipv: 1 })
      if (!quick.length || score(quick[0]) < 220) { prevEval = evalNow; continue }
      const an = await analyse(fen2, { depth: 13, multipv: 2 })
      if (!an.length) continue
      const b = an[0], s2 = an[1]
      const bScore = score(b), sScore = s2 ? score(s2) : -99999
      const wasOk = evalNow > -150 // trước khi hớ, bên vừa đi chưa thua
      const isMate = b.mate != null && b.mate > 0 && b.mate <= 3
      const winning = isMate || (bScore >= 280 && bScore < 5000)
      const unique = isMate ? (s2 == null || s2.mate == null || s2.mate <= 0 || s2.mate > b.mate + 1) && sScore < bScore - 150 : sScore < 120 && bScore - sScore >= 220
      if (wasOk && winning && unique) {
        // Lời giải: tối đa 3 nước của người giải (5 ply); nước sau phải vẫn duy nhất
        let sol = [b.pv[0]]
        const plyMax = isMate ? b.mate * 2 - 1 : 3
        const c = new Chess(fen2)
        uci(c, b.pv[0])
        for (let k = 1; k < plyMax && k + 1 < b.pv.length + 1; k += 2) {
          if (!b.pv[k] || !b.pv[k + 1] || c.isGameOver()) break
          uci(c, b.pv[k])
          const a2 = await analyse(c.fen(), { depth: 12, multipv: 2 })
          if (!a2.length) break
          const u = isMate ? a2[0].mate != null && a2[0].mate > 0 && (!a2[1] || a2[1].mate == null || a2[1].mate <= 0 || a2[1].mate > a2[0].mate) : score(a2[0]) - (a2[1] ? score(a2[1]) : -99999) >= 200
          if (!u) { sol = isMate ? null : sol; break }
          sol.push(b.pv[k], a2[0].move)
          uci(c, a2[0].move)
        }
        if (process.env.MULTI && sol && sol.length < 3) { prevEval = evalNow; continue }
        if (sol && (!isMate || new Chess(fen2).isGameOver() === false)) {
          // Bài chiếu hết phải kết thúc bằng chiếu hết thật
          let okLine = true
          if (isMate) { const t = new Chess(fen2); sol.forEach((u) => uci(t, u)); okLine = t.isCheckmate() }
          if (okLine) {
            const theme = themeOf(fen2, sol, isMate ? b.mate : 0)
            const rating = isMate ? 800 + b.mate * 250 : 900 + (sol.length - 1) * 200 + (theme === 'advantage' ? 300 : theme === 'fork' ? 150 : 0)
            puzzles.push({ id: `g${process.argv[5] || ''}${puzzles.length + 1}`, fen: fen2, lastMove: [mv.from, mv.to], moves: sol, theme, rating, eval: isMate ? `#${b.mate}` : bScore })
            seen.add(fen2)
            process.stdout.write(`\r${puzzles.length}/${TARGET} bài · ${games} ván · ${theme}            `)
            if (puzzles.length % 10 === 0) { writeFileSync(OUT, JSON.stringify(puzzles)); writeFileSync(SCAN_OUT, JSON.stringify(scan)) }
            break // mỗi ván lấy tối đa 1 bài để đa dạng
          }
        }
      }
      prevEval = evalNow
    }
  }
  writeFileSync(OUT, JSON.stringify(puzzles))
  writeFileSync(SCAN_OUT, JSON.stringify(scan))
  console.log(`\nXong: ${puzzles.length} bài, ${scan.length} thế quét`)
  send('quit')
  process.exit(0)
}
main()

// Sinh bộ thế cờ TƯỚNG (chiến thuật + tính nước) và thế "quét nguy hiểm" bằng máy cờ tướng của app.
// Cách làm giống phần cờ vua: cho máy tự đánh kiểu "người chơi phong trào" (đôi khi đi hớ). Khi bên kia có
// nước thắng rõ ràng và DUY NHẤT → lưu thành bài. Chiếu hết được kiểm tra vét cạn (mọi cách đỡ).
// Dùng: node scripts/gen-xq.mjs <số bài> <file bài ra> <file thế quét ra> [hạt giống]
// Chạy song song nhiều tiến trình rồi gộp: node scripts/gen-xq.mjs merge <file bài> <file quét> tmp/a*.json …
import { writeFileSync, readFileSync } from 'node:fs'
import {
  Position, rootScores, search, mateDistance, mateMoves, bestDefence, pickMove, hangingPieces, checkingMoves,
  goodCaptures, parseUci, sqIndex, VAL, MATE,
} from '../src/lib/xiangqi.js'

if (process.argv[2] === 'merge') {
  const [, , , outP, outS, ...ins] = process.argv
  const P = [], S = [], seen = new Set()
  for (const f of ins) {
    const d = JSON.parse(readFileSync(f, 'utf8'))
    for (const p of d.puzzles) if (!seen.has(p.fen.split(' ').slice(0, 2).join(' '))) { seen.add(p.fen.split(' ').slice(0, 2).join(' ')); P.push(p) }
    S.push(...d.scan)
  }
  P.sort((a, b) => a.rating - b.rating)
  P.forEach((p, i) => (p.id = 'x' + (i + 1)))
  writeFileSync(outP, JSON.stringify(P)); writeFileSync(outS, JSON.stringify(S.slice(0, 400)))
  const th = {}; P.forEach((p) => (th[p.theme] = (th[p.theme] || 0) + 1))
  console.log(P.length, 'bài', S.length, 'thế quét', th, 'nhiều nước:', P.filter((p) => p.moves.length >= 3).length)
  process.exit(0)
}

const TARGET = Number(process.argv[2] || 60)
const OUT = process.argv[3] || 'tmp/xq.json'
let seed = Number(process.argv[5] || Date.now() % 100000) || 1
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

const puzzles = [], scan = [], seen = new Set()
const save = () => writeFileSync(OUT, JSON.stringify({ puzzles, scan }))

function mateLine(pos, d) {
  // lời giải chiếu hết: nước của mình (duy nhất ở nước đầu), nước đỡ cứng đầu nhất, …
  const line = []
  const p = pos.clone()
  for (let k = d; k >= 1; k--) {
    const ms = mateMoves(p, k)
    if (!ms.length) return null
    const m = ms[0]
    line.push(m); p.moveByUci(m)
    if (k > 1) { const r = bestDefence(p, k - 1); if (!r) return null; line.push(r); p.moveByUci(r) }
  }
  return p.isMate() ? line : null
}

function themeOf(pos, u) {
  const me = pos.turnColor()
  const capT = pos.get(u.slice(2, 4))
  const hang = new Set(hangingPieces(pos, me === 'w' ? 'b' : 'w').map((h) => h.sq))
  if (capT && hang.has(u.slice(2, 4))) return 'hangingPiece'
  const p = pos.clone(); const info = p.moveByUci(u)
  // chĩa đôi: quân vừa đi doạ ≥ 2 mục tiêu (Tướng hoặc quân ≥ 400)
  const to = sqIndex(info.to)
  const side = me === 'w' ? 0 : 1
  const targets = p.gen(side, true).filter((m) => (m & 127) === to).map((m) => p.board[m >> 7]).filter((q) => (q & 7) === 1 || VAL[q & 7] >= 400)
  if (targets.length >= 2) return 'fork'
  if (capT && VAL['kabnrcp'.indexOf(capT.type) + 1] > VAL['kabnrcp'.indexOf(info.piece) + 1]) return 'capture'
  if (p.inCheck()) return 'check'
  return capT ? 'capture' : 'advantage'
}
const RATING = { mateIn1: 700, mateIn2: 1000, mateIn3: 1300, hangingPiece: 800, capture: 900, check: 1100, fork: 1100, advantage: 1250 }

function tryPuzzle(pos, prevForMe, lastMove) {
  const key = pos.fen().split(' ').slice(0, 2).join(' ')
  if (seen.has(key)) return
  // 1) chiếu hết liên hoàn ≤ 3 nước, nước đầu duy nhất
  const d = mateDistance(pos, 3)
  if (d) {
    if (mateMoves(pos, d).length !== 1) return
    const line = mateLine(pos, d)
    if (!line) return
    seen.add(key)
    puzzles.push({ fen: pos.fen(), lastMove, moves: line, theme: `mateIn${d}`, rating: RATING[`mateIn${d}`] })
    return
  }
  // 2) nước giành ưu thế rõ ràng và duy nhất (đối phương vừa đi hớ)
  const quick = rootScores(pos, 3, 4000)
  if (quick.length < 2) return
  const [b1, b2] = quick
  if (b1.score < 200 || b1.score - b2.score < 250 || b1.score - prevForMe < 250 || b1.score > MATE - 200) return
  const deep = rootScores(pos, 5, 20000)
  const [c1, c2] = deep
  if (c1.move !== b1.move || c1.score < 200 || c1.score - c2.score < 250) return
  const moves = [c1.move]
  // nối dài 3 nước nếu nước thứ hai của mình cũng bắt buộc (ăn quân / chiếu) và duy nhất
  const p = pos.clone(); p.moveByUci(c1.move)
  if (!p.isMate()) {
    const reply = search(p, { depth: 5, timeMs: 4000 }).move
    if (reply) {
      p.moveByUci(reply)
      const s2 = rootScores(p, 4, 8000)
      if (s2.length >= 2 && s2[0].score - s2[1].score >= 250 && s2[0].score >= 200 && (p.get(s2[0].move.slice(2, 4)) || p.givesCheck(parseUci(s2[0].move)))) moves.push(reply, s2[0].move)
    }
  }
  seen.add(key)
  const theme = themeOf(pos, c1.move)
  puzzles.push({ fen: pos.fen(), lastMove, moves, theme, rating: RATING[theme] + (moves.length >= 3 ? 150 : 0), eval: c1.score })
}

let games = 0
const t0 = Date.now()
while (puzzles.length < TARGET) {
  games++
  const pos = new Position()
  const lv = [2 + Math.floor(rand() * 4), 2 + Math.floor(rand() * 4)]
  let last = null, prevScore = 0 // điểm (theo góc Đỏ) trước nước vừa đi
  for (let ply = 0; ply < 160; ply++) {
    if (pos.isMate() || pos.repetitions() >= 2) break
    const me = pos.turn
    if (ply >= 8) {
      // thế quét nguy hiểm (lấy ngẫu nhiên, ưu tiên thế có gì đó để tìm)
      if (rand() < 0.06) {
        const c = pos.turnColor(), o = c === 'w' ? 'b' : 'w'
        const n = hangingPieces(pos, c).length + checkingMoves(pos, o).length + goodCaptures(pos, c).length
        if (n > 0 && n < 9) scan.push({ fen: pos.fen(), lastMove: last })
      }
      tryPuzzle(pos, me === 0 ? prevScore : -prevScore, last)
      if (puzzles.length >= TARGET) break
    }
    const ev = search(pos, { depth: 3, timeMs: 1500 }).score
    prevScore = me === 0 ? ev : -ev
    const u = ply < 4 ? pickMove(pos, 1, rand) : pickMove(pos, lv[me], rand)
    if (!u) break
    pos.moveByUci(u)
    last = [u.slice(0, 2), u.slice(2, 4)]
  }
  save()
  console.error(`ván ${games}: ${puzzles.length}/${TARGET} bài, ${scan.length} thế quét, ${Math.round((Date.now() - t0) / 1000)}s`)
}
save()

// Kiểm tra luật cờ tướng (perft so với số chuẩn) và bộ thế cờ (nước hợp lệ, chiếu hết đúng & nước đầu duy nhất)
// Dùng: node scripts/verify-xq.mjs
import { readFileSync } from 'node:fs'
import { Position, mateMoves, mateDistance } from '../src/lib/xiangqi.js'

const p = new Position()
const perft = (d) => { if (!d) return 1; let n = 0; for (const m of p.gen()) { if (!p.isLegal(m)) continue; p.make(m); n += perft(d - 1); p.unmake() } return n }
const want = [44, 1920, 79666, 3290240]
const got = want.map((_, i) => perft(i + 1))
let bad = got.some((x, i) => x !== want[i]) ? 1 : 0
console.log('perft', got.join(' / '), bad ? '❌ SAI (chuẩn ' + want.join(' / ') + ')' : '✅')

const P = JSON.parse(readFileSync(new URL('../src/data/xqPuzzles.json', import.meta.url), 'utf8'))
for (const x of P) {
  const pos = new Position(x.fen)
  if (x.theme.startsWith('mate')) {
    const k = Number(x.theme.slice(-1)), ms = mateMoves(pos, k)
    if (mateDistance(pos, 3) !== k || ms.length !== 1 || ms[0] !== x.moves[0]) { bad++; console.log('❌ chiếu hết sai', x.id) }
  }
  for (const u of x.moves) if (!pos.moveByUci(u)) { bad++; console.log('❌ nước không hợp lệ', x.id, u); break }
  if (x.theme.startsWith('mate') && !pos.isMate()) { bad++; console.log('❌ lời giải không kết thúc bằng chiếu hết', x.id) }
}
const S = JSON.parse(readFileSync(new URL('../src/data/xqScan.json', import.meta.url), 'utf8'))
for (const s of S) { try { new Position(s.fen) } catch { bad++; console.log('❌ thế quét lỗi', s.fen) } }
console.log(`${P.length} thế cờ, ${S.length} thế quét:`, bad ? `❌ ${bad} lỗi` : '✅ tất cả đúng')
process.exit(bad ? 1 : 0)

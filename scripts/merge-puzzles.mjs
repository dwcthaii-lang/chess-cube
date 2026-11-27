// Gộp kết quả các tiến trình sinh thế cờ chạy song song
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const [, , outP, outS, ...ins] = process.argv
const P = [], S = [], seen = new Set()
for (const k of ins) {
  const pf = `${k}/pz`, files = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [`${k}/pz${i}.json`, `${k}/sc${i}.json`])
  for (const [a, b] of files) {
    if (existsSync(a)) for (const p of JSON.parse(readFileSync(a, 'utf8'))) if (!seen.has(p.fen)) { seen.add(p.fen); P.push(p) }
    if (existsSync(b)) S.push(...JSON.parse(readFileSync(b, 'utf8')))
  }
}
P.forEach((p, i) => (p.id = 'p' + (i + 1)))
writeFileSync(outP, JSON.stringify(P)); writeFileSync(outS, JSON.stringify(S.slice(0, 400)))
const th = {}; P.forEach((p) => (th[p.theme] = (th[p.theme] || 0) + 1))
console.log(P.length, 'bài', S.length, 'thế quét', th, 'nhiều nước:', P.filter((p) => p.moves.length >= 3).length)

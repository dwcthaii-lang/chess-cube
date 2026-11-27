// Kiểm tra công thức Rubik bằng mô phỏng: F2L/tâm còn nguyên, tầng cuối thay đổi đúng kiểu
import { cube3x3x3, cube2x2x2, puzzles } from 'cubing/puzzles'
import { Alg } from 'cubing/alg'
const { ALGS } = await import('../src/data/algs.js')
const kp3 = await cube3x3x3.kpuzzle(), kp2 = await cube2x2x2.kpuzzle(), kp4 = await puzzles['4x4x4'].kpuzzle()
const show = (o) => JSON.stringify(o)
for (const a of ALGS) {
  const kp = a.set === '222' ? kp2 : a.set === '444' ? kp4 : kp3
  const st = kp.defaultPattern().applyAlg(new Alg(a.alg)).patternData
  const rep = {}
  for (const [orb, d] of Object.entries(st)) {
    const moved = d.pieces.map((p, i) => (p !== i || (d.orientation && d.orientation[i] !== 0) ? i : -1)).filter((x) => x >= 0)
    if (moved.length) rep[orb] = moved.join(',')
  }
  // 3x3: tầng cuối = cạnh 0-3, góc 0-3. Kiểm tra định hướng sau khi làm (đối với ca bắt đầu = nghịch đảo)
  let note = ''
  if (kp === kp3) {
    const inv = kp.defaultPattern().applyAlg(new Alg(a.alg).invert()).patternData
    note = ` caseEO=${inv.EDGES.orientation.slice(0, 4).join('')} caseCO=${inv.CORNERS.orientation.slice(0, 4).join('')} casePermE=${inv.EDGES.pieces.slice(0, 4).join('')} casePermC=${inv.CORNERS.pieces.slice(0, 4).join('')}`
  }
  console.log(a.id.padEnd(16), show(rep), note)
}

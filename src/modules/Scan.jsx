// QUÉT NGUY HIỂM – luyện thói quen nhìn bàn cờ trước mỗi nước (sửa lỗi bỏ quên quân bị đe doạ / bị chiếu)
// Mỗi thế cờ, người học bấm đánh dấu trên bàn: ① quân của mình đang bị treo ② ô đối phương có thể chiếu
// ③ quân đối phương mình ăn được có lợi. Máy so với đáp án tính bằng chess.js.
import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import SCAN from '../data/scanPositions.json'
import { localPuzzles } from '../lib/puzzles'
import { hangingPieces, checkingMoves, goodCaptures, colorVi, opp, NAME_VI } from '../lib/chessx'
import { scheduleReview } from '../lib/review'
import { update, logHistory, useStore } from '../lib/store'
import { Board } from '../components/Board'
import { PageHeader, Progress } from '../components/ui'
import { useHotkeys } from '../lib/hotkeys'

const STEPS = [
  { key: 'mine', title: '① Quân CỦA BẠN đang bị treo', hint: 'Quân bị tấn công mà không được bảo vệ, hoặc bị quân rẻ hơn tấn công (vd Tốt đánh Mã). Bấm vào các quân đó.' },
  { key: 'checks', title: '② Đối phương có thể CHIẾU bạn ở đâu?', hint: 'Giả sử tới lượt đối phương: bấm vào các Ô mà quân đối phương có thể đi tới để chiếu vua bạn.' },
  { key: 'targets', title: '③ Quân đối phương bạn ĂN ĐƯỢC có lợi', hint: 'Quân đối phương bị treo, hoặc bạn ăn được bằng quân rẻ hơn. Bấm vào các quân đó.' },
]
const SESSION = 5

function answers(fen) {
  const me = new Chess(fen).turn()
  return {
    mine: new Set(hangingPieces(fen, me).map((h) => h.sq)),
    checks: new Set(checkingMoves(fen, opp(me)).map((m) => m.to)),
    targets: new Set(goodCaptures(fen, me).map((m) => m.to)),
  }
}

function pickPositions(n) {
  const pool = [...SCAN, ...localPuzzles.map((p) => ({ fen: p.fen, lastMove: p.lastMove }))].filter((p) => { try { return !new Chess(p.fen).isGameOver() } catch { return false } })
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n)
}

export default function Scan() {
  const stats = useStore((s) => s.scans)
  const rv = useStore((s) => s.reviews['scan:daily'])
  const [run, setRun] = useState(null)
  if (run) return <ScanSession key={run} onExit={() => setRun(null)} />
  return (
    <div>
      <PageHeader title="🔍 Quét nguy hiểm (Chiếu · Ăn quân · Đe doạ)" subtitle="Luyện thói quen nhìn bàn cờ TRƯỚC khi đi – cách chữa lỗi bỏ quên quân bị đe doạ và để quân bị ăn miễn phí." />
      <div className="card space-y-3">
        <p className="text-sm text-slate-600">Mỗi lượt {SESSION} thế cờ. Với mỗi thế, bạn trả lời 3 câu bằng cách <b>bấm vào ô trên bàn cờ</b>:</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">{STEPS.map((s) => <li key={s.key}><b>{s.title.slice(2)}</b> – {s.hint}</li>)}</ol>
        <p className="text-sm text-slate-600">Kỳ thủ mạnh làm việc này trong vài giây trước MỖI nước. Luyện 5–10 phút mỗi ngày, sau vài tuần bạn sẽ thấy mình tự động “nhìn” ra nguy hiểm.</p>
        <div className="text-xs text-slate-500">Đã quét {stats.n} thế · đúng hoàn toàn {stats.ok} · {rv ? `ôn lại ${rv.due.slice(8, 10)}/${rv.due.slice(5, 7)}` : 'chưa có lịch ôn'}</div>
        <button className="btn-primary text-base px-6 py-3" onClick={() => setRun(Date.now())}>▶ Bắt đầu quét {SESSION} thế</button>
      </div>
    </div>
  )
}

function ScanSession({ onExit }) {
  const [list] = useState(() => pickPositions(SESSION))
  const [i, setI] = useState(0)
  const [scores, setScores] = useState([])
  if (i >= list.length) {
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)
    return (
      <div>
        <PageHeader title="🎉 Xong lượt quét!" subtitle={`Độ chính xác trung bình ${Math.round(avg * 100)}%`} />
        <div className="card space-y-3">
          <p className="text-sm text-slate-600">{avg >= 0.85 ? 'Rất tốt! Mắt bạn đã quen tìm nguy hiểm. Lần ôn sau sẽ giãn ra.' : 'Còn bỏ sót khá nhiều – phần này sẽ quay lại ngày mai. Nhớ quét đủ 3 bước trước mỗi nước khi đánh thật.'}</p>
          <div className="flex gap-2"><button className="btn-primary" onClick={onExit}>Xong</button><a className="btn-ghost" href="#/play">🤖 Áp dụng khi đánh với máy</a></div>
        </div>
      </div>
    )
  }
  return (
    <div>
      <PageHeader title="🔍 Quét nguy hiểm" right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500"><span>Thế {i + 1}/{list.length}</span><div className="flex-1"><Progress value={i} max={list.length} /></div></div>
      <ScanCard
        key={i}
        pos={list[i]}
        onDone={(sc) => {
          const all = [...scores, sc]
          setScores(all)
          update((s) => { s.scans.n++; if (sc === 1) s.scans.ok++ })
          if (i + 1 >= list.length) {
            const avg = all.reduce((a, b) => a + b, 0) / all.length
            scheduleReview('scan', 'daily', avg * 5, 'Quét nguy hiểm (Chiếu · Ăn quân · Đe doạ)')
            logHistory('chess', `Quét nguy hiểm: ${Math.round(avg * 100)}%`)
          }
          setI(i + 1)
        }}
      />
    </div>
  )
}

function ScanCard({ pos, onDone }) {
  const ans = useMemo(() => answers(pos.fen), [pos])
  const me = new Chess(pos.fen).turn()
  const inCheck = new Chess(pos.fen).inCheck()
  const [step, setStep] = useState(0)
  const [marks, setMarks] = useState(new Set())
  const [checked, setChecked] = useState(null) // { ok:Set, miss:Set, extra:Set }
  const [stepScores, setStepScores] = useState([])
  const S = STEPS[step]
  const toggle = (sq) => { if (checked) return; const n = new Set(marks); n.has(sq) ? n.delete(sq) : n.add(sq); setMarks(n) }
  const check = () => {
    const want = ans[S.key]
    const ok = new Set([...marks].filter((x) => want.has(x)))
    const miss = new Set([...want].filter((x) => !marks.has(x)))
    const extra = new Set([...marks].filter((x) => !want.has(x)))
    const denom = want.size + extra.size
    setStepScores((x) => [...x, denom ? ok.size / denom : 1])
    setChecked({ ok, miss, extra })
  }
  const next = () => {
    if (step + 1 < STEPS.length) { setStep(step + 1); setMarks(new Set()); setChecked(null) }
    else onDone(stepScores.reduce((a, b) => a + b, 0) / stepScores.length)
  }
  useHotkeys({ Enter: () => (checked ? next() : check()) })

  const shapes = checked ? [
    ...[...checked.ok].map((sq) => ({ orig: sq, brush: 'green' })),
    ...[...checked.miss].map((sq) => ({ orig: sq, brush: 'red' })),
    ...[...checked.extra].map((sq) => ({ orig: sq, brush: 'yellow' })),
    ...(S.key === 'checks' ? checkingMoves(pos.fen, opp(me)).filter((m) => checked.miss.has(m.to) || checked.ok.has(m.to)).map((m) => ({ orig: m.from, dest: m.to, brush: 'red' })) : []),
  ] : []
  const explain = () => {
    const c = new Chess(pos.fen)
    if (S.key === 'mine') return hangingPieces(pos.fen, me).map((h) => `${NAME_VI[h.type]} ${h.sq} bị ${h.attackers.map((a) => NAME_VI[c.get(a).type] + ' ' + a).join(', ')} tấn công${h.defenders.length ? ' (quân tấn công rẻ hơn)' : ', không có quân bảo vệ'}`)
    if (S.key === 'checks') return checkingMoves(pos.fen, opp(me)).map((m) => `${NAME_VI[m.piece]} ${m.from} → ${m.to} (${m.san})`)
    return goodCaptures(pos.fen, me).map((m) => `${NAME_VI[m.piece]} ${m.from} ăn ${NAME_VI[m.captured]} ${m.to} (${m.san})`)
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className="flex justify-center">
        <Board fen={pos.fen} orientation={me === 'w' ? 'white' : 'black'} lastMove={pos.lastMove} check={inCheck} onSelect={toggle} marks={checked ? null : marks} shapes={shapes} />
      </div>
      <div className="space-y-3">
        <div className="card space-y-2">
          <div className="text-sm text-slate-500">Bạn cầm {colorVi(me)} (tới lượt bạn){inCheck && <b className="ml-1 text-rose-600">· BẠN ĐANG BỊ CHIẾU!</b>}</div>
          <div className="text-lg font-semibold">{S.title}</div>
          <div className="text-sm text-slate-600">{S.hint}</div>
          <div className="text-xs text-slate-500">Đã đánh dấu: {marks.size ? [...marks].join(', ') : 'chưa có'}</div>
          {!checked ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn-primary" onClick={check}>{marks.size ? 'Kiểm tra' : 'Không có gì – Kiểm tra'} <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button>
              {marks.size > 0 && <button className="btn-ghost" onClick={() => setMarks(new Set())}>Xoá đánh dấu</button>}
            </div>
          ) : (
            <div className="space-y-2">
              <div className={checked.miss.size || checked.extra.size ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>
                {checked.miss.size || checked.extra.size ? `Đúng ${checked.ok.size} · sót ${checked.miss.size} (đỏ) · thừa ${checked.extra.size} (vàng)` : '✅ Chính xác hoàn toàn!'}
              </div>
              <ul className="list-disc pl-5 text-sm text-slate-700">{explain().map((t) => <li key={t}>{t}</li>)}{explain().length === 0 && <li>Không có – đúng là an toàn ở mục này.</li>}</ul>
              <button className="btn-primary" onClick={next}>{step + 1 < STEPS.length ? 'Câu tiếp' : 'Thế tiếp'} <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button>
            </div>
          )}
        </div>
        <div className="card text-xs text-slate-500">Mẹo: quét theo thứ tự quân giá trị cao trước (Hậu, Xe), rồi tới quân nhẹ. Xem cả các đường chéo dài của Tượng/Hậu – nơi người mới hay bỏ sót.</div>
      </div>
    </div>
  )
}

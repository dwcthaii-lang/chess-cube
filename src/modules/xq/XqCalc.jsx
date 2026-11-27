// CỜ TƯỚNG · LUYỆN TÍNH NƯỚC – bàn cờ ĐỨNG YÊN, người học tính cả chuỗi (nước mình → đối phương đáp → nước mình…)
// trong đầu rồi bấm từng nước trên bàn cờ đứng yên. Xong mới kiểm tra & chạy lại cho xem.
import { useMemo, useState } from 'react'
import { Position, colorVi, moveVi, parseUci } from '../../lib/xiangqi'
import { xqLocal, xqDueList, XQ_THEMES } from '../../lib/xqPuzzles'
import { scheduleReview, reviewOf } from '../../lib/review'
import { logHistory, useStore } from '../../lib/store'
import { XqBoard } from '../../components/XqBoard'
import { PageHeader, Progress } from '../../components/ui'
import { useHotkeys } from '../../lib/hotkeys'

const pool = () => xqLocal.filter((p) => p.moves.length >= 3)

export default function XqCalc({ mode }) {
  useStore((s) => s.reviews)
  const [session, setSession] = useState(() => (mode === 'review' ? xqDueList('xqcalc') : null))
  const due = xqDueList('xqcalc')
  const fresh = pool().filter((p) => !reviewOf('xqcalc', p.id))
  if (session) return <Session list={session} onExit={() => { setSession(null); if (mode) location.hash = '#/xq-calc' }} />
  return (
    <div>
      <PageHeader title="🧠 Cờ tướng · Luyện tính nước" subtitle="Không được đi thử quân. Nhìn thế cờ, tính trong đầu cả chuỗi 2–3 nước (kể cả nước đáp của đối phương), rồi mới nhập." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <button disabled={!due.length} onClick={() => setSession(due)} className={`card !p-4 text-left ${due.length ? 'border-rose-300 bg-rose-50' : ''}`}>
          <div className="text-sm text-slate-500">Cần ôn hôm nay</div>
          <div className={`text-3xl font-bold ${due.length ? 'text-rose-600' : 'text-emerald-600'}`}>{due.length} bài</div>
        </button>
        <div className="card !p-4"><div className="text-sm text-slate-500">Bài mới còn trong kho</div><div className="text-3xl font-bold">{fresh.length}</div></div>
      </div>
      <div className="card space-y-3 text-sm text-slate-600">
        <div className="font-semibold text-slate-800">Cách làm</div>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Bàn cờ <b>không di chuyển</b> trong lúc bạn nhập. Bấm điểm quân đi rồi điểm đến – kể cả khi quân đó (trong đầu bạn) đã chuyển chỗ.</li>
          <li>Nhập luôn <b>nước đáp tốt nhất của đối phương</b> mà bạn dự đoán, rồi nước tiếp theo của bạn.</li>
          <li>Bấm Kiểm tra – máy chạy lại cả chuỗi để bạn so với hình dung của mình.</li>
        </ol>
        <p>Quy trình tính nước: <b>liệt kê nước ứng viên (chiếu, ăn quân, doạ) → với mỗi nước, đoán nước đáp mạnh nhất của đối phương → đánh giá thế cờ cuối</b>. Trong cờ tướng, nhớ rằng quân vừa đi có thể trở thành <b>ngòi cho Pháo</b> hoặc <b>mở chân Mã</b>.</p>
        <button className="btn-primary text-base px-6 py-3" disabled={!fresh.length} onClick={() => setSession(fresh.sort(() => Math.random() - 0.5).slice(0, 5))}>▶ Làm 5 bài mới</button>
      </div>
    </div>
  )
}

function Session({ list, onExit }) {
  const [i, setI] = useState(0)
  const [done, setDone] = useState(null)
  const p = list[i]
  if (!p) return (
    <div>
      <PageHeader title="🎉 Xong lượt tính nước" />
      <div className="card space-y-2"><p className="text-sm text-slate-600">Bài tính sai sẽ quay lại ngày mai.</p><div className="flex gap-2"><button className="btn-primary" onClick={onExit}>Xong</button><a className="btn-ghost" href="#/review">📅 Ôn tập hôm nay</a></div></div>
    </div>
  )
  return (
    <div>
      <PageHeader title="🧠 Cờ tướng · Tính nước" right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500"><span>Bài {i + 1}/{list.length}</span><div className="flex-1"><Progress value={i} max={list.length} /></div></div>
      <CalcCard key={p.id} p={p} onDone={(r) => { scheduleReview('xqcalc', p.id, r.grade, `Cờ tướng – tính nước · ${XQ_THEMES[p.theme] || ''}`); logHistory('chess', `Cờ tướng – tính nước ${p.id}: ${r.correct}/${p.moves.length} nước đúng`); setDone(r) }} />
      {done && <div className="mt-3 flex justify-center"><button className="btn-primary" onClick={() => { setDone(null); setI(i + 1) }}>Bài tiếp</button></div>}
    </div>
  )
}

function CalcCard({ p, onDone }) {
  const me = useMemo(() => new Position(p.fen).turnColor(), [p])
  const [line, setLine] = useState([]) // [{uci, vi}]
  const [from, setFrom] = useState(null)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)
  const [shownFen, setShownFen] = useState(p.fen)
  const [shownLast, setShownLast] = useState(p.lastMove)
  const need = p.moves.length

  const hidden = useMemo(() => { const c = new Position(p.fen); line.forEach((m) => c.moveByUci(m.uci)); return c }, [p, line])

  const select = (sq) => {
    if (result) return
    setErr('')
    if (line.length >= need) { setErr('Đã đủ số nước – bấm Kiểm tra, hoặc xoá nước cuối.'); return }
    if (!from) { const pc = hidden.get(sq); if (!pc || pc.color !== hidden.turnColor()) { setErr(`Điểm ${sq}: (trong đầu bạn) không có quân ${colorVi(hidden.turnColor())} ở đây.`); return } setFrom(sq); return }
    if (sq === from) { setFrom(null); return }
    const c = hidden.clone()
    const m = c.moveByUci(from + sq)
    if (!m) { setErr(`Nước ${from}→${sq} không hợp lệ ở thế cờ trong đầu bạn.`); setFrom(null); return }
    setLine([...line, { uci: from + sq, vi: m.vi }])
    setFrom(null)
  }

  const check = () => {
    let correct = 0
    for (let k = 0; k < need; k++) { if (line[k]?.uci === p.moves[k]) correct++; else break }
    // chiếu hết bằng chuỗi khác cũng tính đúng
    if (correct < need && hidden.isMate() && line.length % 2 === 1) correct = need
    const ok = correct === need
    setResult({ ok, correct })
    onDone({ correct, grade: ok ? 5 : correct >= 1 ? 2 : 1 })
    const c = new Position(p.fen)
    p.moves.forEach((u, k) => setTimeout(() => { c.moveByUci(u); setShownFen(c.fen()); setShownLast([u.slice(0, 2), u.slice(2, 4)]) }, 700 * (k + 1)))
  }
  useHotkeys({ Enter: () => !result && line.length >= need && check(), Backspace: () => !result && setLine(line.slice(0, -1)) })

  const solVi = useMemo(() => { const c = new Position(p.fen); return p.moves.map((u) => { const s = moveVi(c, parseUci(u)); c.moveByUci(u); return s }) }, [p])
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div className="flex justify-center">
        <XqBoard fen={result ? shownFen : p.fen} orientation={me === 'w' ? 'white' : 'black'} lastMove={result ? shownLast : p.lastMove} onSelect={select} marks={from ? new Set([from]) : null}
          shapes={result ? [] : line.map((m, k) => ({ orig: m.uci.slice(0, 2), dest: m.uci.slice(2, 4), brush: k % 2 === 0 ? 'green' : 'red' }))} />
      </div>
      <div className="space-y-3">
        <div className="card space-y-2">
          <div className="text-lg font-semibold">Bạn cầm {colorVi(me)} · tính chuỗi {need} nước ({Math.ceil(need / 2)} nước của bạn)</div>
          <div className="text-sm text-slate-600">Bấm điểm <b>đi</b> rồi điểm <b>đến</b>. Mũi tên xanh = nước của bạn, đỏ = nước đáp bạn đoán cho đối phương.</div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: need }, (_, k) => (
              <span key={k} className={`chip ${line[k] ? (k % 2 === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-400'} !text-sm`}>
                {k % 2 === 0 ? 'Bạn' : 'Đối phương'}: {line[k]?.vi || '…'}
              </span>
            ))}
          </div>
          {from && <div className="text-xs text-indigo-600">Đã chọn quân ở {from} – bấm điểm đến.</div>}
          {err && <div className="text-sm text-rose-600">{err}</div>}
          {!result ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn-primary" disabled={line.length < need} onClick={check}>Kiểm tra <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button>
              {line.length > 0 && <button className="btn-ghost" onClick={() => setLine(line.slice(0, -1))}>↶ Xoá nước cuối</button>}
            </div>
          ) : (
            <div className="space-y-1">
              <div className={result.ok ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{result.ok ? '✅ Tính chính xác cả chuỗi!' : `❌ Đúng ${result.correct}/${need} nước đầu`}</div>
              <div className="text-sm">Lời giải: <b>{solVi.join(' · ')}</b> (đang chạy lại trên bàn cờ)</div>
              {!result.ok && <div className="text-sm text-slate-600">Hãy so: bạn có bỏ sót nước đáp nào của đối phương không? Nước chiếu hay ăn quân nào bạn chưa xét?</div>}
            </div>
          )}
        </div>
        <div className="card text-xs text-slate-500">Ký hiệu: <b>P2-5</b> = Pháo cột 2 bình (đi ngang) sang cột 5 · <b>M8.7</b> = Mã cột 8 tiến tới cột 7 · <b>X1/2</b> = Xe cột 1 thoái (lùi) 2 bước. Cột đếm 1–9 từ phải sang trái của người cầm quân.</div>
      </div>
    </div>
  )
}

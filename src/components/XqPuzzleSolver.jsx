// Giải một thế cờ tướng: người học đi nước của mình, máy tự đi nước đáp của đối phương.
// Bài chiếu hết: chấp nhận MỌI nước chiếu vẫn dẫn tới chiếu hết đúng số nước (kiểm tra vét cạn).
import { useMemo, useRef, useState } from 'react'
import { Position, mateMoves, bestDefence, destsOf, colorVi, NAME_VI, moveVi, parseUci, sqName } from '../lib/xiangqi'
import { XQ_THEMES, isMateTheme } from '../lib/xqPuzzles'
import { XqBoard } from './XqBoard'
import { useHotkeys } from '../lib/hotkeys'

export const kingInCheck = (pos) => (pos.inCheck() ? sqName(pos.king[pos.turn]) : null)

export function XqPuzzleSolver({ puzzle, onDone, showTheme = true }) {
  const pos = useMemo(() => new Position(puzzle.fen), [puzzle])
  const me = useMemo(() => new Position(puzzle.fen).turnColor(), [puzzle])
  const mate = isMateTheme(puzzle.theme)
  const sol = puzzle.moves
  const [fen, setFen] = useState(puzzle.fen)
  const [ply, setPly] = useState(0)
  const [onTrack, setOnTrack] = useState(true)
  const [last, setLast] = useState(puzzle.lastMove || null)
  const [status, setStatus] = useState('play') // play | wrong | solved | failed
  const [mistakes, setMistakes] = useState(0)
  const [hint, setHint] = useState(0)
  const [shapes, setShapes] = useState([])
  const [busy, setBusy] = useState(false)
  const [played, setPlayed] = useState([]) // ký hiệu các nước đã đi
  const t0 = useRef(Date.now())

  const left = () => Math.ceil((sol.length - ply) / 2) // số nước của mình còn lại
  const play = (u) => { const info = pos.moveByUci(u); if (info) { setFen(pos.fen()); setLast([info.from, info.to]); setPlayed((x) => [...x, info.vi]) } return info }
  const expected = () => (mate && !onTrack ? mateMoves(pos, left())[0] : sol[ply])

  const finish = (ok, extraHint = hint) => {
    setStatus(ok ? 'solved' : 'failed')
    const sec = (Date.now() - t0.current) / 1000
    const grade = ok ? (mistakes === 0 && extraHint === 0 ? (sec < 45 ? 5 : 4) : mistakes + (extraHint ? 1 : 0) <= 1 ? 3 : 2) : 1
    onDone?.({ ok: ok && mistakes === 0 && extraHint === 0, grade, mistakes, hint: extraHint, sec })
  }

  const onMove = (from, to) => {
    if (busy || (status !== 'play' && status !== 'wrong')) return
    const u = from + to
    const good = mate ? mateMoves(pos, left()).includes(u) : u === sol[ply]
    if (!good) {
      setMistakes((x) => x + 1); setStatus('wrong'); setFen(pos.fen()); setShapes([{ orig: to, brush: 'red' }])
      return
    }
    const still = onTrack && u === sol[ply]
    play(u); setShapes([]); setHint(0)
    if (pos.isMate() || (!mate && ply + 1 >= sol.length)) { setPly(ply + 1); finish(true); return }
    setStatus('play'); setBusy(true)
    const reply = mate ? (still && sol[ply + 1] ? sol[ply + 1] : bestDefence(pos, left() - 1)) : sol[ply + 1]
    setTimeout(() => { play(reply); setOnTrack(still && reply === sol[ply + 1]); setPly(ply + 2); setBusy(false) }, 400)
  }

  const giveUp = () => {
    const line = []
    const p = pos.clone()
    if (mate && !onTrack) {
      for (let k = left(); k >= 1; k--) { const m = mateMoves(p, k)[0]; if (!m) break; line.push(m); p.moveByUci(m); if (k > 1) { const r = bestDefence(p, k - 1); if (!r) break; line.push(r); p.moveByUci(r) } }
    } else line.push(...sol.slice(ply))
    let k = 0
    const step = () => { if (k < line.length) { play(line[k]); k++; setTimeout(step, 650) } }
    step()
    finish(false)
  }

  const showHint = () => {
    const u = expected()
    if (!u) return
    if (hint === 0) { setHint(1); setShapes([{ orig: u.slice(0, 2), brush: 'yellow' }]) }
    else { setHint(2); setShapes([{ orig: u.slice(0, 2), dest: u.slice(2, 4), brush: 'yellow' }]) }
  }
  useHotkeys({ h: showHint })

  const active = (status === 'play' || status === 'wrong') && !busy
  const exp = active ? expected() : null
  const hintPiece = exp ? NAME_VI[pos.get(exp.slice(0, 2))?.type] : ''
  const solVi = useMemo(() => { const p = new Position(puzzle.fen); return sol.map((u) => { const s = moveVi(p, parseUci(u)); p.moveByUci(u); return s }) }, [puzzle])
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div className="flex justify-center">
        <XqBoard fen={fen} orientation={me === 'w' ? 'white' : 'black'} dests={active ? destsOf(pos) : null} onMove={onMove} lastMove={last} check={kingInCheck(pos)} shapes={shapes} />
      </div>
      <div className="space-y-3">
        <div className="card space-y-2">
          <div className="text-lg font-semibold">{status === 'solved' ? '✅ Chính xác!' : status === 'failed' ? '📖 Lời giải' : `Bạn cầm quân ${colorVi(me)} – ${mate ? `chiếu hết trong ${Math.ceil(sol.length / 2)} nước` : 'tìm nước tốt nhất'}`}</div>
          {mate && active && <div className="text-xs text-slate-500">Mỗi nước của bạn phải là nước <b>chiếu</b>; đối phương sẽ đỡ cách khó nhất.</div>}
          {showTheme && (status === 'solved' || status === 'failed') && <div className="flex flex-wrap gap-1"><span className="chip bg-indigo-100 text-indigo-700">{XQ_THEMES[puzzle.theme] || puzzle.theme}</span>{puzzle.rating && <span className="chip bg-slate-100 text-slate-600">~{puzzle.rating}</span>}</div>}
          {status === 'wrong' && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">❌ Chưa đúng. Trước khi đi lại, tự hỏi: <b>có nước chiếu nào? ăn quân nào? đối phương đang doạ gì?</b></div>}
          {status === 'play' && ply > 0 && !busy && <div className="text-sm text-emerald-700">👍 Đúng! Đối phương đã đáp lại – tiếp tục.</div>}
          {hint > 0 && active && <div className="text-sm text-amber-700">💡 Gợi ý: hãy dùng {hintPiece || 'quân được tô vàng'}.</div>}
          {played.length > 0 && <div className="text-sm text-slate-600">Đã đi: <b>{played.join(' · ')}</b></div>}
          {status === 'failed' && <div className="text-sm">Lời giải: <b>{solVi.join(' · ')}</b></div>}
          <div className="text-xs text-slate-500">Nước của bạn: {Math.min(Math.floor(ply / 2) + 1, Math.ceil(sol.length / 2))}/{Math.ceil(sol.length / 2)} · Sai {mistakes} lần</div>
          <div className="flex flex-wrap gap-2 pt-1">
            {active && <>
              <button className="btn-ghost" onClick={showHint}>💡 Gợi ý <span className="kbd">H</span></button>
              <button className="btn-ghost" onClick={giveUp}>🏳️ Xem lời giải</button>
            </>}
          </div>
        </div>
        <XqHabitCard />
      </div>
    </div>
  )
}

export function XqHabitCard() {
  return (
    <div className="card text-sm text-slate-600">
      <div className="label mb-1">Thói quen trước mỗi nước</div>
      Quét theo thứ tự <b>Chiếu → Ăn quân → Đe doạ</b>: xem MỌI nước chiếu (nhớ cả Pháo chiếu qua ngòi, Mã chiếu, hai Tướng đối mặt), MỌI nước ăn quân của cả hai bên, rồi mới chọn nước đi.
    </div>
  )
}

// Giải một thế cờ: người học đi nước của mình, máy tự đi nước đáp của đối phương.
// Sai → báo ngay và cho thử lại (bài tính là "chưa thuộc"). Có gợi ý: tô quân cần đi / mũi tên lời giải.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { destsOf, moveUci, colorVi, NAME_VI } from '../lib/chessx'
import { THEMES } from '../lib/puzzles'
import { useHotkeys } from '../lib/hotkeys'

export function PuzzleSolver({ puzzle, onDone, showTheme = true }) {
  const [chess] = useState(() => new Chess(puzzle.fen))
  const me = useMemo(() => new Chess(puzzle.fen).turn(), [puzzle])
  const [fen, setFen] = useState(puzzle.fen)
  const [ply, setPly] = useState(0) // vị trí trong lời giải
  const [last, setLast] = useState(puzzle.lastMove || null)
  const [status, setStatus] = useState('play') // play | wrong | solved | failed
  const [mistakes, setMistakes] = useState(0)
  const [hint, setHint] = useState(0) // 0 không, 1 tô quân, 2 mũi tên
  const [shapes, setShapes] = useState([])
  const t0 = useRef(Date.now())

  const sol = puzzle.moves
  const play = (u) => { const m = moveUci(chess, u); if (m) { setFen(chess.fen()); setLast([m.from, m.to]) } return m }

  const onMove = (from, to) => {
    if (status !== 'play' && status !== 'wrong') return
    const expect = sol[ply]
    let u = from + to
    const piece = chess.get(from)
    if (piece?.type === 'p' && (to[1] === '8' || to[1] === '1')) u += expect && expect.slice(0, 4) === u ? expect[4] || 'q' : 'q'
    // chiếu hết bằng nước khác cũng được tính đúng
    const test = new Chess(chess.fen())
    const tm = moveUci(test, u)
    const altMate = tm && test.isCheckmate()
    if (u === expect || altMate) {
      play(u)
      setShapes([]); setHint(0)
      if (altMate || ply + 1 >= sol.length) { finish(true); return }
      setStatus('play')
      setTimeout(() => { play(sol[ply + 1]); setPly(ply + 2) }, 350)
    } else {
      setMistakes((x) => x + 1)
      setStatus('wrong')
      setFen(chess.fen()) // trả quân về chỗ cũ
      setShapes([{ orig: to, brush: 'red' }])
    }
  }

  const finish = (ok) => {
    setStatus(ok ? 'solved' : 'failed')
    const sec = (Date.now() - t0.current) / 1000
    let grade = ok ? (mistakes === 0 && hint === 0 ? (sec < 45 ? 5 : 4) : mistakes + (hint ? 1 : 0) <= 1 ? 3 : 2) : 1
    onDone?.({ ok: ok && mistakes === 0 && hint === 0, grade, mistakes, hint, sec })
  }

  const giveUp = () => {
    // chạy hết lời giải
    let k = ply
    const step = () => { if (k < sol.length) { play(sol[k]); k++; setTimeout(step, 600) } }
    step()
    finish(false)
  }

  const showHint = () => {
    const u = sol[ply]
    if (!u) return
    if (hint === 0) { setHint(1); setShapes([{ orig: u.slice(0, 2), brush: 'yellow' }]) }
    else { setHint(2); setShapes([{ orig: u.slice(0, 2), dest: u.slice(2, 4), brush: 'yellow' }]) }
  }
  useHotkeys({ h: showHint })

  const dests = status === 'play' || status === 'wrong' ? destsOf(chess) : null
  const myTurnPiece = sol[ply] ? NAME_VI[new Chess(fen).get(sol[ply].slice(0, 2))?.type] : ''
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className="flex justify-center">
        <Board fen={fen} orientation={me === 'w' ? 'white' : 'black'} turnColor={chess.turn() === 'w' ? 'white' : 'black'} dests={dests} onMove={onMove} lastMove={last} check={chess.inCheck()} shapes={shapes} />
      </div>
      <div className="space-y-3">
        <div className="card space-y-2">
          <div className="text-lg font-semibold">{status === 'solved' ? '✅ Chính xác!' : status === 'failed' ? '📖 Lời giải' : `Bạn cầm quân ${colorVi(me)} – tìm nước tốt nhất`}</div>
          {showTheme && (status === 'solved' || status === 'failed') && <div className="flex flex-wrap gap-1"><span className="chip bg-indigo-100 text-indigo-700">{THEMES[puzzle.theme] || puzzle.theme}</span><span className="chip bg-slate-100 text-slate-600">~{puzzle.rating}</span>{puzzle.url && <a className="chip bg-slate-100 text-slate-600 underline" href={puzzle.url} target="_blank" rel="noreferrer">Lichess ↗</a>}</div>}
          {status === 'wrong' && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">❌ Chưa đúng. Trước khi đi lại, tự hỏi: <b>có nước chiếu nào? ăn quân nào? đối phương đang đe doạ gì?</b></div>}
          {status === 'play' && ply > 0 && <div className="text-sm text-emerald-700">👍 Đúng! Đối phương đã đáp lại – tiếp tục.</div>}
          {hint > 0 && status !== 'solved' && <div className="text-sm text-amber-700">💡 Gợi ý: hãy dùng {myTurnPiece || 'quân được tô vàng'}.</div>}
          <div className="text-xs text-slate-500">Nước của bạn: {Math.floor(ply / 2) + (status === 'solved' ? 0 : 1)}/{Math.ceil(sol.length / 2)} · Sai {mistakes} lần</div>
          <div className="flex flex-wrap gap-2 pt-1">
            {(status === 'play' || status === 'wrong') && <>
              <button className="btn-ghost" onClick={showHint}>💡 Gợi ý <span className="kbd">H</span></button>
              <button className="btn-ghost" onClick={giveUp}>🏳️ Xem lời giải</button>
            </>}
          </div>
        </div>
        <div className="card text-sm text-slate-600">
          <div className="label mb-1">Thói quen trước mỗi nước</div>
          Quét theo thứ tự <b>Chiếu → Ăn quân → Đe doạ</b> (CCT): xem MỌI nước chiếu, MỌI nước ăn quân của cả hai bên, rồi mới chọn nước đi.
        </div>
      </div>
    </div>
  )
}

// ĐÁNH VỚI MÁY (Stockfish) + "kiểm tra trước khi đi": nếu nước định đi làm mất quân / bị chiếu hết, máy hỏi lại.
// Sau ván: phân tích từng nước, chỉ ra nước hớ, và biến chúng thành bài ôn (lặp lại ngắt quãng).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Board } from '../components/Board'
import { analyse, bestMove, scoreOf, LEVELS } from '../lib/engine'
import { destsOf, moveUci, dangerAfter, colorVi } from '../lib/chessx'
import { useStore, update, logHistory, getState } from '../lib/store'
import { scheduleReview } from '../lib/review'
import { PageHeader } from '../components/ui'

export default function Play() {
  const settings = useStore((s) => s.settings)
  const games = useStore((s) => s.games)
  const [game, setGame] = useState(null)
  if (game) return <Game {...game} onExit={() => setGame(null)} />
  const set = (p) => update((s) => Object.assign(s.settings, p))
  return (
    <div>
      <PageHeader title="🤖 Đánh với máy" subtitle="Đánh với Stockfish theo mức độ. Bật “kiểm tra trước khi đi” để máy nhắc khi bạn sắp đi nước hớ – sau ván, nước hớ thành bài ôn." />
      <div className="card space-y-4">
        <div>
          <div className="label mb-2">Độ mạnh của máy: {LEVELS[settings.engineLevel].label}</div>
          <input type="range" min="1" max="8" value={settings.engineLevel} onChange={(e) => set({ engineLevel: Number(e.target.value) })} className="w-full sm:w-1/2" />
          <div className="text-xs text-slate-500">Mẹo: chọn mức mà bạn thắng khoảng 1/3 số ván. Thắng 3 ván liền → tăng 1 mức.</div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={settings.blunderCheck} onChange={(e) => set({ blunderCheck: e.target.checked })} />
          <span><b>Kiểm tra trước khi đi</b> – nếu nước của bạn để quân bị treo hoặc cho đối phương chiếu hết, máy hỏi “Chắc chưa?”. Tắt đi khi bạn đã quen tự quét.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => setGame({ color: 'w', key: Date.now() })}>♔ Cầm Trắng</button>
          <button className="btn-primary" onClick={() => setGame({ color: 'b', key: Date.now() })}>♚ Cầm Đen</button>
          <button className="btn-ghost" onClick={() => setGame({ color: Math.random() < 0.5 ? 'w' : 'b', key: Date.now() })}>🎲 Ngẫu nhiên</button>
        </div>
      </div>
      {games.length > 0 && (
        <div className="card mt-4">
          <div className="label mb-2">Ván gần đây</div>
          {games.slice(0, 10).map((g, i) => (
            <div key={i} className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0">
              <span>{new Date(g.at).toLocaleString('vi-VN')} · {colorVi(g.color)} · mức {g.level}</span>
              <span>{g.result} {g.blunders != null && <span className="text-slate-500">· {g.blunders} nước hớ</span>}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Game({ color, onExit }) {
  const settings = useStore((s) => s.settings)
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState(chess.fen())
  const [last, setLast] = useState(null)
  const [thinking, setThinking] = useState(false)
  const [warn, setWarn] = useState(null) // { uci, notes }
  const [checking, setChecking] = useState(false)
  const [takebacks, setTakebacks] = useState(0)
  const [over, setOver] = useState(null)
  const [review, setReview] = useState(null)
  const level = settings.engineLevel
  const orient = color === 'w' ? 'white' : 'black'

  const sync = () => { setFen(chess.fen()); const h = chess.history({ verbose: true }); const m = h[h.length - 1]; setLast(m ? [m.from, m.to] : null); if (chess.isGameOver()) endGame() }
  const endGame = (resign) => {
    let result
    if (resign) result = 'Bạn xin thua'
    else if (chess.isCheckmate()) result = chess.turn() === color ? 'Thua (bị chiếu hết)' : 'Thắng (chiếu hết) 🎉'
    else result = 'Hoà'
    setOver(result)
    update((s) => { s.games.unshift({ at: Date.now(), color, level, result, pgn: chess.pgn(), takebacks }); s.games = s.games.slice(0, 100) })
    logHistory('chess', `Ván với máy mức ${level}: ${result}`)
  }

  // máy đi
  useEffect(() => {
    if (over || chess.turn() === color || chess.isGameOver()) return
    let alive = true
    setThinking(true)
    bestMove(chess.fen(), level).then((u) => {
      if (!alive) return
      setTimeout(() => { if (!alive) return; moveUci(chess, u); setThinking(false); sync() }, 250)
    })
    return () => { alive = false }
  }, [fen, over])

  const commit = (u) => { moveUci(chess, u); setWarn(null); sync() }

  const onMove = async (from, to) => {
    const pc = chess.get(from)
    const u = from + to + (pc?.type === 'p' && (to[1] === '8' || to[1] === '1') ? 'q' : '')
    if (!settings.blunderCheck) return commit(u)
    // kiểm tra nhanh bằng luật + máy (độ sâu thấp)
    setChecking(true)
    const notes = dangerAfter(chess.fen(), u)
    let drop = 0
    try {
      const [before] = await analyse(chess.fen(), { depth: 9 })
      const c = new Chess(chess.fen()); moveUci(c, u)
      const after = c.isGameOver() ? null : (await analyse(c.fen(), { depth: 9 }))[0]
      drop = scoreOf(before) - (after ? -scoreOf(after) : c.isCheckmate() ? 10000 : 0)
    } catch {}
    setChecking(false)
    if (drop >= 200 || notes.length) { setFen(chess.fen()); setWarn({ uci: u, notes, drop }); return }
    commit(u)
  }

  const undo = () => {
    if (chess.history().length < 2 || thinking) return
    chess.undo(); if (chess.turn() !== color) chess.undo()
    setTakebacks((x) => x + 1); setOver(null); sync()
  }

  const dests = !over && !thinking && !warn && !checking && chess.turn() === color ? destsOf(chess) : null
  return (
    <div>
      <PageHeader title={`🤖 Đánh với máy · ${LEVELS[level].label}`} right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
        <div className="flex justify-center">
          <Board fen={fen} orientation={orient} turnColor={chess.turn() === 'w' ? 'white' : 'black'} dests={dests} onMove={onMove} lastMove={last} check={chess.inCheck()} />
        </div>
        <div className="space-y-3">
          <div className="card space-y-2">
            <div className="text-lg font-semibold">{over || (thinking ? '🤖 Máy đang nghĩ…' : checking ? '🔎 Đang kiểm tra nước của bạn…' : chess.inCheck() && chess.turn() === color ? '⚠️ BẠN ĐANG BỊ CHIẾU!' : `Tới lượt bạn (${colorVi(color)})`)}</div>
            {warn && (
              <div className="space-y-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
                <div className="font-semibold text-amber-800">🤔 Chắc chưa? Nước này có vẻ nguy hiểm:</div>
                <ul className="list-disc pl-5 text-sm text-amber-900">
                  {warn.notes.map((n) => <li key={n}>{n}</li>)}
                  {!warn.notes.length && <li>Máy thấy nước này làm bạn mất khoảng {(warn.drop / 100).toFixed(1)} điểm (≈ {warn.drop >= 800 ? 'một quân lớn' : warn.drop >= 280 ? 'một quân nhẹ' : 'một Tốt trở lên'}).</li>}
                </ul>
                <div className="text-xs text-amber-800">Hãy quét lại: đối phương có nước chiếu nào? ăn quân nào? đe doạ gì?</div>
                <div className="flex gap-2"><button className="btn-primary" onClick={() => setWarn(null)}>↶ Nghĩ lại</button><button className="btn-ghost" onClick={() => commit(warn.uci)}>Vẫn đi</button></div>
              </div>
            )}
            <div className="text-xs text-slate-500 break-words">{chess.history().map((m, k) => (k % 2 === 0 ? `${k / 2 + 1}. ${m}` : m)).join(' ') || 'Chưa có nước nào.'}</div>
            <div className="flex flex-wrap gap-2 pt-1">
              {!over && <button className="btn-ghost" onClick={undo}>↶ Đi lại</button>}
              {!over && <button className="btn-ghost" onClick={() => endGame(true)}>🏳️ Xin thua</button>}
              {over && !review && <button className="btn-primary" onClick={() => setReview({ loading: true })}>🔬 Phân tích ván</button>}
              {over && <button className="btn-ghost" onClick={onExit}>Ván mới</button>}
            </div>
          </div>
          {review && <GameReview pgn={chess.pgn()} color={color} onResult={(n) => update((s) => { if (s.games[0]) s.games[0].blunders = n })} />}
        </div>
      </div>
    </div>
  )
}

// Phân tích sau ván: tìm nước hớ của người chơi, lưu thành thế cờ ôn tập
function GameReview({ pgn, color, onResult }) {
  const [rows, setRows] = useState(null)
  const [prog, setProg] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      const c = new Chess(); c.loadPgn(pgn)
      const moves = c.history({ verbose: true })
      const g = new Chess()
      const out = []
      for (let k = 0; k < moves.length; k++) {
        const m = moves[k]
        if (m.color === color) {
          const fenBefore = g.fen()
          const [best] = await analyse(fenBefore, { depth: 11 })
          const t = new Chess(fenBefore); t.move(m.san)
          const after = t.isGameOver() ? null : (await analyse(t.fen(), { depth: 11 }))[0]
          const sb = scoreOf(best), sa = after ? -scoreOf(after) : t.isCheckmate() ? 10000 : 0
          const drop = Math.max(0, sb - sa)
          const bestSan = (() => { const x = new Chess(fenBefore); return moveUci(x, best.move)?.san })()
          const kind = drop >= 300 ? 'blunder' : drop >= 150 ? 'mistake' : drop >= 70 ? 'inaccuracy' : null
          if (kind) out.push({ k, san: m.san, bestSan, best: best.move, drop, kind, fen: fenBefore, num: Math.floor(k / 2) + 1 })
        }
        g.move(m.san)
        setProg(Math.round(((k + 1) / moves.length) * 100))
      }
      // nước hớ → bài ôn của riêng bạn
      const bl = out.filter((x) => x.kind === 'blunder' && x.best)
      bl.forEach((x) => {
        const id = 'my-' + x.fen.split(' ').slice(0, 2).join('').replace(/[^a-zA-Z0-9]/g, '').slice(-24)
        const data = { id, fen: x.fen, lastMove: null, moves: [x.best], theme: 'myBlunder', rating: 1000, source: 'mine' }
        update((s) => { s.puzzles[id] = { ...(s.puzzles[id] || { attempts: 0 }), data } })
        scheduleReview('puzzle', id, 1, `Nước hớ của bạn (nước ${x.num})`)
      })
      onResult?.(bl.length)
      setRows(out)
    })()
  }, [pgn])
  const LABEL = { blunder: ['?? Nước hớ', 'text-rose-700'], mistake: ['? Sai lầm', 'text-amber-700'], inaccuracy: ['?! Chưa chính xác', 'text-slate-600'] }
  return (
    <div className="card space-y-2">
      <div className="font-semibold">🔬 Phân tích ván {rows ? '' : `(${prog}%)`}</div>
      {!rows ? <div className="text-sm text-slate-500">Stockfish đang xem lại từng nước của bạn…</div> : rows.length === 0 ? (
        <div className="text-sm text-emerald-700">Không có nước hớ đáng kể. Rất tốt!</div>
      ) : (
        <>
          {rows.map((r) => (
            <div key={r.k} className="rounded-lg bg-slate-50 p-2 text-sm">
              <b className={LABEL[r.kind][1]}>{LABEL[r.kind][0]}</b> · nước {r.num}: bạn đi <b>{r.san}</b>, tốt hơn là <b className="text-emerald-700">{r.bestSan}</b> <span className="text-xs text-slate-500">(mất ~{(r.drop / 100).toFixed(1)})</span>
            </div>
          ))}
          {rows.some((r) => r.kind === 'blunder') && <div className="text-xs text-indigo-700">📅 Các nước hớ đã được lưu thành bài “Nước hớ của bạn” – sẽ xuất hiện trong Ôn tập ngày mai.</div>}
        </>
      )}
    </div>
  )
}

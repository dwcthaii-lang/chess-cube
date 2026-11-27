// CỜ TƯỚNG · ĐÁNH VỚI MÁY + "kiểm tra trước khi đi": nếu nước định đi làm mất quân / bị chiếu hết, máy hỏi lại.
// Sau ván: phân tích từng nước, chỉ ra nước hớ, và biến chúng thành bài ôn (lặp lại ngắt quãng).
import { useEffect, useRef, useState } from 'react'
import { Position, START_FEN, destsOf, dangerAfter, colorVi, moveVi, parseUci, LEVELS } from '../../lib/xiangqi'
import { xqBestMove, xqAnalyse } from '../../lib/xqEngine'
import { useStore, update, logHistory } from '../../lib/store'
import { scheduleReview } from '../../lib/review'
import { XqBoard } from '../../components/XqBoard'
import { kingInCheck, XqHabitCard } from '../../components/XqPuzzleSolver'
import { PageHeader } from '../../components/ui'

export default function XqPlay() {
  const settings = useStore((s) => s.settings)
  const games = useStore((s) => s.xqGames)
  const [game, setGame] = useState(null)
  if (game) return <Game {...game} onExit={() => setGame(null)} />
  const set = (p) => update((s) => Object.assign(s.settings, p))
  const level = settings.xqLevel ?? 2
  return (
    <div>
      <PageHeader title="🤖 Cờ tướng · Đánh với máy" subtitle="Bật “kiểm tra trước khi đi” để máy nhắc khi bạn sắp đi nước hớ – sau ván, nước hớ thành bài ôn." />
      <div className="card space-y-4">
        <div>
          <div className="label mb-2">Độ mạnh của máy: {level} – {LEVELS[level].label}</div>
          <input type="range" min="1" max="8" value={level} onChange={(e) => set({ xqLevel: Number(e.target.value) })} className="w-full sm:w-1/2" />
          <div className="text-xs text-slate-500">Mẹo: chọn mức mà bạn thắng khoảng 1/3 số ván. Thắng 3 ván liền → tăng 1 mức. Người mới bắt đầu ở mức 1–2.</div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={settings.xqBlunderCheck ?? true} onChange={(e) => set({ xqBlunderCheck: e.target.checked })} />
          <span><b>Kiểm tra trước khi đi</b> – nếu nước của bạn để quân bị treo hoặc cho đối phương chiếu hết, máy hỏi “Chắc chưa?”. Tắt đi khi bạn đã quen tự quét.</span>
        </label>
        <div>
          <div className="label mb-2">Chữ trên quân</div>
          <div className="flex flex-wrap gap-2">{[['viet', 'Tiếng Việt (Xe, Mã…)'], ['han', 'Chữ Hán (車, 馬…)']].map(([k, l]) => <button key={k} onClick={() => set({ xqPieceStyle: k })} className={(settings.xqPieceStyle || 'viet') === k ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{l}</button>)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => setGame({ color: 'w', key: Date.now() })}>🔴 Cầm Đỏ (đi trước)</button>
          <button className="btn-primary" onClick={() => setGame({ color: 'b', key: Date.now() })}>⚫ Cầm Đen</button>
          <button className="btn-ghost" onClick={() => setGame({ color: Math.random() < 0.5 ? 'w' : 'b', key: Date.now() })}>🎲 Ngẫu nhiên</button>
        </div>
      </div>
      <RulesCard />
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

function RulesCard() {
  return (
    <details className="card mt-4 text-sm text-slate-700">
      <summary className="cursor-pointer font-semibold">📖 Nhắc lại cách đi các quân (cho người mới)</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li><b>Tướng</b>: đi 1 bước ngang/dọc, chỉ trong cung (ô 3×3 có đường chéo). Hai Tướng <b>không được đối mặt</b> trên cùng cột mà không có quân ở giữa.</li>
        <li><b>Sĩ</b>: đi 1 bước chéo, chỉ trong cung.</li>
        <li><b>Tượng</b>: đi chéo đúng 2 bước (hình chữ điền), không qua sông; nếu điểm giữa có quân (“mắt tượng”) thì không đi được.</li>
        <li><b>Mã</b>: đi 1 bước thẳng rồi 1 bước chéo (hình chữ nhật). Nếu điểm sát Mã theo hướng đi có quân (“cản chân Mã”) thì không đi được.</li>
        <li><b>Xe</b>: đi ngang/dọc bao xa cũng được, không nhảy qua quân.</li>
        <li><b>Pháo</b>: đi như Xe, nhưng muốn <b>ăn</b> thì phải nhảy qua đúng <b>một</b> quân (gọi là “ngòi”).</li>
        <li><b>Tốt</b>: chỉ tiến 1 bước. Sau khi qua sông được đi thêm sang ngang. Không bao giờ lùi.</li>
        <li>Thắng khi đối phương bị <b>chiếu hết</b> hoặc <b>hết nước đi</b>. Trong app: lặp lại cùng một thế 3 lần thì hoà (luật đơn giản hoá).</li>
      </ul>
    </details>
  )
}

function Game({ color, onExit }) {
  const settings = useStore((s) => s.settings)
  const level = settings.xqLevel ?? 2
  const [pos] = useState(() => new Position(START_FEN))
  const [fen, setFen] = useState(pos.fen())
  const [moves, setMoves] = useState([]) // [{ uci, vi, color }]
  const [thinking, setThinking] = useState(false)
  const [warn, setWarn] = useState(null)
  const [checking, setChecking] = useState(false)
  const [takebacks, setTakebacks] = useState(0)
  const [over, setOver] = useState(null)
  const [review, setReview] = useState(false)
  const orient = color === 'w' ? 'white' : 'black'
  const last = moves.length ? [moves[moves.length - 1].uci.slice(0, 2), moves[moves.length - 1].uci.slice(2, 4)] : null

  const endGame = (resign, mv = moves) => {
    let result
    if (resign) result = 'Bạn xin thua'
    else if (pos.isMate()) result = pos.turnColor() === color ? (pos.inCheck() ? 'Thua (bị chiếu hết)' : 'Thua (hết nước đi)') : (pos.inCheck() ? 'Thắng (chiếu hết) 🎉' : 'Thắng (đối phương hết nước) 🎉')
    else result = 'Hoà'
    setOver(result)
    update((s) => { s.xqGames.unshift({ at: Date.now(), color, level, result, moves: mv.map((m) => m.uci), takebacks }); s.xqGames = s.xqGames.slice(0, 100) })
    logHistory('chess', `Cờ tướng – ván với máy mức ${level}: ${result}`)
  }

  const apply = (u) => {
    const info = pos.moveByUci(u)
    if (!info) return
    const mv = [...moves, { uci: u, vi: info.vi, color: info.color }]
    setMoves(mv); setFen(pos.fen())
    if (pos.isMate() || pos.repetitions() >= 2 || mv.length >= 300) endGame(false, mv)
  }

  // máy đi
  useEffect(() => {
    if (over || pos.turnColor() === color || pos.isMate()) return
    let alive = true
    setThinking(true)
    const t0 = Date.now()
    xqBestMove(pos.fen(), level, pos.hist).then((u) => {
      if (!alive) return
      setTimeout(() => { if (!alive) return; setThinking(false); if (u) apply(u) }, Math.max(0, 350 - (Date.now() - t0)))
    }).catch(() => setThinking(false))
    return () => { alive = false }
  }, [fen, over])

  const commit = (u) => { setWarn(null); apply(u) }

  const onMove = async (from, to) => {
    const u = from + to
    if (!(settings.xqBlunderCheck ?? true)) return commit(u)
    setChecking(true)
    const notes = dangerAfter(pos, u)
    let drop = 0
    try {
      const before = await xqAnalyse(pos.fen(), { depth: 4, timeMs: 700 })
      const c = pos.clone(); c.moveByUci(u)
      if (!c.isMate()) { const after = await xqAnalyse(c.fen(), { depth: 4, timeMs: 700 }); drop = before.score + after.score }
    } catch {}
    setChecking(false)
    if (drop >= 250 || notes.length) { setFen(pos.fen()); setWarn({ uci: u, notes, drop, vi: moveVi(pos, parseUci(u)) }); return }
    commit(u)
  }

  const undo = () => {
    if (moves.length < 2 || thinking) return
    let mv = moves
    pos.unmake(); mv = mv.slice(0, -1)
    if (pos.turnColor() !== color) { pos.unmake(); mv = mv.slice(0, -1) }
    setMoves(mv); setTakebacks((x) => x + 1); setOver(null); setWarn(null); setFen(pos.fen())
  }

  const myTurn = pos.turnColor() === color
  const dests = !over && !thinking && !warn && !checking && myTurn ? destsOf(pos) : null
  const chk = kingInCheck(pos)
  return (
    <div>
      <PageHeader title={`🤖 Cờ tướng · mức ${level} – ${LEVELS[level].label}`} right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_1fr]">
        <div className="flex justify-center">
          <XqBoard fen={fen} orientation={orient} dests={dests} onMove={onMove} lastMove={last} check={chk} />
        </div>
        <div className="space-y-3">
          <div className="card space-y-2">
            <div className="text-lg font-semibold">{over || (thinking ? '🤖 Máy đang nghĩ…' : checking ? '🔎 Đang kiểm tra nước của bạn…' : chk && myTurn ? '⚠️ BẠN ĐANG BỊ CHIẾU!' : `Tới lượt bạn (${colorVi(color)})`)}</div>
            {warn && (
              <div className="space-y-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
                <div className="font-semibold text-amber-800">🤔 Chắc chưa? Nước {warn.vi} có vẻ nguy hiểm:</div>
                <ul className="list-disc pl-5 text-sm text-amber-900">
                  {warn.notes.map((n) => <li key={n}>{n}</li>)}
                  {!warn.notes.length && <li>Máy thấy nước này làm bạn thiệt khoảng {(warn.drop / 100).toFixed(1)} điểm (≈ {warn.drop >= 800 ? 'một quân Xe' : warn.drop >= 350 ? 'một quân Mã/Pháo' : 'một Tốt hoặc Sĩ/Tượng'}).</li>}
                </ul>
                <div className="text-xs text-amber-800">Hãy quét lại: đối phương có nước chiếu nào (nhớ Pháo và Mã)? ăn quân nào? doạ gì?</div>
                <div className="flex gap-2"><button className="btn-primary" onClick={() => setWarn(null)}>↶ Nghĩ lại</button><button className="btn-ghost" onClick={() => commit(warn.uci)}>Vẫn đi</button></div>
              </div>
            )}
            <div className="text-xs text-slate-500 break-words">{moves.map((m, k) => (k % 2 === 0 ? `${k / 2 + 1}. ${m.vi}` : m.vi)).join('  ') || 'Chưa có nước nào.'}</div>
            <div className="flex flex-wrap gap-2 pt-1">
              {!over && <button className="btn-ghost" onClick={undo}>↶ Đi lại</button>}
              {!over && <button className="btn-ghost" onClick={() => endGame(true)}>🏳️ Xin thua</button>}
              {over && !review && moves.length > 1 && <button className="btn-primary" onClick={() => setReview(true)}>🔬 Phân tích ván</button>}
              {over && <button className="btn-ghost" onClick={onExit}>Ván mới</button>}
            </div>
          </div>
          {review && <GameReview moves={moves.map((m) => m.uci)} color={color} onResult={(n) => update((s) => { if (s.xqGames[0]) s.xqGames[0].blunders = n })} />}
          {!review && <XqHabitCard />}
        </div>
      </div>
    </div>
  )
}

// Phân tích sau ván: tìm nước hớ của người chơi, lưu thành thế cờ ôn tập
function GameReview({ moves, color, onResult }) {
  const [rows, setRows] = useState(null)
  const [prog, setProg] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      const g = new Position(START_FEN)
      const out = []
      for (let k = 0; k < moves.length; k++) {
        const u = moves[k]
        if (g.turnColor() === color) {
          const fenBefore = g.fen()
          const best = await xqAnalyse(fenBefore, { depth: 5, timeMs: 900 })
          const t = g.clone(); t.moveByUci(u)
          const sa = t.isMate() ? 30000 : -(await xqAnalyse(t.fen(), { depth: 5, timeMs: 900 })).score
          const drop = Math.max(0, best.score - sa)
          const kind = drop >= 300 ? 'blunder' : drop >= 150 ? 'mistake' : drop >= 70 ? 'inaccuracy' : null
          if (kind && best.move && best.move !== u) {
            const bp = new Position(fenBefore)
            out.push({ k, vi: moveVi(bp, parseUci(u)), bestVi: moveVi(bp, parseUci(best.move)), best: best.move, drop: Math.min(drop, 2000), kind, fen: fenBefore, num: Math.floor(k / 2) + 1 })
          }
        }
        g.moveByUci(u)
        setProg(Math.round(((k + 1) / moves.length) * 100))
      }
      const bl = out.filter((x) => x.kind === 'blunder')
      bl.forEach((x) => {
        const id = 'xmy-' + x.fen.split(' ').slice(0, 2).join('').replace(/[^a-zA-Z0-9]/g, '').slice(-28)
        const data = { id, fen: x.fen, lastMove: null, moves: [x.best], theme: 'myBlunder', rating: 1000, source: 'mine' }
        update((s) => { s.xqPuzzles[id] = { ...(s.xqPuzzles[id] || { attempts: 0 }), data } })
        scheduleReview('xqpuzzle', id, 1, `Cờ tướng – nước hớ của bạn (nước ${x.num})`)
      })
      onResult?.(bl.length)
      setRows(out)
    })()
  }, [moves])
  const LABEL = { blunder: ['?? Nước hớ', 'text-rose-700'], mistake: ['? Sai lầm', 'text-amber-700'], inaccuracy: ['?! Chưa chính xác', 'text-slate-600'] }
  return (
    <div className="card space-y-2">
      <div className="font-semibold">🔬 Phân tích ván {rows ? '' : `(${prog}%)`}</div>
      {!rows ? <div className="text-sm text-slate-500">Máy đang xem lại từng nước của bạn…</div> : rows.length === 0 ? (
        <div className="text-sm text-emerald-700">Không có nước hớ đáng kể. Rất tốt!</div>
      ) : (
        <>
          {rows.map((r) => (
            <div key={r.k} className="rounded-lg bg-slate-50 p-2 text-sm">
              <b className={LABEL[r.kind][1]}>{LABEL[r.kind][0]}</b> · nước {r.num}: bạn đi <b>{r.vi}</b>, tốt hơn là <b className="text-emerald-700">{r.bestVi}</b> <span className="text-xs text-slate-500">(thiệt ~{(r.drop / 100).toFixed(1)})</span>
            </div>
          ))}
          {rows.some((r) => r.kind === 'blunder') && <div className="text-xs text-indigo-700">📅 Các nước hớ đã được lưu thành bài “Nước hớ của bạn” – sẽ xuất hiện trong Ôn tập ngày mai (mục 🧩 Ôn thế cờ tướng).</div>}
        </>
      )}
    </div>
  )
}

// THẾ CỜ CHIẾN THUẬT – ôn lặp lại ngắt quãng: bài sai/giải chậm quay lại sớm, bài giải nhanh giãn dần
import { useEffect, useState } from 'react'
import { useStore, update, logHistory } from '../lib/store'
import { scheduleReview } from '../lib/review'
import { THEMES, LICHESS_ANGLES, dueList, newLeft, freshLocal, fetchLichess, localPuzzles } from '../lib/puzzles'
import { PuzzleSolver } from '../components/PuzzleSolver'
import { PageHeader, Progress, Stat } from '../components/ui'
import { useHotkeys } from '../lib/hotkeys'

const LOCAL_THEMES = ['all', 'mate', 'hangingPiece', 'fork', 'capture', 'advantage']
const LABEL = { all: 'Tất cả', mate: 'Chiếu hết', ...THEMES }

export default function Puzzles({ mode }) {
  const s = useStore()
  const [theme, setTheme] = useState('all')
  const [src, setSrc] = useState(s.settings.puzzleSource === 'lichess' ? 'lichess' : 'local')
  const [session, setSession] = useState(() => (mode === 'review' ? { review: true, list: dueList('puzzle') } : null))
  const due = dueList('puzzle', s)
  const left = newLeft('puzzle', s)
  const solvedAll = Object.values(s.reviews).filter((r) => r.type === 'puzzle')
  const acc = solvedAll.length ? Math.round((solvedAll.filter((r) => r.log[r.log.length - 1]?.g >= 4).length / solvedAll.length) * 100) : 0

  if (session) return <Session {...session} onExit={() => { setSession(null); if (mode) location.hash = '#/puzzles' }} />

  const startNew = () => {
    if (src === 'lichess') setSession({ review: false, lichess: theme === 'all' || theme === 'mate' ? (theme === 'mate' ? 'mateIn2' : 'mix') : theme, list: [] })
    else setSession({ review: false, list: freshLocal({ theme }).slice(0, Math.max(1, left)) })
  }
  const themes = src === 'lichess' ? ['all', ...LICHESS_ANGLES] : LOCAL_THEMES

  return (
    <div>
      <PageHeader title="🧩 Thế cờ chiến thuật" subtitle="Mỗi bài có một nước thắng. Giải sai hoặc phải xem gợi ý thì bài quay lại vào ngày mai; giải nhanh thì giãn dần 1 → 3 → 7 → 15+ ngày." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <button disabled={!due.length} onClick={() => setSession({ review: true, list: due })} className={`card !p-4 text-left ${due.length ? 'border-rose-300 bg-rose-50 hover:bg-rose-100' : ''}`}>
          <div className="text-sm text-slate-500">Cần ôn hôm nay</div>
          <div className={`text-3xl font-bold ${due.length ? 'text-rose-600' : 'text-emerald-600'}`}>{due.length} bài</div>
          {due.length > 0 && <div className="text-sm text-rose-700">Ôn trước khi làm bài mới →</div>}
        </button>
        <div className="card !p-4">
          <div className="text-sm text-slate-500">Bài mới còn lại hôm nay</div>
          <div className="text-3xl font-bold">{left}<span className="text-base text-slate-400">/{s.settings.newPuzzlesPerDay}</span></div>
          <Progress value={s.settings.newPuzzlesPerDay - left} max={s.settings.newPuzzlesPerDay} />
        </div>
        <Stat label="Đã làm / giải đúng lần gần nhất" value={`${solvedAll.length}`} sub={`${acc}% đúng · kho có sẵn ${localPuzzles.length} bài + Lichess không giới hạn`} />
      </div>
      <div className="card space-y-4">
        <div>
          <div className="label mb-2">Nguồn bài</div>
          <div className="flex flex-wrap gap-2">
            <button className={src === 'local' ? 'btn-primary' : 'btn-ghost'} onClick={() => { setSrc('local'); setTheme('all') }}>📦 Bộ có sẵn (offline)</button>
            <button className={src === 'lichess' ? 'btn-primary' : 'btn-ghost'} onClick={() => { setSrc('lichess'); setTheme('all') }}>🌐 Lichess (cần mạng)</button>
          </div>
        </div>
        <div>
          <div className="label mb-2">Chủ đề</div>
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => <button key={t} onClick={() => setTheme(t)} className={theme === t ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{LABEL[t] || t}{src === 'local' && t !== 'all' ? ` (${freshLocal({ theme: t }).length})` : ''}</button>)}
          </div>
        </div>
        <button className="btn-primary text-base px-6 py-3" onClick={startNew}>▶ Làm bài mới{left === 0 ? ' (đã đủ chỉ tiêu – vẫn làm thêm được)' : ''}</button>
        <p className="text-xs text-slate-500">Người mới nên bắt đầu với <b>Chiếu hết</b> và <b>Ăn quân bị treo</b>: hai lỗi hay gặp nhất là bỏ lỡ nước chiếu hết và để quân bị ăn miễn phí.</p>
      </div>
    </div>
  )
}

function Session({ list, review, lichess, onExit }) {
  const [queue, setQueue] = useState(list)
  const [i, setI] = useState(0)
  const [res, setRes] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const maxLichess = 10

  const loadNext = async () => {
    setLoading(true); setErr('')
    try { const p = await fetchLichess(lichess, 'easier'); setQueue((q) => [...q, p]) } catch (e) { setErr(String(e.message || e) + ' – kiểm tra mạng, hoặc dùng bộ có sẵn.') }
    setLoading(false)
  }
  useEffect(() => { if (lichess && queue.length <= i && results.length < maxLichess && !loading && !err) loadNext() }, [i, queue.length])

  const p = queue[i]
  const next = () => { setRes(null); setI(i + 1) }
  useHotkeys({ Enter: () => res && next() })

  if (err) return <div><PageHeader title="🧩 Thế cờ" right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} /><div className="card text-rose-600">{err}</div></div>
  if (!p && loading) return <div className="card">⏳ Đang tải thế cờ từ Lichess…</div>
  if (!p) {
    const ok = results.filter((r) => r.ok).length
    return (
      <div>
        <PageHeader title={results.length ? '🎉 Xong lượt!' : '🧩 Thế cờ'} subtitle={results.length ? `${ok}/${results.length} bài giải đúng ngay lần đầu` : ''} />
        <div className="card space-y-3">
          {!results.length && <div>✅ Không có bài nào {review ? 'cần ôn' : 'mới theo chủ đề này'}.</div>}
          <p className="text-sm text-slate-600">Bài sai sẽ quay lại vào ngày mai. Mở <b>📅 Ôn tập hôm nay</b> mỗi ngày nhé.</p>
          <div className="flex gap-2"><button className="btn-primary" onClick={onExit}>Xong</button><a className="btn-ghost" href="#/review">📅 Ôn tập hôm nay</a></div>
        </div>
      </div>
    )
  }
  return (
    <div>
      <PageHeader title={review ? '🔁 Ôn thế cờ' : '🧩 Thế cờ mới'} right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500"><span>Bài {i + 1}/{lichess ? maxLichess : queue.length}</span><div className="flex-1"><Progress value={i} max={lichess ? maxLichess : queue.length} /></div></div>
      <PuzzleSolver
        key={p.id + i}
        puzzle={p}
        onDone={(r) => {
          scheduleReview('puzzle', p.id, r.grade, `${THEMES[p.theme] || 'Thế cờ'} · ${p.id}`)
          update((s) => { const x = (s.puzzles[p.id] ||= { attempts: 0 }); x.attempts++; x.lastAt = Date.now(); x.solved = r.ok })
          logHistory('chess', `Thế cờ ${p.id}: ${r.ok ? 'đúng' : 'sai'} (${Math.round(r.sec)}s)`)
          setRes(r); setResults((x) => [...x, r])
        }}
      />
      {res && <div className="mt-3 flex justify-center"><button className="btn-primary" onClick={next}>Bài tiếp <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button></div>}
    </div>
  )
}

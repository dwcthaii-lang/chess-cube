// CỜ TƯỚNG · THẾ CỜ CHIẾN THUẬT – ôn lặp lại ngắt quãng: bài sai/giải chậm quay lại sớm, bài giải nhanh giãn dần
import { useState } from 'react'
import { useStore, update, logHistory } from '../../lib/store'
import { scheduleReview } from '../../lib/review'
import { XQ_THEMES, xqDueList, xqNewLeft, xqFresh, xqLocal } from '../../lib/xqPuzzles'
import { XqPuzzleSolver } from '../../components/XqPuzzleSolver'
import { PageHeader, Progress, Stat } from '../../components/ui'
import { useHotkeys } from '../../lib/hotkeys'

const THEMES = ['all', 'mate', 'hangingPiece', 'fork', 'capture', 'check', 'advantage']
const LABEL = { all: 'Tất cả', mate: 'Chiếu hết', ...XQ_THEMES }

export default function XqPuzzles({ mode }) {
  const s = useStore()
  const [theme, setTheme] = useState('all')
  const [session, setSession] = useState(() => (mode === 'review' ? { review: true, list: xqDueList('xqpuzzle') } : null))
  const due = xqDueList('xqpuzzle', s)
  const left = xqNewLeft('xqpuzzle', s)
  const done = Object.values(s.reviews).filter((r) => r.type === 'xqpuzzle')
  const acc = done.length ? Math.round((done.filter((r) => r.log[r.log.length - 1]?.g >= 4).length / done.length) * 100) : 0
  const perDay = s.settings.newXqPerDay ?? 10

  if (session) return <Session {...session} onExit={() => { setSession(null); if (mode) location.hash = '#/xq-puzzles' }} />

  return (
    <div>
      <PageHeader title="🧩 Cờ tướng · Thế cờ chiến thuật" subtitle="Mỗi bài có một nước thắng. Giải sai hoặc phải xem gợi ý thì bài quay lại vào ngày mai; giải nhanh thì giãn dần 1 → 3 → 7 → 15+ ngày." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <button disabled={!due.length} onClick={() => setSession({ review: true, list: due })} className={`card !p-4 text-left ${due.length ? 'border-rose-300 bg-rose-50 hover:bg-rose-100' : ''}`}>
          <div className="text-sm text-slate-500">Cần ôn hôm nay</div>
          <div className={`text-3xl font-bold ${due.length ? 'text-rose-600' : 'text-emerald-600'}`}>{due.length} bài</div>
          {due.length > 0 && <div className="text-sm text-rose-700">Ôn trước khi làm bài mới →</div>}
        </button>
        <div className="card !p-4">
          <div className="text-sm text-slate-500">Bài mới còn lại hôm nay</div>
          <div className="text-3xl font-bold">{left}<span className="text-base text-slate-400">/{perDay}</span></div>
          <Progress value={perDay - left} max={perDay} />
        </div>
        <Stat label="Đã làm / giải đúng lần gần nhất" value={`${done.length}`} sub={`${acc}% đúng · kho có sẵn ${xqLocal.length} bài`} />
      </div>
      <div className="card space-y-4">
        <div>
          <div className="label mb-2">Chủ đề</div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => <button key={t} onClick={() => setTheme(t)} className={theme === t ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{LABEL[t]}{t !== 'all' ? ` (${xqFresh({ theme: t }).length})` : ''}</button>)}
          </div>
        </div>
        <button className="btn-primary text-base px-6 py-3" onClick={() => setSession({ review: false, list: xqFresh({ theme }).slice(0, Math.max(1, left)) })}>▶ Làm bài mới{left === 0 ? ' (đã đủ chỉ tiêu – vẫn làm thêm được)' : ''}</button>
        <p className="text-xs text-slate-500">Người mới nên bắt đầu với <b>Chiếu hết 1 nước</b> và <b>Ăn quân bị treo</b>. Bài chiếu hết 2–3 nước là các đòn “liên hoàn chiếu”: nước nào của bạn cũng phải chiếu.</p>
      </div>
    </div>
  )
}

function Session({ list, review, onExit }) {
  const [i, setI] = useState(0)
  const [res, setRes] = useState(null)
  const [results, setResults] = useState([])
  const p = list[i]
  const next = () => { setRes(null); setI(i + 1) }
  useHotkeys({ Enter: () => res && next() })
  if (!p) {
    const ok = results.filter((r) => r.ok).length
    return (
      <div>
        <PageHeader title={results.length ? '🎉 Xong lượt!' : '🧩 Thế cờ tướng'} subtitle={results.length ? `${ok}/${results.length} bài giải đúng ngay lần đầu` : ''} />
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
      <PageHeader title={review ? '🔁 Ôn thế cờ tướng' : '🧩 Thế cờ tướng mới'} right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500"><span>Bài {i + 1}/{list.length}</span><div className="flex-1"><Progress value={i} max={list.length} /></div></div>
      <XqPuzzleSolver
        key={p.id + i}
        puzzle={p}
        onDone={(r) => {
          scheduleReview('xqpuzzle', p.id, r.grade, `${XQ_THEMES[p.theme] || 'Thế cờ'} · ${p.id}`)
          update((s) => { const x = (s.xqPuzzles[p.id] ||= { attempts: 0 }); x.attempts++; x.lastAt = Date.now(); x.solved = r.ok })
          logHistory('chess', `Cờ tướng – thế cờ ${p.id}: ${r.ok ? 'đúng' : 'sai'} (${Math.round(r.sec)}s)`)
          setRes(r); setResults((x) => [...x, r])
        }}
      />
      {res && <div className="mt-3 flex justify-center"><button className="btn-primary" onClick={next}>Bài tiếp <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button></div>}
    </div>
  )
}

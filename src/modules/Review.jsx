// ÔN TẬP HÔM NAY: gom mọi mục đến hạn (thế cờ, tính nước, quét nguy hiểm, công thức Rubik, bài học)
import { useStore } from '../lib/store'
import { REVIEW_TYPES, dueReviews } from '../lib/review'
import { today, addDays, daysBetween } from '../lib/date'
import { PageHeader } from '../components/ui'

const GROUPS = [
  ['puzzle', '🧩 Ôn thế cờ', 'giải lại các bài từng sai / nước hớ của bạn', '#/puzzles/review'],
  ['calc', '🧠 Ôn tính nước', 'tính lại chuỗi nước', '#/calc/review'],
  ['alg', '🧊 Ôn công thức Rubik', 'nhìn trường hợp → nhớ công thức', '#/algs/review'],
]

export default function Review() {
  const s = useStore()
  const t = today()
  const due = dueReviews(s, t)
  const all = Object.values(s.reviews)
  const forecast = Array.from({ length: 7 }, (_, i) => { const d = addDays(t, i + 1); return { d, n: all.filter((r) => r.due === d).length } })
  const maxF = Math.max(1, ...forecast.map((f) => f.n))
  const singles = due.filter((r) => !GROUPS.some(([k]) => k === r.type))
  return (
    <div>
      <PageHeader title="📅 Ôn tập hôm nay" subtitle="Lặp lại ngắt quãng: thứ gì bạn làm sai sẽ quay lại sớm, thứ đã chắc thì giãn dần (1 → 3 → 7 → 15 → 30+ ngày). Ôn trước, học mới sau." />
      {due.length === 0 ? (
        <div className="card mb-4">
          <div className="text-lg font-semibold">✅ Không còn gì cần ôn hôm nay!</div>
          <div className="mt-3 flex flex-wrap gap-2"><a className="btn-primary" href="#/scan">🔍 Quét nguy hiểm</a><a className="btn-ghost" href="#/puzzles">🧩 Thế cờ mới</a><a className="btn-ghost" href="#/learn">📘 Học Rubik</a></div>
        </div>
      ) : (
        <div className="card mb-4 space-y-3">
          {GROUPS.map(([k, label, sub, href]) => { const n = due.filter((r) => r.type === k).length; return n ? (
            <a key={k} href={href} className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3 hover:bg-indigo-100">
              <span className="flex-1"><b>{label}</b> <span className="text-sm text-slate-600">({n}) – {sub}</span></span><span className="btn-primary">Bắt đầu</span>
            </a>) : null })}
          {singles.map((r) => { const T = REVIEW_TYPES[r.type]; const late = daysBetween(r.due, t); return (
            <a key={r.key} href={T.href(r)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <span className="text-xl">{T.icon}</span><span className="flex-1"><b>{T.label}:</b> {r.title || r.refId} <span className="ml-2 text-xs text-slate-500">ôn lần {r.reps + 1}{late > 0 ? ` · trễ ${late} ngày` : ''}</span></span><span className="text-sm text-indigo-600">Ôn →</span>
            </a>) })}
        </div>
      )}
      <div className="card">
        <div className="label mb-3">Lịch ôn 7 ngày tới</div>
        <div className="flex h-24 items-end gap-2">
          {forecast.map((f) => <div key={f.d} className="flex h-full flex-1 flex-col items-center justify-end"><span className="text-xs text-slate-600">{f.n || ''}</span><div className="w-full max-w-[28px] rounded-t bg-indigo-300" style={{ height: `${(f.n / maxF) * 70}%`, minHeight: f.n ? 3 : 0 }} /></div>)}
        </div>
        <div className="mt-1 flex gap-2 text-center text-[11px] text-slate-500">{forecast.map((f) => <div key={f.d} className="flex-1">{f.d.slice(8, 10)}/{f.d.slice(5, 7)}</div>)}</div>
        <p className="mt-3 text-xs text-slate-500">Tổng cộng {all.length} mục đang trong vòng ôn.</p>
      </div>
    </div>
  )
}

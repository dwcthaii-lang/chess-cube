// TỔNG QUAN: việc cần làm hôm nay, thời gian luyện 7 ngày, tiến độ cờ & Rubik
import { useStore } from '../lib/store'
import { today, lastNDays, fmtMin } from '../lib/date'
import { dueReviews } from '../lib/review'
import { aoN, fmt } from './Timer'
import { PageHeader, Progress } from '../components/ui'

export default function Dashboard() {
  const s = useStore()
  const due = dueReviews(s)
  const t = s.time[today()] || {}
  const goal = s.settings.dailyGoalMin
  const days = lastNDays(7)
  const max = Math.max(goal, ...days.map((d) => fmtMin(s.time[d]?.total)), 1)
  const streak = (() => { let n = 0; for (const d of [...lastNDays(60)].reverse()) { if (fmtMin(s.time[d]?.total) >= 5) n++; else if (d !== today()) break } return n })()
  const puzzleRevs = Object.values(s.reviews).filter((r) => r.type === 'puzzle')
  const xqRevs = Object.values(s.reviews).filter((r) => r.type === 'xqpuzzle')
  const plan = [
    ['📅', 'Ôn tập hôm nay', due.length ? `${due.length} mục đến hạn` : 'Đã xong ✓', '#/review', !due.length],
    ['🔍', 'Quét nguy hiểm 5 thế', s.reviews['scan:daily']?.last === today() ? 'Đã làm ✓' : '≈ 5 phút', '#/scan', s.reviews['scan:daily']?.last === today()],
    ['🧩', 'Thế cờ mới', `${s.settings.newPuzzlesPerDay} bài/ngày`, '#/puzzles', false],
    ['🏮', 'Cờ tướng: quét 5 thế + thế cờ mới', s.reviews['xqscan:daily']?.last === today() ? 'Đã quét ✓' : '≈ 10 phút', '#/xq-scan', s.reviews['xqscan:daily']?.last === today()],
    ['⏱️', 'Rubik: 12 lần bấm giờ (ao12)', `${(s.solves['333'] || []).filter((x) => new Date(x.at).toDateString() === new Date().toDateString()).length}/12 hôm nay`, '#/timer', false],
  ]
  return (
    <div>
      <PageHeader title="📊 Tổng quan hôm nay" subtitle="Thứ tự gợi ý: ôn bài đến hạn → quét nguy hiểm → thế cờ mới → Rubik. Khoảng 30 phút/ngày là đủ tiến bộ đều." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card !p-4"><div className="text-sm text-slate-500">Hôm nay</div><div className="text-3xl font-bold">{fmtMin(t.total)}<span className="text-base text-slate-400">/{goal} phút</span></div><Progress value={fmtMin(t.total)} max={goal} /></div>
        <div className="card !p-4"><div className="text-sm text-slate-500">Chuỗi ngày luyện</div><div className="text-3xl font-bold">🔥 {streak}</div><div className="text-xs text-slate-500">ngày liên tiếp ≥ 5 phút</div></div>
        <a href="#/review" className={`card !p-4 ${due.length ? 'border-rose-300 bg-rose-50' : ''}`}><div className="text-sm text-slate-500">Cần ôn</div><div className={`text-3xl font-bold ${due.length ? 'text-rose-600' : 'text-emerald-600'}`}>{due.length}</div><div className="text-xs text-slate-500">thế cờ · công thức · bài học</div></a>
      </div>
      <div className="card mb-4 space-y-2">
        <div className="label">Kế hoạch hôm nay</div>
        {plan.map(([ic, l, sub, href, ok]) => (
          <a key={l} href={href} className={`flex items-center gap-3 rounded-xl p-3 ${ok ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-indigo-50'}`}>
            <span className="text-xl">{ic}</span><span className="flex-1 font-medium">{l}</span><span className="text-sm text-slate-500">{sub}</span>
          </a>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="label mb-3">7 ngày qua (phút)</div>
          <div className="flex h-32 items-end gap-2">
            {days.map((d) => { const v = fmtMin(s.time[d]?.total); return (
              <div key={d} className="flex h-full flex-1 flex-col items-center justify-end" title={`${d}: ♟️ ${fmtMin(s.time[d]?.chess)}′ · 🧊 ${fmtMin(s.time[d]?.cube)}′`}>
                <span className="text-[10px] text-slate-500">{v || ''}</span>
                <div className={`w-full max-w-[26px] rounded-t ${d === today() ? 'bg-indigo-600' : 'bg-indigo-300'}`} style={{ height: `${(v / max) * 85}%`, minHeight: v ? 2 : 0 }} />
              </div>) })}
          </div>
          <div className="mt-1 flex gap-2 text-center text-[10px] text-slate-500">{days.map((d) => <div key={d} className="flex-1">{d.slice(8)}/{d.slice(5, 7)}</div>)}</div>
        </div>
        <div className="card space-y-2 text-sm">
          <div className="label">Tiến độ</div>
          <div>🧩 Thế cờ đã làm: <b>{puzzleRevs.length}</b> · đúng lần gần nhất: <b>{puzzleRevs.filter((r) => r.log[r.log.length - 1]?.g >= 4).length}</b></div>
          <div>🔍 Quét nguy hiểm: <b>{s.scans.n}</b> thế · đúng hoàn toàn <b>{s.scans.ok}</b></div>
          <div>🤖 Ván với máy: <b>{s.games.length}</b> · thắng <b>{s.games.filter((g) => g.result.startsWith('Thắng')).length}</b></div>
          <div>🏮 Cờ tướng: thế cờ <b>{xqRevs.length}</b> · quét <b>{s.xqScans.n}</b> thế · ván với máy <b>{s.xqGames.length}</b> (thắng <b>{s.xqGames.filter((g) => g.result.startsWith('Thắng')).length}</b>)</div>
          {['333', '222', '444'].map((e) => (s.solves[e] || []).length > 0 && <div key={e}>🧊 {e[0]}x{e[0]}: ao5 <b>{fmt(aoN(s.solves[e], 5))}</b> · ao12 <b>{fmt(aoN(s.solves[e], 12))}</b> · {s.solves[e].length} lần</div>)}
          <div>📘 Bài học Rubik đã học: <b>{Object.keys(s.lessons).length}</b>/10</div>
        </div>
      </div>
    </div>
  )
}

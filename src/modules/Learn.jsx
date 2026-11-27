// HỌC RUBIK – bài học theo lộ trình; học xong bài → vào lịch ôn + mở bộ công thức để ôn
import { TRACKS, LESSONS, lessonById } from '../data/lessons'
import { ALGS, ALG_SETS } from '../data/algs'
import { useStore, update, logHistory } from '../lib/store'
import { scheduleReview, nextDueLabel } from '../lib/review'
import { today } from '../lib/date'
import { Cube } from '../components/Cube'
import { PageHeader } from '../components/ui'

export default function Learn({ id }) {
  const lessons = useStore((s) => s.lessons)
  const reviews = useStore((s) => s.reviews)
  const l = id && lessonById(id)
  if (l) return <Lesson l={l} done={lessons[l.id]} rv={reviews[`lesson:${l.id}`]} />
  return (
    <div>
      <PageHeader title="📘 Học Rubik" subtitle="Lộ trình dành cho bạn: tối ưu 3x3 từ cách giải tầng; 2x2 và 4x4 học từ đầu. Học xong bài nào, công thức của bài đó vào phần Ôn công thức." />
      {TRACKS.map((t) => {
        const list = LESSONS.filter((x) => x.track === t.id)
        const n = list.filter((x) => lessons[x.id]).length
        return (
          <div key={t.id} className="mb-5">
            <div className="mb-2 flex items-baseline justify-between"><div className="font-bold">{t.emoji} {t.name}</div><div className="text-xs text-slate-500">{n}/{list.length} bài</div></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((x, k) => {
                const rv = reviews[`lesson:${x.id}`]
                const due = rv && rv.due <= today()
                return (
                  <a key={x.id} href={`#/learn/${x.id}`} className={`card !p-4 transition hover:border-indigo-300 ${due ? 'border-rose-300' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${lessons[x.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{lessons[x.id] ? '✓' : k + 1}</span>
                      <div className="flex-1"><div className="font-semibold leading-tight">{x.title}</div><div className="text-xs text-slate-500">{x.time}{x.algSet ? ` · ${ALGS.filter((a) => a.set === x.algSet).length} công thức` : ''}</div></div>
                      {due ? <span className="chip bg-rose-100 text-rose-700">📅 Ôn</span> : rv ? <span className="chip bg-emerald-50 text-emerald-700">{nextDueLabel(rv).replace('Ôn lại ', '')}</span> : null}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Lesson({ l, done, rv }) {
  const algs = l.algSet ? ALGS.filter((a) => a.set === l.algSet) : []
  const set = l.algSet && ALG_SETS[l.algSet]
  const finish = (grade) => {
    update((s) => { s.lessons[l.id] = s.lessons[l.id] || today() })
    scheduleReview('lesson', l.id, grade, `Bài học: ${l.title}`)
    logHistory('cube', `Học bài: ${l.title}`)
  }
  return (
    <div>
      <PageHeader title={`📘 ${l.title}`} subtitle={`${TRACKS.find((t) => t.id === l.track).name} · ${l.time}`} right={<a className="btn-ghost" href="#/learn">← Danh sách</a>} />
      <div className="card mb-4 space-y-3">
        {l.body.map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}
      </div>
      {l.demos?.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {l.demos.map((d, i) => (
            <div key={i} className="card flex flex-col items-center">
              <Cube puzzle={d.puzzle || '3x3x3'} alg={d.alg} setupAlg={d.setup || ''} stick={d.stick || 'full'} size={200} />
              <div className="mt-1 font-mono text-sm">{d.alg}</div>
              <div className="text-xs text-slate-500">{d.label}</div>
            </div>
          ))}
        </div>
      )}
      {algs.length > 0 && (
        <div className="mb-4">
          <div className="label mb-2">Công thức của bài ({algs.length}) – bấm ▶ dưới khối để xem chạy</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {algs.map((a) => (
              <div key={a.id} className="card flex flex-col items-center !p-3">
                <Cube puzzle={set.puzzle} alg={a.alg} asCase stick={set.stick} size={170} />
                <div className="mt-1 text-sm font-semibold">{a.name}</div>
                <div className="font-mono text-sm text-indigo-700">{a.alg}</div>
                <div className="mt-1 text-xs text-slate-500">{a.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card space-y-2">
        {done ? <div className="text-sm text-emerald-700">✅ Đã học ngày {done.split('-').reverse().join('/')}. {rv ? nextDueLabel(rv) + '.' : ''}</div> : <div className="text-sm text-slate-600">Đọc xong và làm thử trên khối thật thì đánh dấu. Bài sẽ được nhắc ôn lại{algs.length ? ', công thức vào phần Ôn công thức (tối đa vài công thức mới mỗi ngày)' : ''}.</div>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => finish(4)}>{done ? '🔁 Đã ôn lại – nhớ tốt' : '✅ Đã học xong bài này'}</button>
          {done && <button className="btn-ghost" onClick={() => finish(2)}>Ôn lại – còn quên nhiều</button>}
          {algs.length > 0 && <a className="btn-ghost" href="#/algs">🧊 Ôn công thức</a>}
        </div>
      </div>
    </div>
  )
}

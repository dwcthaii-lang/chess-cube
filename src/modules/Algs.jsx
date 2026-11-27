// ÔN CÔNG THỨC RUBIK – thẻ lặp lại ngắt quãng: nhìn trường hợp → nhớ công thức, làm trên khối thật → lật xem → tự chấm
import { useState } from 'react'
import { ALGS, ALG_SETS, algById } from '../data/algs'
import { LESSONS } from '../data/lessons'
import { useStore, logHistory } from '../lib/store'
import { scheduleReview, dueReviews, newStartedToday, reviewOf } from '../lib/review'
import { Cube } from '../components/Cube'
import { PageHeader, Progress } from '../components/ui'
import { useHotkeys } from '../lib/hotkeys'

function unlockedSets(s) {
  const sets = LESSONS.filter((l) => l.algSet && s.lessons[l.id]).map((l) => l.algSet)
  return [...new Set(sets)]
}

export default function Algs({ mode }) {
  const s = useStore()
  const due = dueReviews(s).filter((r) => r.type === 'alg').map((r) => algById(r.refId)).filter(Boolean)
  const sets = unlockedSets(s)
  const newLeft = Math.max(0, s.settings.newAlgsPerDay - newStartedToday('alg', s))
  const fresh = ALGS.filter((a) => sets.includes(a.set) && !reviewOf('alg', a.id, s))
  const [session, setSession] = useState(() => (mode === 'review' ? due : null))
  if (session) return <Session list={session} onExit={() => { setSession(null); if (mode) location.hash = '#/algs' }} />
  const learned = ALGS.filter((a) => reviewOf('alg', a.id, s))
  return (
    <div>
      <PageHeader title="🧊 Ôn công thức Rubik" subtitle="Nhìn trường hợp trên khối → tự nhớ công thức và làm trên khối thật → lật thẻ kiểm tra → tự chấm. Thẻ khó quay lại sớm." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <button disabled={!due.length} onClick={() => setSession(due)} className={`card !p-4 text-left ${due.length ? 'border-rose-300 bg-rose-50' : ''}`}>
          <div className="text-sm text-slate-500">Cần ôn hôm nay</div>
          <div className={`text-3xl font-bold ${due.length ? 'text-rose-600' : 'text-emerald-600'}`}>{due.length} thẻ</div>
        </button>
        <div className="card !p-4"><div className="text-sm text-slate-500">Công thức mới còn lại hôm nay</div><div className="text-3xl font-bold">{Math.min(newLeft, fresh.length)}<span className="text-base text-slate-400">/{s.settings.newAlgsPerDay}</span></div></div>
        <div className="card !p-4"><div className="text-sm text-slate-500">Đã học / tổng</div><div className="text-3xl font-bold">{learned.length}<span className="text-base text-slate-400">/{ALGS.length}</span></div></div>
      </div>
      <div className="card space-y-3">
        {sets.length === 0 ? (
          <div className="text-sm text-slate-600">Chưa mở bộ công thức nào. Vào <a className="text-indigo-600 underline" href="#/learn">📘 Học Rubik</a>, học bài có công thức (F2L, OLL 2 bước, 2x2…) rồi bấm “Đã học xong” – công thức của bài sẽ xuất hiện ở đây.</div>
        ) : (
          <>
            <div className="text-sm text-slate-600">Bộ đã mở: {sets.map((x) => ALG_SETS[x].name).join(' · ')}</div>
            <button className="btn-primary" disabled={!fresh.length} onClick={() => setSession(fresh.slice(0, Math.max(1, newLeft)))}>▶ Học {Math.min(Math.max(1, newLeft), fresh.length)} công thức mới</button>
          </>
        )}
      </div>
      {learned.length > 0 && (
        <div className="card mt-4">
          <div className="label mb-2">Công thức đã học</div>
          {learned.map((a) => { const r = reviewOf('alg', a.id, s); return <div key={a.id} className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0"><span>{a.name} <span className="font-mono text-xs text-slate-500">{a.alg}</span></span><span className="text-xs text-slate-500">ôn {r.due.slice(8, 10)}/{r.due.slice(5, 7)}</span></div> })}
        </div>
      )}
    </div>
  )
}

function Session({ list, onExit }) {
  const [i, setI] = useState(0)
  const [flip, setFlip] = useState(false)
  const a = list[i]
  const grade = (g) => { scheduleReview('alg', a.id, g, `Công thức: ${a.name}`); logHistory('cube', `Ôn công thức ${a.name}: ${g}/5`); setFlip(false); setI(i + 1) }
  useHotkeys({ ' ': () => a && setFlip(true), 1: () => flip && grade(1), 2: () => flip && grade(3), 3: () => flip && grade(4), 4: () => flip && grade(5) })
  if (!a) return (
    <div><PageHeader title="🎉 Xong lượt ôn công thức" /><div className="card space-y-2"><p className="text-sm text-slate-600">Thẻ “Quên” sẽ quay lại ngày mai. Áp dụng ngay: làm vài lần bấm giờ để dùng công thức trong lúc giải thật.</p><div className="flex gap-2"><button className="btn-primary" onClick={onExit}>Xong</button><a className="btn-ghost" href="#/timer">⏱️ Bấm giờ</a></div></div></div>
  )
  const set = ALG_SETS[a.set]
  return (
    <div>
      <PageHeader title="🧊 Ôn công thức" right={<button className="btn-ghost" onClick={onExit}>Thoát</button>} />
      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500"><span>{i + 1}/{list.length}</span><div className="flex-1"><Progress value={i} max={list.length} /></div></div>
      <div className="card flex flex-col items-center gap-3">
        <div className="text-sm text-slate-500">{set.name}</div>
        <Cube key={a.id + flip} puzzle={set.puzzle} alg={a.alg} asCase stick={set.stick} size={240} controls={flip} />
        {!flip ? (
          <>
            <div className="text-center text-sm text-slate-600">Đây là trường hợp cần giải. Nhớ công thức và <b>làm trên khối thật</b> (xếp khối giống hình bằng cách làm ngược công thức nếu cần).</div>
            <button className="btn-primary" onClick={() => setFlip(true)}>Lật thẻ <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Space</span></button>
          </>
        ) : (
          <>
            <div className="text-lg font-semibold">{a.name}</div>
            <div className="font-mono text-xl text-indigo-700">{a.alg}</div>
            <div className="text-center text-sm text-slate-500">{a.tip}</div>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn-ghost !bg-rose-100 !text-rose-700" onClick={() => grade(1)}>Quên <span className="kbd">1</span></button>
              <button className="btn-ghost" onClick={() => grade(3)}>Khó <span className="kbd">2</span></button>
              <button className="btn-ghost" onClick={() => grade(4)}>Nhớ <span className="kbd">3</span></button>
              <button className="btn-ghost !bg-emerald-100 !text-emerald-700" onClick={() => grade(5)}>Dễ <span className="kbd">4</span></button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

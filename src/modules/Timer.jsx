// BẤM GIỜ RUBIK – xáo ngẫu nhiên theo nước (độ dài như WCA), quan sát 15 giây, thống kê best / ao5 / ao12, +2 / DNF
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore, update, logHistory } from '../lib/store'
import { PageHeader } from '../components/ui'
import { Cube } from '../components/Cube'

const EVENTS = { '222': ['2x2', '2x2x2'], '333': ['3x3', '3x3x3'], '444': ['4x4', '4x4x4'] }
const GOAL = { '222': 20000, '333': 60000, '444': 180000 }

export const fmt = (ms) => {
  if (ms == null) return '—'
  if (!Number.isFinite(ms)) return 'DNF'
  const s = ms / 1000
  return s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}` : s.toFixed(2)
}
export const value = (x) => (x.penalty === 'DNF' ? Infinity : x.t + (x.penalty === '+2' ? 2000 : 0))
export function aoN(list, n) {
  if (list.length < n) return null
  const v = list.slice(0, n).map(value).sort((a, b) => a - b)
  const trim = Math.max(1, Math.round(n * 0.05))
  const mid = v.slice(trim, n - trim)
  return mid.some((x) => !Number.isFinite(x)) ? Infinity : mid.reduce((a, b) => a + b, 0) / mid.length
}

// Xáo ngẫu nhiên theo nước (không lặp mặt / không 3 nước cùng trục liên tiếp), độ dài theo thông lệ WCA
const AXIS = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 }
const SPEC = {
  '222': { n: 11, faces: ['R', 'U', 'F'] },
  '333': { n: 25, faces: ['R', 'L', 'U', 'D', 'F', 'B'] },
  '444': { n: 40, faces: ['R', 'L', 'U', 'D', 'F', 'B', 'Rw', 'Uw', 'Fw'] },
}
export function randomScramble(ev) {
  const { n, faces } = SPEC[ev]
  const out = []
  let prev = null, prev2 = null
  while (out.length < n) {
    const f = faces[Math.floor(Math.random() * faces.length)]
    const base = f[0]
    if (prev && prev === f) continue
    if (prev && prev2 && AXIS[prev[0]] === AXIS[base] && AXIS[prev2[0]] === AXIS[base]) continue
    if (prev && prev[0] === base) continue // R rồi Rw cũng coi như trùng mặt
    out.push(f + ['', "'", '2'][Math.floor(Math.random() * 3)])
    prev2 = prev; prev = f
  }
  return out.join(' ')
}
async function newScramble(ev) { return randomScramble(ev) }

export default function Timer() {
  const solves = useStore((s) => s.solves)
  const inspection = useStore((s) => s.settings.inspection)
  const [ev, setEv] = useState('333')
  const [scramble, setScramble] = useState('')
  const [phase, setPhase] = useState('idle') // idle | holding | ready | inspect | running
  const [shown, setShown] = useState(0)
  const [inspLeft, setInspLeft] = useState(15)
  const [holdOk, setHoldOk] = useState(false)
  const t0 = useRef(0), holdT = useRef(0), raf = useRef(0), inspT = useRef(0), inspStart = useRef(0), penRef = useRef('')
  const list = solves[ev] || []

  const next = useCallback(() => { setScramble(''); newScramble(ev).then(setScramble).catch(() => setScramble('(không tạo được scramble)')) }, [ev])
  useEffect(() => { next() }, [ev])

  const startRun = (fromInspect) => {
    // luật WCA: quan sát quá 15 giây → +2, quá 17 giây → DNF
    const el = fromInspect ? (Date.now() - inspStart.current) / 1000 : 0
    penRef.current = el > 17 ? 'DNF' : el > 15 ? '+2' : ''
    cancelAnimationFrame(raf.current); clearInterval(inspT.current)
    t0.current = performance.now(); setPhase('running')
    const tick = () => { setShown(performance.now() - t0.current); raf.current = requestAnimationFrame(tick) }
    tick()
  }
  const stopRun = () => {
    cancelAnimationFrame(raf.current)
    const t = Math.round(performance.now() - t0.current)
    setShown(t); setPhase('idle')
    const late = penRef.current
    update((s) => { (s.solves[ev] ||= []).unshift({ t, penalty: late, scramble, at: Date.now() }); s.solves[ev] = s.solves[ev].slice(0, 2000) })
    logHistory('cube', `${EVENTS[ev][0]}: ${fmt(t)}${late ? ' ' + late : ''}`)
    next()
  }
  const startInspect = () => {
    setPhase('inspect'); setInspLeft(15)
    const st = Date.now()
    inspStart.current = st
    inspT.current = setInterval(() => setInspLeft(15 - Math.floor((Date.now() - st) / 1000)), 200)
  }

  // Bàn phím: giữ Space ≥ 0.3s rồi thả để bắt đầu; bấm phím bất kỳ để dừng
  const down = useCallback(() => {
    if (phase === 'running') return stopRun()
    if (phase === 'idle' || phase === 'inspect') { holdT.current = Date.now(); setHoldOk(false); setTimeout(() => setHoldOk(true), 300); setPhase((p) => (p === 'inspect' ? 'holding-i' : 'holding')) }
  }, [phase, scramble])
  const up = useCallback(() => {
    if (phase === 'holding' || phase === 'holding-i') {
      if (Date.now() - holdT.current < 300) { setPhase(phase === 'holding-i' ? 'inspect' : 'idle'); return }
      if (phase === 'holding' && inspection) return startInspect()
      startRun(phase === 'holding-i')
    }
  }, [phase, inspection])
  useEffect(() => {
    const kd = (e) => { if (e.target.tagName === 'INPUT' || e.repeat) return; if (e.code === 'Space' || phase === 'running') { e.preventDefault(); down() } }
    const ku = (e) => { if (e.code === 'Space') { e.preventDefault(); up() } }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [down, up, phase])
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearInterval(inspT.current) }, [])

  const holding = phase === 'holding' || phase === 'holding-i'
  const color = phase === 'running' ? 'text-slate-900 dark:text-white' : holding ? (holdOk ? 'text-emerald-600' : 'text-rose-500') : phase === 'inspect' ? 'text-amber-600' : ''
  const best = list.length ? Math.min(...list.map(value)) : null
  const pen = (i, p) => update((s) => { s.solves[ev][i].penalty = s.solves[ev][i].penalty === p ? '' : p })
  const del = (i) => update((s) => { s.solves[ev].splice(i, 1) })

  return (
    <div>
      <PageHeader title="⏱️ Bấm giờ Rubik" subtitle="Giữ Space (điện thoại: chạm giữ vùng đồng hồ) đến khi số chuyển xanh, thả ra để bắt đầu. Bấm phím/chạm bất kỳ để dừng." />
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.entries(EVENTS).map(([k, [l]]) => <button key={k} onClick={() => setEv(k)} className={ev === k ? 'btn-primary' : 'btn-ghost'}>{l}</button>)}
        <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={inspection} onChange={(e) => update((s) => { s.settings.inspection = e.target.checked })} /> Quan sát 15 giây</label>
      </div>
      <div className="card mb-3">
        <div className="label mb-1">Xáo (scramble) – cầm mặt TRẮNG lên trên, XANH LÁ phía trước khi xáo</div>
        <div className="font-mono text-lg leading-relaxed break-words">{scramble || '⏳ đang tạo…'}</div>
        <button className="mt-1 text-xs text-indigo-600 underline" onClick={next}>Đổi scramble khác</button>
      </div>
      <div
        className="card mb-3 flex select-none flex-col items-center justify-center py-10"
        style={{ touchAction: 'none' }}
        onTouchStart={(e) => { e.preventDefault(); down() }}
        onTouchEnd={(e) => { e.preventDefault(); up() }}
      >
        <div className={`font-mono text-6xl md:text-8xl font-bold tabular-nums ${color}`}>
          {phase === 'inspect' || phase === 'holding-i' ? (inspLeft > 0 ? inspLeft : inspLeft > -2 ? '+2' : 'DNF') : fmt(phase === 'idle' && !list.length ? 0 : phase === 'idle' ? value(list[0]) : shown)}
        </div>
        <div className="mt-2 text-sm text-slate-500">{phase === 'inspect' ? 'Quan sát rồi giữ Space để bắt đầu giải' : phase === 'running' ? 'Bấm phím bất kỳ để dừng' : 'Giữ Space để chuẩn bị'}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="card">
          <div className="mb-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {[['Tốt nhất', best], ['ao5', aoN(list, 5)], ['ao12', aoN(list, 12)], ['Số lần', list.length]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-2"><div className="text-xs text-slate-500">{k}</div><div className="font-mono text-lg font-semibold">{k === 'Số lần' ? v : fmt(v)}</div></div>
            ))}
          </div>
          <div className="text-xs text-slate-500">Mục tiêu gợi ý {EVENTS[ev][0]}: dưới {fmt(GOAL[ev])} trung bình ao12. ao5 = trung bình 5 lần gần nhất, bỏ lần nhanh & chậm nhất.</div>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {list.slice(0, 50).map((x, i) => (
              <div key={x.at} className="flex items-center gap-2 border-b border-slate-100 py-1 text-sm last:border-0">
                <span className="w-8 text-slate-400">{list.length - i}.</span>
                <span className="w-20 font-mono font-semibold">{fmt(value(x))}{x.penalty === '+2' && '+'}</span>
                <span className="flex-1 truncate font-mono text-xs text-slate-400" title={x.scramble}>{x.scramble}</span>
                <button className={`chip ${x.penalty === '+2' ? 'bg-amber-200' : 'bg-slate-100'}`} onClick={() => pen(i, '+2')}>+2</button>
                <button className={`chip ${x.penalty === 'DNF' ? 'bg-rose-200' : 'bg-slate-100'}`} onClick={() => pen(i, 'DNF')}>DNF</button>
                <button className="text-slate-400 hover:text-rose-600" onClick={() => del(i)}>✕</button>
              </div>
            ))}
          </div>
        </div>
        {scramble && !scramble.startsWith('(') && <div className="card flex flex-col items-center"><div className="label mb-1">Trạng thái sau khi xáo</div><Cube puzzle={EVENTS[ev][1]} setupAlg={scramble} view="2D" controls={false} size={200} /></div>}
      </div>
    </div>
  )
}

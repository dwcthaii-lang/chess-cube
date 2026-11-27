import { useEffect, useState } from 'react'
import { update, useStore, getState } from './lib/store'
import { today } from './lib/date'
import { dueReviews } from './lib/review'
import Dashboard from './modules/Dashboard'
import Review from './modules/Review'
import Scan from './modules/Scan'
import Puzzles from './modules/Puzzles'
import Calc from './modules/Calc'
import Play from './modules/Play'
import Timer from './modules/Timer'
import Learn from './modules/Learn'
import Algs from './modules/Algs'
import Settings from './modules/Settings'

const NAV = [
  { path: '', label: 'Tổng quan', short: 'Tổng quan', icon: '📊', main: true },
  { path: 'review', label: 'Ôn tập hôm nay', short: 'Ôn tập', icon: '📅', main: true },
  { group: '♟️ Cờ vua' },
  { path: 'scan', label: 'Quét nguy hiểm', short: 'Quét', icon: '🔍', main: true },
  { path: 'puzzles', label: 'Thế cờ chiến thuật', short: 'Thế cờ', icon: '🧩', main: true },
  { path: 'calc', label: 'Luyện tính nước', short: 'Tính nước', icon: '🧠' },
  { path: 'play', label: 'Đánh với máy', short: 'Đánh máy', icon: '🤖' },
  { group: '🧊 Rubik' },
  { path: 'timer', label: 'Bấm giờ', short: 'Bấm giờ', icon: '⏱️', main: true },
  { path: 'learn', label: 'Học Rubik', short: 'Học Rubik', icon: '📘' },
  { path: 'algs', label: 'Ôn công thức', short: 'Công thức', icon: '🧊' },
  { group: '' },
  { path: 'settings', label: 'Cài đặt', short: 'Cài đặt', icon: '⚙️' },
]
const CHESS = ['scan', 'puzzles', 'calc', 'play']
const CUBE = ['timer', 'learn', 'algs']

function useHashRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, '').split('/')
  const [parts, setParts] = useState(get())
  useEffect(() => {
    const h = () => { setParts(get()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return parts
}

// Đếm thời gian luyện THỰC TẾ (tab đang mở và có thao tác trong 90 giây gần nhất)
function useActiveTime(module) {
  useEffect(() => {
    if (!module) return
    let last = Date.now()
    const mark = () => (last = Date.now())
    const evs = ['keydown', 'mousedown', 'mousemove', 'touchstart']
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - last > 90000) return
      update((s) => { const d = today(); const rec = s.time[d] || (s.time[d] = { total: 0 }); rec.total = (rec.total || 0) + 5; rec[module] = (rec[module] || 0) + 5 })
    }, 5000)
    return () => { clearInterval(t); evs.forEach((e) => window.removeEventListener(e, mark)) }
  }, [module])
}

export const countDue = (s) => dueReviews(s).length

function useReminder() {
  useEffect(() => {
    const check = () => {
      const s = getState(), st = s.settings, n = countDue(s)
      if ('setAppBadge' in navigator) (n ? navigator.setAppBadge(n) : navigator.clearAppBadge?.())?.catch?.(() => {})
      if (!st.reminderOn || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (hhmm < st.reminderTime || s.lastNotified === today() || n === 0) return
      update((d) => { d.lastNotified = today() })
      try { const note = new Notification('📅 Cờ & Rubik – đến giờ ôn', { body: `Bạn có ${n} mục cần ôn hôm nay.`, icon: './icon-192.png', tag: 'cc-review' }); note.onclick = () => { window.focus(); window.location.hash = '#/review' } } catch {}
    }
    check()
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [])
}

function useTheme(theme) {
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq?.matches))
    apply()
    mq?.addEventListener?.('change', apply)
    return () => mq?.removeEventListener?.('change', apply)
  }, [theme])
}

export default function App() {
  const [page, param] = useHashRoute()
  const s = useStore()
  const due = countDue(s)
  const [moreOpen, setMoreOpen] = useState(false)
  useReminder()
  useTheme(s.settings.theme || 'system')
  useEffect(() => setMoreOpen(false), [page])
  useActiveTime(CHESS.includes(page) ? 'chess' : CUBE.includes(page) ? 'cube' : null)
  const dark = document.documentElement.classList.contains('dark')

  let content
  switch (page) {
    case 'review': content = <Review />; break
    case 'scan': content = <Scan />; break
    case 'puzzles': content = <Puzzles key={param || 'x'} mode={param} />; break
    case 'calc': content = <Calc key={param || 'x'} mode={param} />; break
    case 'play': content = <Play />; break
    case 'timer': content = <Timer />; break
    case 'learn': content = <Learn key={param || 'x'} id={param} />; break
    case 'algs': content = <Algs key={param || 'x'} mode={param} />; break
    case 'settings': content = <Settings />; break
    default: content = <Dashboard />
  }
  const items = NAV.filter((n) => n.path !== undefined)
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-56 md:min-h-screen md:sticky md:top-0 md:h-screen md:overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 px-5 py-3 md:py-5">
          <div><div className="text-lg font-bold">♟️ Cờ & Rubik 🧊</div><div className="text-xs text-slate-500">Luyện trí não mỗi ngày</div></div>
          <button onClick={() => update((d) => { d.settings.theme = dark ? 'light' : 'dark' })} className="rounded-lg px-2 py-1 text-lg hover:bg-slate-100" title="Sáng / tối">{dark ? '☀️' : '🌙'}</button>
        </div>
        <nav className="hidden md:flex md:flex-col px-3 pb-3 gap-0.5">
          {NAV.map((n, i) => n.group !== undefined ? (
            n.group ? <div key={i} className="mt-3 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{n.group}</div> : <div key={i} className="mt-2" />
          ) : (
            <a key={n.path} href={`#/${n.path}`} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${(page || '') === n.path ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span>{n.icon}</span><span className="flex-1">{n.label}</span>
              {n.path === 'review' && due > 0 && <span className="chip bg-rose-100 text-rose-700">{due}</span>}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-4 pt-5 pb-24 md:px-10 md:py-8 max-w-6xl">{content}</main>
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 inset-x-3 rounded-2xl bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {items.filter((n) => !n.main).map((n) => <a key={n.path} href={`#/${n.path}`} className="flex items-center gap-3 rounded-xl px-4 py-3 text-base hover:bg-slate-50"><span>{n.icon}</span>{n.label}</a>)}
          </div>
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.filter((n) => n.main).map((n) => (
          <a key={n.path} href={`#/${n.path}`} className={`relative flex flex-col items-center py-2 text-[10px] ${(page || '') === n.path ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>
            <span className="text-lg leading-none">{n.icon}</span><span className="mt-1">{n.short}</span>
            {n.path === 'review' && due > 0 && <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1 text-[9px] text-white">{due}</span>}
          </a>
        ))}
        <button onClick={() => setMoreOpen((x) => !x)} className="flex flex-col items-center py-2 text-[10px] text-slate-500"><span className="text-lg leading-none">☰</span><span className="mt-1">Thêm</span></button>
      </nav>
    </div>
  )
}

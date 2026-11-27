import { useEffect, useState } from 'react'

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Progress({ value, max, color = 'bg-indigo-500' }) {
  const pct = Math.min(100, Math.round(((value || 0) / Math.max(1, max)) * 100))
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Shortcuts({ items }) {
  return (
    <div className="hidden md:flex flex-wrap gap-3 text-xs text-slate-500">
      {items.map(([k, label]) => (
        <span key={k}><span className="kbd">{k}</span> {label}</span>
      ))}
    </div>
  )
}

export function Stat({ label, value, sub, tone = '' }) {
  return (
    <div className={`card !p-4 ${tone}`}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  return <span className="font-mono">{Math.floor((now - since) / 1000)}s</span>
}

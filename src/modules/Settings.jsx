import { useRef, useState } from 'react'
import { useStore, update, getState, replaceState, resetAll } from '../lib/store'
import { PageHeader } from '../components/ui'

function Field({ label, hint, children }) {
  return <label className="block space-y-1"><div className="text-sm font-medium">{label}</div>{children}{hint && <div className="text-xs text-slate-500">{hint}</div>}</label>
}

export default function Settings() {
  const s = useStore((x) => x.settings)
  const set = (p) => update((d) => Object.assign(d.settings, p))
  const file = useRef(null)
  const [msg, setMsg] = useState('')
  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 1)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `co-rubik-sao-luu-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  const importData = async (f) => {
    try { const d = JSON.parse(await f.text()); if (!d.reviews || !d.settings) throw new Error(); replaceState(d); setMsg('✅ Đã nhập dữ liệu.') } catch { setMsg('❌ File không hợp lệ.') }
  }
  const enableReminder = async (on) => {
    if (on && typeof Notification !== 'undefined' && Notification.permission !== 'granted') await Notification.requestPermission()
    set({ reminderOn: on })
  }
  return (
    <div className="space-y-4">
      <PageHeader title="⚙️ Cài đặt" />
      <div className="card space-y-3">
        <div className="label">Giao diện</div>
        <div className="flex flex-wrap gap-2">{[['light', '☀️ Sáng'], ['dark', '🌙 Tối'], ['system', '🖥️ Theo máy']].map(([k, l]) => <button key={k} onClick={() => set({ theme: k })} className={s.theme === k ? 'btn-primary' : 'btn-ghost'}>{l}</button>)}</div>
      </div>
      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Mục tiêu mỗi ngày: ${s.dailyGoalMin} phút`}><input type="range" min="10" max="90" step="5" value={s.dailyGoalMin} onChange={(e) => set({ dailyGoalMin: Number(e.target.value) })} className="w-full" /></Field>
        <Field label={`Thế cờ MỚI/ngày: ${s.newPuzzlesPerDay}`} hint="Bài ôn luôn được ưu tiên trước"><input type="range" min="3" max="40" value={s.newPuzzlesPerDay} onChange={(e) => set({ newPuzzlesPerDay: Number(e.target.value) })} className="w-full" /></Field>
        <Field label={`Thế cờ tướng MỚI/ngày: ${s.newXqPerDay ?? 10}`} hint="Bài ôn luôn được ưu tiên trước"><input type="range" min="3" max="40" value={s.newXqPerDay ?? 10} onChange={(e) => set({ newXqPerDay: Number(e.target.value) })} className="w-full" /></Field>
        <Field label={`Công thức Rubik MỚI/ngày: ${s.newAlgsPerDay}`} hint="2–4 là vừa để nhớ lâu"><input type="range" min="1" max="10" value={s.newAlgsPerDay} onChange={(e) => set({ newAlgsPerDay: Number(e.target.value) })} className="w-full" /></Field>
      </div>
      <div className="card space-y-3">
        <div className="label">📅 Nhắc ôn hằng ngày</div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.reminderOn} onChange={(e) => enableReminder(e.target.checked)} /> Thông báo lúc</label>
          <input type="time" className="input !w-32" value={s.reminderTime} onChange={(e) => set({ reminderTime: e.target.value })} />
        </div>
        <p className="text-xs text-slate-500">Thông báo hiện khi web/app đang mở (kể cả tab nền).</p>
      </div>
      <div className="card space-y-3">
        <div className="label">Dữ liệu (lưu trong trình duyệt, riêng với các app học ngoại ngữ)</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportData}>⬇ Xuất file sao lưu</button>
          <button className="btn-ghost" onClick={() => file.current.click()}>⬆ Nhập file sao lưu</button>
          <input ref={file} type="file" accept=".json" className="hidden" onChange={(e) => e.target.files[0] && importData(e.target.files[0])} />
          <button className="btn-ghost !text-rose-600" onClick={() => confirm('Xoá TOÀN BỘ tiến độ cờ & Rubik?') && resetAll()}>🗑 Xoá dữ liệu</button>
        </div>
        {msg && <div className="text-sm">{msg}</div>}
      </div>
      <div className="card text-xs text-slate-500 space-y-1">
        <div>Máy cờ: Stockfish 19 (GPL-3, bản WASM của nmrugg/stockfish.js). Bàn cờ: Chessground (Lichess, GPL-3). Quân cờ: bộ cburnett. Thế cờ online: Lichess puzzle API (CC0).</div>
        <div>Cờ tướng: luật, ký hiệu và máy đánh tự viết (src/lib/xiangqi.js); thế cờ sinh bằng máy, chiếu hết được kiểm tra vét cạn.</div>
        <div>Rubik: cubing.js (xáo chuẩn WCA & khối 3D).</div>
      </div>
    </div>
  )
}

// Khối Rubik 3D / 2D có hoạt ảnh (cubing.js <twisty-player>) – tải lười để trang khác nhẹ
import { useEffect, useRef, useState } from 'react'

let loading = null
const loadTwisty = () => (loading ||= import('cubing/twisty'))

// puzzle: '3x3x3' | '2x2x2' | '4x4x4'; alg: công thức; setup: 'case' = hiện trường hợp cần giải (nghịch đảo công thức)
// stick: 'OLL' | 'PLL' | 'F2L' | 'full'; view: '3D' | 'experimental-2D-LL' | 'PG3D'
export function Cube({ puzzle = '3x3x3', alg = '', setupAlg = '', asCase = false, stick = 'full', view = '3D', controls = true, size = 220, tempo = 1 }) {
  const box = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { loadTwisty().then(() => setReady(true)) }, [])
  useEffect(() => {
    if (!ready || !box.current) return
    const el = document.createElement('twisty-player')
    el.setAttribute('puzzle', puzzle)
    el.setAttribute('alg', alg)
    // Trường hợp công thức: cầm VÀNG trên, TRẮNG dưới như khi giải thật (cubing.js mặc định trắng trên → xoay z2)
    const setup = asCase ? ('z2 ' + (setupAlg || '')).trim() : setupAlg
    if (setup) el.setAttribute('experimental-setup-alg', setup)
    if (asCase) el.setAttribute('experimental-setup-anchor', 'end')
    if (stick && stick !== 'full') el.setAttribute('experimental-stickering', stick)
    el.setAttribute('visualization', view)
    el.setAttribute('background', 'none')
    el.setAttribute('control-panel', controls ? 'bottom-row' : 'none')
    el.setAttribute('hint-facelets', 'none')
    el.setAttribute('tempo-scale', String(tempo))
    el.style.width = size + 'px'
    el.style.height = size + (controls ? 40 : 0) + 'px'
    box.current.innerHTML = ''
    box.current.appendChild(el)
    return () => { if (box.current) box.current.innerHTML = '' }
  }, [ready, puzzle, alg, setupAlg, asCase, stick, view, controls, size, tempo])
  return <div ref={box} className="flex items-center justify-center" style={{ minHeight: size }}>{!ready && <span className="text-xs text-slate-400">Đang tải khối Rubik…</span>}</div>
}

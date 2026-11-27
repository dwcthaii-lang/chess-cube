// Phím tắt đơn giản: useHotkeys({ h: fn, Enter: fn, ' ': fn ... })
import { useEffect, useRef } from 'react'

function isTyping(e) {
  const t = e.target
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

export function useHotkeys(map, enabled = true) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e) || e.repeat) return
      const k = e.key.length === 1 && e.key !== ' ' ? e.key.toLowerCase() : e.key
      const fn = ref.current[k]
      if (fn) { e.preventDefault(); fn(e) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

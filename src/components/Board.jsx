// Bàn cờ dùng Chessground (giao diện bàn cờ của Lichess) – kéo thả / bấm để đi, vẽ mũi tên, đánh dấu ô
import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'

// props:
//  fen, orientation ('white'|'black'), turnColor, dests (Map) → cho phép đi; null → chỉ xem
//  onMove(from, to), onSelect(square) (chế độ đánh dấu ô), lastMove [from,to], check (bool/color)
//  shapes [{orig, dest?, brush}], marks: Set(ô) tô vòng tròn, viewOnly
export function Board({ fen, orientation = 'white', turnColor, dests, onMove, onSelect, lastMove, check, shapes = [], marks, viewOnly = false, coordinates = true }) {
  const el = useRef(null)
  const cg = useRef(null)
  const cb = useRef({ onMove, onSelect })
  cb.current = { onMove, onSelect }

  useEffect(() => {
    cg.current = Chessground(el.current, {
      fen, orientation, coordinates, animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      draggable: { enabled: true, showGhost: true },
      drawable: { enabled: true, visible: true, defaultSnapToValidMove: false },
      events: {
        move: (o, d) => cb.current.onMove?.(o, d),
        select: (k) => cb.current.onSelect?.(k),
      },
    })
    return () => cg.current?.destroy()
  }, [])

  useEffect(() => {
    if (!cg.current) return
    const markShapes = marks ? [...marks].map((sq) => ({ orig: sq, brush: 'blue' })) : []
    cg.current.set({
      fen, orientation, turnColor, lastMove, check, viewOnly,
      movable: dests && !onSelect ? { free: false, color: turnColor, dests, showDests: true } : { free: false, color: undefined, dests: new Map() },
      selectable: { enabled: !!dests || !!onSelect },
      draggable: { enabled: !!dests && !onSelect },
      drawable: { autoShapes: [...shapes, ...markShapes] },
    })
  }, [fen, orientation, turnColor, dests, lastMove, check, shapes, marks, viewOnly, onSelect])

  return (
    <div className="cg-wrap-outer w-full max-w-[min(92vw,560px)]">
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div ref={el} className="absolute inset-0" />
      </div>
    </div>
  )
}

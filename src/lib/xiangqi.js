// CỜ TƯỚNG: luật đi, ký hiệu kiểu Việt Nam, phân tích cho người học và máy đánh (alpha-beta).
// Không phụ thuộc thư viện nào → dùng được cả trong trình duyệt, Web Worker và Node (script sinh thế cờ).
//
// Bàn cờ 9 cột (a–i) × 10 hàng (0–9). Hàng 0 là hàng cuối của bên Đỏ (đi trước, ký hiệu 'w'),
// hàng 9 là hàng cuối của bên Đen ('b'). Ô = cột + hàng, vd "e0" là chỗ Tướng Đỏ. Nước đi "h2e2".
// FEN theo chuẩn UCCI: chữ HOA = Đỏ, thường = Đen. K Tướng, A Sĩ, B Tượng, N Mã, R Xe, C Pháo, P Tốt.

export const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'

// Mã quân: 1..7 Đỏ, 9..15 Đen (= 8 + loại)
export const K = 1, A = 2, B = 3, N = 4, R = 5, C = 6, P = 7
const LETTER = ['', 'k', 'a', 'b', 'n', 'r', 'c', 'p']
const FROM_LETTER = { k: K, a: A, b: B, n: N, r: R, c: C, p: P, e: B, h: N }
export const VAL = [0, 0, 200, 200, 400, 900, 450, 100] // giá trị thô theo loại (Tướng tính riêng)
export const NAME_VI = { k: 'Tướng', a: 'Sĩ', b: 'Tượng', n: 'Mã', r: 'Xe', c: 'Pháo', p: 'Tốt' }
export const SHORT_VI = { k: 'Tg', a: 'S', b: 'T', n: 'M', r: 'X', c: 'P', p: 'B' }
export const colorVi = (c) => (c === 'w' ? 'Đỏ' : 'Đen')
export const opp = (c) => (c === 'w' ? 'b' : 'w')

const typeOf = (p) => p & 7
const sideOf = (p) => (p > 8 ? 1 : 0) // 0 Đỏ, 1 Đen
const S2C = ['w', 'b']
const C2S = { w: 0, b: 1 }

export const sqName = (s) => 'abcdefghi'[s % 9] + ((s / 9) | 0)
export const sqIndex = (n) => (n.charCodeAt(1) - 48) * 9 + (n.charCodeAt(0) - 97)
const mv = (from, to) => from | (to << 7)
const mFrom = (m) => m & 127
const mTo = (m) => m >> 7
export const moveUci = (m) => sqName(mFrom(m)) + sqName(mTo(m))
export const parseUci = (u) => mv(sqIndex(u.slice(0, 2)), sqIndex(u.slice(2, 4)))

// ───── Zobrist ─────
let seed = 0x9e3779b9
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0 }
const ZL = [], ZH = []
for (let p = 0; p < 16; p++) { ZL.push(new Uint32Array(90)); ZH.push(new Uint32Array(90)); for (let s = 0; s < 90; s++) { ZL[p][s] = rnd(); ZH[p][s] = rnd() } }
const ZSL = rnd(), ZSH = rnd()

// ───── Bảng điểm vị trí (nhìn từ phía chủ quân, hàng 0 = hàng cuối của mình) ─────
const PST = []
PST[P] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, -2, 0, 4, 0, -2, 0, 0,
  2, 0, 8, 0, 8, 0, 8, 0, 2,
  6, 12, 18, 18, 20, 18, 18, 12, 6,
  10, 20, 30, 34, 40, 34, 30, 20, 10,
  14, 26, 42, 60, 80, 60, 42, 26, 14,
  18, 36, 56, 80, 120, 80, 56, 36, 18,
  0, 3, 6, 9, 12, 9, 6, 3, 0,
]
PST[N] = [
  0, -4, 0, 0, 0, 0, 0, -4, 0,
  0, 2, 4, 4, -10, 4, 4, 2, 0,
  4, 2, 8, 8, 4, 8, 8, 2, 4,
  2, 6, 8, 6, 10, 6, 8, 6, 2,
  4, 12, 16, 14, 12, 14, 16, 12, 4,
  6, 16, 14, 18, 16, 18, 14, 16, 6,
  8, 24, 18, 24, 20, 24, 18, 24, 8,
  12, 14, 16, 20, 18, 20, 16, 14, 12,
  4, 10, 28, 16, 8, 16, 28, 10, 4,
  4, 8, 16, 12, 4, 12, 16, 8, 4,
]
PST[R] = [
  -2, 10, 6, 14, 12, 14, 6, 10, -2,
  8, 4, 8, 16, 8, 16, 8, 4, 8,
  4, 8, 6, 14, 12, 14, 6, 8, 4,
  6, 10, 8, 14, 14, 14, 8, 10, 6,
  12, 16, 14, 20, 20, 20, 14, 16, 12,
  12, 14, 12, 18, 18, 18, 12, 14, 12,
  12, 18, 16, 22, 22, 22, 16, 18, 12,
  12, 12, 12, 18, 18, 18, 12, 12, 12,
  16, 20, 18, 24, 26, 24, 18, 20, 16,
  14, 14, 12, 18, 16, 18, 12, 14, 14,
]
PST[C] = [
  0, 0, 2, 6, 6, 6, 2, 0, 0,
  0, 2, 4, 6, 6, 6, 4, 2, 0,
  4, 0, 8, 6, 10, 6, 8, 0, 4,
  0, 0, 0, 2, 4, 2, 0, 0, 0,
  -2, 0, 4, 2, 6, 2, 4, 0, -2,
  0, 0, 0, 2, 8, 2, 0, 0, 0,
  0, 0, -2, 4, 10, 4, -2, 0, 0,
  2, 2, 0, -10, -8, -10, 0, 2, 2,
  2, 2, 0, -4, -14, -4, 0, 2, 2,
  6, 4, 0, -10, -12, -10, 0, 4, 6,
]
PST[A] = new Array(90).fill(0); PST[A][13] = 4
PST[B] = new Array(90).fill(0); PST[B][22] = 4; PST[B][18] = -2; PST[B][26] = -2
PST[K] = new Array(90).fill(0); PST[K][4] = 4; PST[K][13] = -4; PST[K][22] = -10
const ownIdx = (side, s) => (side === 0 ? s : (9 - ((s / 9) | 0)) * 9 + (s % 9))
const PSQ = [] // PSQ[piece][sq] = giá trị + vị trí (theo góc Đỏ: Đỏ dương, Đen âm)
for (let p = 0; p < 16; p++) {
  PSQ.push(new Int16Array(90))
  const t = typeOf(p)
  if (!t || p === 8) continue
  const side = sideOf(p)
  for (let s = 0; s < 90; s++) PSQ[p][s] = (VAL[t] + PST[t][ownIdx(side, s)]) * (side === 0 ? 1 : -1)
}

const inPalace = (side, r, f) => f >= 3 && f <= 5 && (side === 0 ? r >= 0 && r <= 2 : r >= 7 && r <= 9)
const ownHalf = (side, r) => (side === 0 ? r <= 4 : r >= 5)

const KDIR = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const ADIR = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
const NDIR = [[2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0], [1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1]] // dr, df, chân (dr, df)

export const MATE = 30000

export class Position {
  constructor(fen = START_FEN) { this.load(fen) }

  load(fen) {
    const [rows, turn] = fen.trim().split(/\s+/)
    this.board = new Int8Array(90)
    this.king = [-1, -1]
    const ranks = rows.split('/')
    if (ranks.length !== 10) throw new Error('FEN cờ tướng phải có 10 hàng')
    ranks.forEach((row, i) => {
      const r = 9 - i
      let f = 0
      for (const ch of row) {
        if (/\d/.test(ch)) { f += Number(ch); continue }
        const t = FROM_LETTER[ch.toLowerCase()]
        if (!t || f > 8) throw new Error('FEN lỗi: ' + ch)
        const p = t + (ch === ch.toLowerCase() ? 8 : 0)
        this.board[r * 9 + f] = p
        if (t === K) this.king[sideOf(p)] = r * 9 + f
        f++
      }
    })
    if (this.king[0] < 0 || this.king[1] < 0) throw new Error('Thiếu Tướng')
    this.turn = turn === 'b' ? 1 : 0
    this.stack = []
    this.computeHash()
    this.hist = [] // hash các thế đã qua (để phát hiện lặp)
    return this
  }

  computeHash() {
    let lo = 0, hi = 0, sc = 0
    for (let s = 0; s < 90; s++) { const p = this.board[s]; if (p) { lo ^= ZL[p][s]; hi ^= ZH[p][s]; sc += PSQ[p][s] } }
    if (this.turn) { lo ^= ZSL; hi ^= ZSH }
    this.lo = lo >>> 0; this.hi = hi >>> 0; this.score = sc
  }

  fen() {
    const rows = []
    for (let r = 9; r >= 0; r--) {
      let row = '', e = 0
      for (let f = 0; f < 9; f++) {
        const p = this.board[r * 9 + f]
        if (!p) { e++; continue }
        if (e) { row += e; e = 0 }
        const l = LETTER[typeOf(p)]
        row += sideOf(p) === 0 ? l.toUpperCase() : l
      }
      if (e) row += e
      rows.push(row)
    }
    return `${rows.join('/')} ${S2C[this.turn]} - - 0 1`
  }

  clone() { const p = new Position(this.fen()); p.hist = [...this.hist]; return p }
  turnColor() { return S2C[this.turn] }
  get(sq) { const p = this.board[typeof sq === 'string' ? sqIndex(sq) : sq]; return p ? { type: LETTER[typeOf(p)], color: S2C[sideOf(p)] } : null }

  // ── Sinh nước (giả hợp lệ) cho bên `side` ──
  gen(side = this.turn, capturesOnly = false) {
    const b = this.board, out = []
    const own = (p) => p && sideOf(p) === side
    const add = (from, to) => { const t = b[to]; if (t && sideOf(t) === side) return; if (capturesOnly && !t) return; out.push(mv(from, to)) }
    for (let s = 0; s < 90; s++) {
      const p = b[s]
      if (!p || sideOf(p) !== side) continue
      const r = (s / 9) | 0, f = s % 9, t = typeOf(p)
      if (t === K) {
        for (const [dr, df] of KDIR) { const rr = r + dr, ff = f + df; if (inPalace(side, rr, ff)) add(s, rr * 9 + ff) }
      } else if (t === A) {
        for (const [dr, df] of ADIR) { const rr = r + dr, ff = f + df; if (inPalace(side, rr, ff)) add(s, rr * 9 + ff) }
      } else if (t === B) {
        for (const [dr, df] of ADIR) {
          const rr = r + 2 * dr, ff = f + 2 * df
          if (rr < 0 || rr > 9 || ff < 0 || ff > 8 || !ownHalf(side, rr)) continue
          if (b[(r + dr) * 9 + f + df]) continue // mắc mắt tượng
          add(s, rr * 9 + ff)
        }
      } else if (t === N) {
        for (const [dr, df, lr, lf] of NDIR) {
          const rr = r + dr, ff = f + df
          if (rr < 0 || rr > 9 || ff < 0 || ff > 8) continue
          if (b[(r + lr) * 9 + f + lf]) continue // cản chân mã
          add(s, rr * 9 + ff)
        }
      } else if (t === R || t === C) {
        for (const [dr, df] of KDIR) {
          let rr = r + dr, ff = f + df, screen = false
          while (rr >= 0 && rr <= 9 && ff >= 0 && ff <= 8) {
            const to = rr * 9 + ff, q = b[to]
            if (t === R) {
              if (!q) { if (!capturesOnly) out.push(mv(s, to)) } else { if (!own(q)) out.push(mv(s, to)); break }
            } else if (!screen) {
              if (!q) { if (!capturesOnly) out.push(mv(s, to)) } else screen = true
            } else if (q) { if (!own(q)) out.push(mv(s, to)); break }
            rr += dr; ff += df
          }
        }
      } else if (t === P) {
        const fwd = side === 0 ? 1 : -1
        const rr = r + fwd
        if (rr >= 0 && rr <= 9) add(s, rr * 9 + f)
        if (!ownHalf(side, r)) { if (f > 0) add(s, s - 1); if (f < 8) add(s, s + 1) }
      }
    }
    return out
  }

  // Tướng của `side` có đang bị chiếu không (kể cả hai Tướng đối mặt)
  inCheck(side = this.turn) {
    const b = this.board, k = this.king[side], r = (k / 9) | 0, f = k % 9
    const e = side === 0 ? 8 : 0 // cộng vào loại để ra quân đối phương
    for (const [dr, df] of KDIR) {
      let rr = r + dr, ff = f + df, screen = false
      while (rr >= 0 && rr <= 9 && ff >= 0 && ff <= 8) {
        const q = b[rr * 9 + ff]
        if (q) {
          if (!screen) {
            if (q === R + e || (df === 0 && q === K + e)) return true
            screen = true
          } else { if (q === C + e) return true; break }
        }
        rr += dr; ff += df
      }
    }
    for (const [dr, df, lr, lf] of NDIR) {
      // Mã đối phương ở k - (dr,df) đi (dr,df) tới k; chân của nó nằm cạnh nó
      const hr = r - dr, hf = f - df
      if (hr < 0 || hr > 9 || hf < 0 || hf > 8) continue
      if (b[hr * 9 + hf] !== N + e) continue
      if (!b[(hr + lr) * 9 + hf + lf]) return true
    }
    const fwd = side === 0 ? 1 : -1 // Tốt đối phương đứng ngay trước mặt Tướng hoặc ngang
    const pr = r + fwd
    if (pr >= 0 && pr <= 9 && b[pr * 9 + f] === P + e) return true
    if (f > 0 && b[k - 1] === P + e) return true
    if (f < 8 && b[k + 1] === P + e) return true
    return false
  }

  make(m) {
    const from = mFrom(m), to = mTo(m), b = this.board, p = b[from], cap = b[to]
    this.stack.push({ m, cap, lo: this.lo, hi: this.hi, score: this.score })
    this.hist.push(this.lo)
    let lo = this.lo ^ ZL[p][from] ^ ZL[p][to] ^ ZSL, hi = this.hi ^ ZH[p][from] ^ ZH[p][to] ^ ZSH
    this.score += PSQ[p][to] - PSQ[p][from]
    if (cap) { lo ^= ZL[cap][to]; hi ^= ZH[cap][to]; this.score -= PSQ[cap][to] }
    b[to] = p; b[from] = 0
    if (typeOf(p) === K) this.king[sideOf(p)] = to
    this.lo = lo >>> 0; this.hi = hi >>> 0
    this.turn ^= 1
  }

  unmake() {
    const u = this.stack.pop(), from = mFrom(u.m), to = mTo(u.m), b = this.board, p = b[to]
    b[from] = p; b[to] = u.cap
    if (typeOf(p) === K) this.king[sideOf(p)] = from
    this.lo = u.lo; this.hi = u.hi; this.score = u.score
    this.hist.pop()
    this.turn ^= 1
  }

  isLegal(m) {
    const side = sideOf(this.board[mFrom(m)])
    this.make(m)
    const ok = !this.inCheck(side)
    this.unmake()
    return ok
  }

  legal(side = this.turn) { return this.gen(side).filter((m) => this.isLegal(m)) }
  hasLegal(side = this.turn) { for (const m of this.gen(side)) if (this.isLegal(m)) return true; return false }

  // Luật cờ tướng: hết nước đi (bị chiếu hết hoặc bị "vây chết") là THUA
  isMate() { return !this.hasLegal(this.turn) }
  givesCheck(m) { this.make(m); const c = this.inCheck(this.turn); this.unmake(); return c }

  // Lặp thế 3 lần (đơn giản hoá luật bắt lặp) → hoà
  repetitions() { let n = 0; for (let i = this.hist.length - 2; i >= 0; i -= 2) if (this.hist[i] === this.lo) n++; return n }

  moveByUci(u) {
    const m = parseUci(u)
    const p = this.board[mFrom(m)]
    if (!p || sideOf(p) !== this.turn) return null
    if (!this.gen().includes(m) || !this.isLegal(m)) return null
    const info = { from: u.slice(0, 2), to: u.slice(2, 4), piece: LETTER[typeOf(p)], color: S2C[this.turn], captured: this.board[mTo(m)] ? LETTER[typeOf(this.board[mTo(m)])] : null, vi: moveVi(this, m) }
    this.make(m)
    return info
  }
}

// ───── Ký hiệu nước đi kiểu Việt Nam: "P2-5" (Pháo 2 bình 5), "M8.7" (Mã 8 tiến 7), "X1/1" (Xe 1 thoái 1) ─────
// Cột đánh số 1–9 từ PHẢI sang TRÁI theo góc nhìn của bên đi. "." tiến, "/" thoái, "-" bình (đi ngang).
export const fileNo = (side, f) => (side === 0 ? 9 - f : f + 1)
export function moveVi(pos, m) {
  const from = mFrom(m), to = mTo(m), p = pos.board[from], t = typeOf(p), side = sideOf(p)
  const fr = (from / 9) | 0, ff = from % 9, tr = (to / 9) | 0, tf = to % 9
  const fwd = side === 0 ? tr - fr : fr - tr
  let name = SHORT_VI[LETTER[t]]
  // hai quân cùng loại trên cùng một cột → "t" (trước) / "s" (sau)
  const same = []
  for (let r = 0; r < 10; r++) if (pos.board[r * 9 + ff] === p) same.push(r)
  let fileLabel = String(fileNo(side, ff))
  if (same.length >= 2 && t !== A && t !== B) {
    const order = side === 0 ? [...same].sort((a, b2) => b2 - a) : [...same].sort((a, b2) => a - b2)
    const idx = order.indexOf(fr)
    fileLabel = same.length === 2 ? (idx === 0 ? 't' : 's') : String(idx + 1)
  }
  let act, num
  if (fwd === 0) { act = '-'; num = fileNo(side, tf) }
  else {
    act = fwd > 0 ? '.' : '/'
    num = t === N || t === B || t === A ? fileNo(side, tf) : Math.abs(fwd)
  }
  return `${name}${fileLabel}${act}${num}`
}
export const ACT_VI = { '.': 'tiến', '/': 'thoái', '-': 'bình' }
export function moveViLong(s) {
  const m = s.match(/^(Tg|[SMTXPB])([^.\/-]+)([.\/-])(\d)$/)
  if (!m) return s
  const NAMES = { Tg: 'Tướng', S: 'Sĩ', T: 'Tượng', M: 'Mã', X: 'Xe', P: 'Pháo', B: 'Tốt' }
  const fl = m[2] === 't' ? ' trước' : m[2] === 's' ? ' sau' : ' ' + m[2]
  return `${NAMES[m[1]]}${fl} ${ACT_VI[m[3]]} ${m[4]}`
}

// ───── Phân tích cho người học ─────
const valOf = (p) => (typeOf(p) === K ? 10000 : VAL[typeOf(p)])

// Các nước HỢP LỆ của bên `side` ăn vào ô `s`
function capturersOf(pos, s, side) {
  return pos.gen(side, true).filter((m) => mTo(m) === s && pos.isLegal(m))
}
// Quân của `side` có thể "bảo vệ" ô s (ăn lại nếu đối phương ăn vào s)
function defendersOf(pos, s, side) {
  const keep = pos.board[s]
  pos.board[s] = P + (side === 0 ? 8 : 0) // đặt tạm một quân đối phương
  const out = capturersOf(pos, s, side)
  pos.board[s] = keep
  return out
}

const toPos = (x) => (x instanceof Position ? x : new Position(x))

// Quân của `color` đang bị TREO: bị tấn công mà không được bảo vệ, hoặc bị quân rẻ hơn tấn công
export function hangingPieces(fenOrPos, color) {
  const pos = toPos(fenOrPos), side = C2S[color], out = []
  for (let s = 0; s < 90; s++) {
    const p = pos.board[s]
    if (!p || sideOf(p) !== side || typeOf(p) === K) continue
    const atk = capturersOf(pos, s, side ^ 1)
    if (!atk.length) continue
    const def = defendersOf(pos, s, side)
    const cheapest = Math.min(...atk.map((m) => valOf(pos.board[mFrom(m)])))
    if (!def.length || cheapest < VAL[typeOf(p)]) out.push({ sq: sqName(s), type: LETTER[typeOf(p)], attackers: atk.map((m) => sqName(mFrom(m))), defenders: def.map((m) => sqName(mFrom(m))) })
  }
  return out
}

function describe(pos, m) {
  const p = pos.board[mFrom(m)], cap = pos.board[mTo(m)]
  return { from: sqName(mFrom(m)), to: sqName(mTo(m)), uci: moveUci(m), piece: LETTER[typeOf(p)], captured: cap ? LETTER[typeOf(cap)] : null, vi: moveVi(pos, m) }
}

// Các nước `color` đi được để CHIẾU Tướng đối phương (giả sử tới lượt `color`)
export function checkingMoves(fenOrPos, color) {
  const pos = toPos(fenOrPos), side = C2S[color]
  const save = pos.turn; pos.turn = side
  const out = []
  for (const m of pos.gen(side)) {
    if (!pos.isLegal(m)) continue
    pos.make(m); const chk = pos.inCheck(side ^ 1); pos.unmake()
    if (chk) out.push(describe(pos, m))
  }
  pos.turn = save
  return out
}

// Nước ăn quân có lợi của `color`: ăn quân bị treo, hoặc ăn quân đắt hơn quân mình
export function goodCaptures(fenOrPos, color) {
  const pos = toPos(fenOrPos), side = C2S[color]
  const hang = new Set(hangingPieces(pos, opp(color)).map((h) => sqIndex(h.sq)))
  return pos.gen(side, true).filter((m) => pos.isLegal(m) && (hang.has(mTo(m)) || VAL[typeOf(pos.board[mTo(m)])] > VAL[typeOf(pos.board[mFrom(m)])])).map((m) => describe(pos, m))
}

// Bảng ô đi được: Map(from -> [to]) (dùng cho bàn cờ)
export function destsOf(pos) {
  const d = new Map()
  for (const m of pos.legal()) { const f = sqName(mFrom(m)); if (!d.has(f)) d.set(f, []); d.get(f).push(sqName(mTo(m))) }
  return d
}

export function material(fenOrPos) {
  const pos = toPos(fenOrPos); let w = 0, b = 0
  for (let s = 0; s < 90; s++) { const p = pos.board[s]; if (p && typeOf(p) !== K) { if (sideOf(p) === 0) w += VAL[typeOf(p)]; else b += VAL[typeOf(p)] } }
  return { w, b }
}

// ───── Tìm chiếu hết liên hoàn (mọi nước của bên tấn công đều là nước chiếu) ─────
// Trả về true nếu bên đang đi chiếu hết được trong ≤ n nước
export function forcedMate(pos, n) {
  for (const m of pos.gen()) {
    if (!pos.isLegal(m)) continue
    pos.make(m)
    let ok = false
    if (pos.inCheck()) ok = mateAfter(pos, n)
    pos.unmake()
    if (ok) return true
  }
  return false
}
// Sau nước chiếu của bên tấn công: mọi cách đỡ đều bị chiếu hết trong ≤ n-1 nước nữa?
function mateAfter(pos, n) {
  const replies = pos.legal()
  if (!replies.length) return true
  if (n <= 1) return false
  for (const r of replies) {
    pos.make(r)
    const ok = forcedMate(pos, n - 1)
    pos.unmake()
    if (!ok) return false
  }
  return true
}
// Nước chiếu dẫn tới chiếu hết trong ≤ n (uci) – để kiểm tra nước của người học
export function mateMoves(pos, n) {
  const out = []
  for (const m of pos.gen()) {
    if (!pos.isLegal(m)) continue
    pos.make(m)
    const ok = pos.inCheck() && mateAfter(pos, n)
    pos.unmake()
    if (ok) out.push(moveUci(m))
  }
  return out
}
// Số nước ít nhất để chiếu hết (≤ max), 0 nếu không có
export function mateDistance(pos, max = 3) {
  for (let n = 1; n <= max; n++) if (forcedMate(pos, n)) return n
  return 0
}
// Cách đỡ "cứng đầu" nhất: chọn nước đỡ khiến bên tấn công cần nhiều nước nhất (ưu tiên khi chỉ còn 1 cách chiếu hết)
export function bestDefence(pos, n) {
  let best = null, bestKey = -1
  for (const r of pos.legal()) {
    pos.make(r)
    const d = mateDistance(pos, n)
    const uniq = d ? mateMoves(pos, d).length : 99
    pos.unmake()
    const key = (d === 0 ? 1000 : d * 10) - Math.min(uniq, 9)
    if (key > bestKey) { bestKey = key; best = moveUci(r) }
  }
  return best
}

// ───── Máy đánh: negamax alpha-beta + tĩnh lặng + bảng chuyển vị ─────
const TT_BITS = 18, TT_SIZE = 1 << TT_BITS, TT_MASK = TT_SIZE - 1
const ttKey = new Uint32Array(TT_SIZE), ttMove = new Int32Array(TT_SIZE), ttScore = new Int32Array(TT_SIZE), ttDepth = new Int8Array(TT_SIZE), ttFlag = new Int8Array(TT_SIZE)
const histTable = new Int32Array(1 << 14)

class Abort extends Error {}

export function evaluate(pos) { return pos.turn === 0 ? pos.score : -pos.score }

export function search(pos, { depth = 4, timeMs = 1500, nodesMax = 5e6 } = {}) {
  const deadline = Date.now() + timeMs
  let nodes = 0
  const killers = []
  const rootPly = pos.hist.length
  ttKey.fill(0); histTable.fill(0)

  const order = (moves, ttm, ply) => {
    const b = pos.board, k = killers[ply] || []
    const sc = moves.map((m) => {
      if (m === ttm) return 1e9
      const cap = b[mTo(m)]
      if (cap) return 1e8 + valOf(cap) * 10 - VAL[typeOf(b[mFrom(m)])] / 10
      if (m === k[0]) return 9e7
      if (m === k[1]) return 8e7
      return histTable[m & 0x3fff]
    })
    const idx = moves.map((_, i) => i).sort((a, b2) => sc[b2] - sc[a])
    return idx.map((i) => moves[i])
  }

  const check = () => { if ((++nodes & 1023) === 0 && (Date.now() > deadline || nodes > nodesMax)) throw new Abort() }

  function qs(alpha, beta, ply, qd) {
    check()
    const inChk = pos.inCheck()
    if (!inChk) {
      const stand = evaluate(pos)
      if (stand >= beta) return stand
      if (stand > alpha) alpha = stand
      if (qd > 6) return stand
    }
    const moves = order(pos.gen(pos.turn, !inChk), 0, ply)
    let legal = 0, best = inChk ? -MATE + ply : alpha
    for (const m of moves) {
      pos.make(m)
      if (pos.inCheck(pos.turn ^ 1)) { pos.unmake(); continue }
      legal++
      const s = -qs(-beta, -Math.max(alpha, best), ply + 1, qd + 1)
      pos.unmake()
      if (s > best) { best = s; if (s >= beta) return s }
    }
    if (inChk && !legal) return -MATE + ply
    return best
  }

  function ab(d, alpha, beta, ply, pv) {
    check()
    if (ply > 0) {
      // lặp thế → coi như hoà
      for (let i = pos.hist.length - 2; i >= Math.max(0, rootPly - 8); i -= 2) if (pos.hist[i] === pos.lo) return 0
    }
    const inChk = pos.inCheck()
    if (inChk) d++
    if (d <= 0) { pv.length = 0; return qs(alpha, beta, ply, 0) }
    const ti = pos.lo & TT_MASK
    let ttm = 0
    if (ttKey[ti] === pos.hi) {
      ttm = ttMove[ti]
      if (ply > 0 && ttDepth[ti] >= d) {
        const s = ttScore[ti], fl = ttFlag[ti]
        if (fl === 0 || (fl === 1 && s >= beta) || (fl === 2 && s <= alpha)) { pv.length = 0; if (ttm) pv.push(ttm); return s }
      }
    }
    const moves = order(pos.gen(), ttm, ply)
    let legal = 0, best = -MATE * 2, bestM = 0
    const a0 = alpha
    const child = []
    for (const m of moves) {
      pos.make(m)
      if (pos.inCheck(pos.turn ^ 1)) { pos.unmake(); continue }
      legal++
      let s
      if (legal === 1) s = -ab(d - 1, -beta, -alpha, ply + 1, child)
      else {
        s = -ab(d - 1, -alpha - 1, -alpha, ply + 1, child)
        if (s > alpha && s < beta) s = -ab(d - 1, -beta, -alpha, ply + 1, child)
      }
      pos.unmake()
      if (s > best) {
        best = s; bestM = m
        if (s > alpha) { alpha = s; pv.length = 0; pv.push(m, ...child) }
        if (s >= beta) {
          if (!pos.board[mTo(m)]) { const k = killers[ply] || (killers[ply] = [0, 0]); if (k[0] !== m) { k[1] = k[0]; k[0] = m } histTable[m & 0x3fff] += d * d }
          break
        }
      }
    }
    if (!legal) return -MATE + ply // hết nước = thua (kể cả không bị chiếu)
    ttKey[ti] = pos.hi; ttMove[ti] = bestM; ttScore[ti] = best; ttDepth[ti] = d
    ttFlag[ti] = best >= beta ? 1 : best <= a0 ? 2 : 0
    return best
  }

  let result = { move: null, score: 0, depth: 0, pv: [] }
  const rootMoves = pos.legal()
  if (!rootMoves.length) return { ...result, score: -MATE, nodes }
  result.move = moveUci(rootMoves[0])
  for (let d = 1; d <= depth; d++) {
    const pv = []
    try {
      const s = ab(d, -MATE * 2, MATE * 2, 0, pv)
      if (pv.length) result = { move: moveUci(pv[0]), score: s, depth: d, pv: pv.map(moveUci) }
      if (Math.abs(s) > MATE - 100) break
    } catch (e) {
      if (!(e instanceof Abort)) throw e
      break
    }
  }
  result.nodes = nodes
  return result
}

// Điểm của TỪNG nước ở gốc (theo góc nhìn bên đi) – dùng cho máy mức thấp và để sinh thế cờ
export function rootScores(pos, depth = 2, timeMs = 3000) {
  const out = []
  const t0 = Date.now()
  for (const m of pos.legal()) {
    pos.make(m)
    let s
    if (!pos.hasLegal()) s = MATE - 1
    else {
      const r = search(pos, { depth: Math.max(1, depth - 1), timeMs: Math.max(50, (timeMs - (Date.now() - t0)) / 4) })
      s = -r.score
    }
    pos.unmake()
    out.push({ move: moveUci(m), score: s })
  }
  return out.sort((a, b) => b.score - a.score)
}

// Mức máy 1–8 (mức thấp cố tình đi lỏng để người mới thắng được)
export const LEVELS = [
  null,
  { depth: 1, noise: 250, blunder: 0.25, time: 300, label: 'Mới học' },
  { depth: 2, noise: 150, blunder: 0.12, time: 400, label: 'Rất dễ' },
  { depth: 2, noise: 70, blunder: 0.05, time: 500, label: 'Dễ' },
  { depth: 3, noise: 30, blunder: 0, time: 800, label: 'Trung bình' },
  { depth: 4, noise: 10, blunder: 0, time: 1200, label: 'Khá' },
  { depth: 5, noise: 0, blunder: 0, time: 1800, label: 'Mạnh' },
  { depth: 6, noise: 0, blunder: 0, time: 3000, label: 'Rất mạnh' },
  { depth: 8, noise: 0, blunder: 0, time: 5000, label: 'Tối đa' },
]

export function pickMove(pos, level = 3, rand = Math.random) {
  const L = LEVELS[Math.max(1, Math.min(8, level))]
  if (L.noise === 0) return search(pos, { depth: L.depth, timeMs: L.time }).move
  const sc = rootScores(pos, L.depth, L.time)
  if (!sc.length) return null
  // không bỏ lỡ nước chiếu hết ngay
  if (sc[0].score >= MATE - 2 && level >= 2) return sc[0].move
  if (rand() < L.blunder) return sc[Math.floor(rand() * sc.length)].move
  let best = null, bs = -Infinity
  for (const x of sc) { const v = x.score + (rand() * 2 - 1) * L.noise; if (v > bs) { bs = v; best = x.move } }
  return best
}

// Nước định đi có nguy hiểm không? (để cảnh báo người học)
export function dangerAfter(fenOrPos, u) {
  const pos = toPos(fenOrPos).clone()
  const me = pos.turnColor()
  if (!pos.moveByUci(u)) return []
  const notes = []
  const mate1 = mateMoves(pos, 1)
  if (mate1.length) { const x = new Position(pos.fen()); notes.push(`Đối phương chiếu hết ngay bằng ${moveVi(x, parseUci(mate1[0]))}!`) }
  else if (forcedMate(pos, 2)) notes.push('Đối phương có đòn chiếu liên tiếp dẫn tới chiếu hết trong 2 nước!')
  const hang = hangingPieces(pos, me).filter((h) => VAL[FROM_LETTER[h.type]] >= 400)
  hang.forEach((h) => notes.push(`${NAME_VI[h.type]} ở ${h.sq} bị treo (bị tấn công${h.defenders.length ? ' bởi quân rẻ hơn' : ', không được bảo vệ'}).`))
  return notes
}

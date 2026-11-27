// Kho dữ liệu tối giản lưu trong LocalStorage, dùng với useSyncExternalStore
import { useSyncExternalStore } from 'react'

const KEY = 'chess-cube:v1'

export const defaultSettings = {
  theme: 'system', // 'light' | 'dark' | 'system'
  reminderOn: false,
  reminderTime: '20:00',
  dailyGoalMin: 30,
  newPuzzlesPerDay: 10, // số thế cờ MỚI tối đa/ngày (ôn trước, học mới sau)
  newAlgsPerDay: 3, // số công thức Rubik MỚI tối đa/ngày
  puzzleSource: 'mix', // 'local' | 'lichess' | 'mix'
  engineLevel: 3, // 1–8: độ mạnh máy khi đánh
  blunderCheck: true, // hỏi lại khi định đi nước hớ (đánh với máy)
  boardTheme: 'brown',
  inspection: true, // 15 giây quan sát trước khi bấm giờ Rubik
}

const initial = {
  settings: defaultSettings,
  reviews: {}, // lịch ôn từng mục: 'type:id' -> {...} (thế cờ, công thức, bài học…)
  puzzles: {}, // id -> { attempts, solved, lastAt, data (thế cờ tải từ Lichess) }
  scans: { n: 0, ok: 0 }, // thống kê quét nguy hiểm
  games: [], // ván đánh với máy: { at, result, level, blunders, pgn }
  solves: { '222': [], '333': [], '444': [] }, // giải Rubik: { t (ms), penalty: ''|'+2'|'DNF', scramble, at }
  algs: {}, // công thức Rubik: id -> { learnedAt }
  lessons: {}, // bài học đã hoàn thành: id -> date
  time: {}, // 'YYYY-MM-DD' -> { total, chess, cube }
  history: [], // nhật ký: { at, module, detail }
  lastNotified: '',
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(initial)
    const data = JSON.parse(raw)
    const settings = { ...defaultSettings, ...(data.settings || {}) }
    return { ...structuredClone(initial), ...data, settings }
  } catch {
    return structuredClone(initial)
  }
}

let state = load()
const listeners = new Set()
let saveTimer = null

function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => localStorage.setItem(KEY, JSON.stringify(state)), 150)
}

export function getState() {
  return state
}

// updater: (draft) => void  (được phép sửa trực tiếp bản sao)
export function update(updater) {
  const next = structuredClone(state)
  updater(next)
  state = next
  persist()
  listeners.forEach((l) => l())
}

export function replaceState(data) {
  state = { ...structuredClone(initial), ...data, settings: { ...defaultSettings, ...(data.settings || {}) } }
  persist()
  listeners.forEach((l) => l())
}

export function resetAll() {
  state = structuredClone(initial)
  localStorage.removeItem(KEY)
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(subscribe, () => selector(state))
}

export function logHistory(module, detail) {
  update((s) => {
    s.history.unshift({ at: Date.now(), module, detail })
    s.history = s.history.slice(0, 3000)
  })
}

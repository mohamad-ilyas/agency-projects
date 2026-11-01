/** Pure task model and operations. No DOM, no storage, no React. */

/** Date-only string in the form YYYY-MM-DD (device local calendar day), or null for no due date. */
export type DueDate = string | null

export interface Task {
  id: string
  title: string
  due: DueDate
  done: boolean
  /** Creation time in ms since epoch; list order is newest first (A-4). */
  createdAt: number
}

export type Filter = 'all' | 'active' | 'done'
export const FILTERS: readonly Filter[] = ['all', 'active', 'done'] as const

export type TaskAction =
  | { type: 'add'; id: string; title: string; due: DueDate; createdAt: number }
  | { type: 'toggle'; id: string }
  | { type: 'edit'; id: string; title: string; due: DueDate }
  | { type: 'delete'; id: string }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Trim a title; returns null when it is empty or whitespace only (AC-1.2, AC-3.3). */
export function normalizeTitle(raw: string): string | null {
  const t = raw.trim()
  return t.length > 0 ? t : null
}

/** Accepts "" (no date) or a valid YYYY-MM-DD calendar date; anything else becomes null. */
export function normalizeDue(raw: string | null | undefined): DueDate {
  if (!raw || !DATE_RE.test(raw)) return null
  const [y, m, d] = raw.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return raw
}

export function tasksReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'add': {
      const title = normalizeTitle(action.title)
      if (title === null) return state
      const task: Task = {
        id: action.id,
        title,
        due: normalizeDue(action.due),
        done: false,
        createdAt: action.createdAt,
      }
      return [task, ...state]
    }
    case 'toggle':
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
    case 'edit': {
      const title = normalizeTitle(action.title)
      if (title === null) return state // refuse; keep original (AC-3.3)
      const due = normalizeDue(action.due)
      return state.map((t) => (t.id === action.id ? { ...t, title, due } : t))
    }
    case 'delete':
      return state.filter((t) => t.id !== action.id)
    default:
      return state
  }
}

export function filterTasks(tasks: readonly Task[], filter: Filter): Task[] {
  switch (filter) {
    case 'active':
      return tasks.filter((t) => !t.done)
    case 'done':
      return tasks.filter((t) => t.done)
    default:
      return tasks.slice()
  }
}

/** Number of active tasks; independent of the current filter (AC-6.1). */
export function countActive(tasks: readonly Task[]): number {
  let n = 0
  for (const t of tasks) if (!t.done) n++
  return n
}

/** Today's date in device local time as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** A-5: active task with a due date before today is overdue. Done tasks never are. */
export function isOverdue(task: Task, today: string = todayISO()): boolean {
  return !task.done && task.due !== null && task.due < today
}

/** Random id; falls back when crypto.randomUUID is unavailable (non-secure contexts). */
export function newId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Runtime check used when reading untrusted data from storage. */
export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.title === 'string' &&
    v.title.trim().length > 0 &&
    typeof v.done === 'boolean' &&
    typeof v.createdAt === 'number' &&
    Number.isFinite(v.createdAt) &&
    (v.due === null || (typeof v.due === 'string' && normalizeDue(v.due) !== null))
  )
}

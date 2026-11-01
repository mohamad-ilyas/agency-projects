/** localStorage access with versioned keys. Every call tolerates missing, corrupt, or unavailable storage. */
import { isTask, type Task } from './tasks'
import type { Lang } from './i18n'

export type Theme = 'light' | 'dark'

/** Keep in sync with the pre-paint script in index.html. */
export const STORAGE_KEYS = {
  tasks: 'todo-app:v1:tasks',
  lang: 'todo-app:v1:lang',
  theme: 'todo-app:v1:theme',
} as const

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // e.g. SecurityError when storage is blocked
  }
}

/** True when localStorage can be written and read (false in some private modes / blocked cookies). */
export function isStorageAvailable(): boolean {
  const s = getStorage()
  if (!s) return false
  try {
    const k = 'todo-app:v1:__probe__'
    s.setItem(k, '1')
    s.removeItem(k)
    return true
  } catch {
    return false
  }
}

function read(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Returns false if the write failed (unavailable, quota exceeded). */
function write(key: string, value: string): boolean {
  const s = getStorage()
  if (!s) return false
  try {
    s.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** Loads tasks; returns [] for missing/corrupt data and drops individual invalid entries (AC-9.2). */
export function loadTasks(): Task[] {
  const raw = read(STORAGE_KEYS.tasks)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const tasks: Task[] = []
    for (const item of parsed) {
      if (isTask(item) && !seen.has(item.id)) {
        seen.add(item.id)
        tasks.push({
          id: item.id,
          title: item.title.trim(),
          due: item.due,
          done: item.done,
          createdAt: item.createdAt,
        })
      }
    }
    return tasks.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export function saveTasks(tasks: readonly Task[]): boolean {
  return write(STORAGE_KEYS.tasks, JSON.stringify(tasks))
}

export function loadLang(): Lang | null {
  const v = read(STORAGE_KEYS.lang)
  return v === 'ar' || v === 'en' ? v : null
}

export function saveLang(lang: Lang): boolean {
  return write(STORAGE_KEYS.lang, lang)
}

export function loadTheme(): Theme | null {
  const v = read(STORAGE_KEYS.theme)
  return v === 'light' || v === 'dark' ? v : null
}

export function saveTheme(theme: Theme): boolean {
  return write(STORAGE_KEYS.theme, theme)
}

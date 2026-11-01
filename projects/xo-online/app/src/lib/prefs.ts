/** Per-browser preferences in localStorage: client id, display name, language. */
import type { Lang } from './i18n'
import { newClientId } from './ids'

export const DEFAULT_NAMESPACE = 'aicos-xo:v1'

export interface Prefs {
  clientId(): string
  getName(): string
  /** Prefill for the name form (in per-tab mode: the name last used in any tab). */
  suggestedName(): string
  setName(name: string): void
  getLang(): Lang | null
  setLang(lang: Lang): void
}

type Area = 'local' | 'session'

function store(area: Area): Storage {
  return area === 'local' ? localStorage : sessionStorage
}

function safeGet(key: string, area: Area = 'local'): string | null {
  try {
    return store(area).getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string, area: Area = 'local'): void {
  try {
    store(area).setItem(key, value)
  } catch {
    /* storage unavailable (private mode): value lives only for this page */
  }
}

/**
 * `namespace` lets tests run two independent "browsers" in one jsdom.
 * `perTab` (local test mode): client id and name live in sessionStorage so two tabs of one browser
 * act as two players; each tab still reclaims its own seat on reload.
 */
export function createPrefs(namespace = DEFAULT_NAMESPACE, opts: { perTab?: boolean } = {}): Prefs {
  const k = (s: string) => `${namespace}:${s}`
  const idArea: Area = opts.perTab ? 'session' : 'local'
  let memClientId: string | null = null
  let memName = ''
  return {
    clientId() {
      const saved = safeGet(k('clientId'), idArea)
      if (saved && /^[A-Za-z0-9_-]{6,40}$/.test(saved)) return saved
      memClientId ??= newClientId()
      safeSet(k('clientId'), memClientId, idArea)
      return memClientId
    },
    getName: () => (opts.perTab ? safeGet(k('name'), 'session') : safeGet(k('name'))) ?? memName,
    suggestedName: () => safeGet(k('name')) ?? memName,
    setName(name) {
      memName = name
      safeSet(k('name'), name)
      if (opts.perTab) safeSet(k('name'), name, 'session')
    },
    getLang() {
      const v = safeGet(k('lang'))
      return v === 'ar' || v === 'en' ? v : null
    },
    setLang: (lang) => safeSet(k('lang'), lang),
  }
}

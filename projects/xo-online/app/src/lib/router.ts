/** Hash routing (#/ lobby, #/game/<id>). Injectable so tests can run two app instances in one window. */
import { ID_RE } from './room'

export type Route = { name: 'lobby' } | { name: 'game'; id: string }

export interface Router {
  get(): string
  navigate(hash: string): void
  subscribe(cb: () => void): () => void
  /** Absolute share URL for a game (includes the deploy base path and any ?transport=local). */
  gameUrl(id: string): string
}

export function parseRoute(hash: string): Route {
  const m = /^#\/game\/([^/?#]+)\/?$/.exec(hash)
  if (m && ID_RE.test(m[1].toLowerCase())) return { name: 'game', id: m[1].toLowerCase() }
  return { name: 'lobby' }
}

export const gameHash = (id: string) => `#/game/${id}`

export function createHashRouter(): Router {
  return {
    get: () => window.location.hash,
    navigate(hash) {
      if (window.location.hash !== hash) window.location.hash = hash
    },
    subscribe(cb) {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    gameUrl: (id) => `${window.location.origin}${window.location.pathname}${window.location.search}${gameHash(id)}`,
  }
}

export function createMemoryRouter(initial = '#/', origin = 'https://example.test/xo/'): Router {
  let hash = initial
  const subs = new Set<() => void>()
  return {
    get: () => hash,
    navigate(next) {
      if (next === hash) return
      hash = next
      for (const s of [...subs]) s()
    },
    subscribe(cb) {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    gameUrl: (id) => `${origin}${gameHash(id)}`,
  }
}

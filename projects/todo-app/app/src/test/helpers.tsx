/** Shared test helpers for the acceptance tests (src/test/us*.test.tsx). Test-only; no app logic. */
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../App'
import type { Lang } from '../lib/i18n'
import { STORAGE_KEYS } from '../lib/storage'
import type { Task } from '../lib/tasks'

let seq = 0

/** Builds a valid stored task. createdAt increases per call so order is deterministic (newest first). */
export function makeTask(partial: Partial<Task> & { title: string }): Task {
  seq += 1
  return { id: `t-${seq}`, due: null, done: false, createdAt: 1_000 + seq, ...partial }
}

export function seedTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
}

export function storedTasks(): Task[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) ?? 'null') as Task[]
}

/** Renders the app with an optional saved language (simulating a returning user). */
export function renderApp(opts: { lang?: Lang } = {}) {
  if (opts.lang) localStorage.setItem(STORAGE_KEYS.lang, opts.lang)
  const user = userEvent.setup()
  const result = render(<App />)
  return { user, ...result }
}

/** Simulates a page reload: unmount, then mount a fresh App that reads from localStorage again. */
export function reload(unmount: () => void) {
  unmount()
  return renderApp()
}

/** Titles of the rendered task rows, in display order. */
export function visibleTitles(): string[] {
  const list = screen.queryByRole('list')
  if (!list) return []
  return within(list)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.task__title')?.textContent ?? '')
}

/** The <li> row that contains the given task title. */
export function rowFor(title: string): HTMLElement {
  const li = screen.getByText(title).closest('li')
  if (!li) throw new Error(`No row for "${title}"`)
  return li
}

/**
 * jsdom has no matchMedia. Installs a controllable mock for `(prefers-color-scheme: dark)`.
 * Call vi.unstubAllGlobals() in afterEach.
 */
export function mockColorScheme(initialDark: boolean) {
  let dark = initialDark
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  const matchMedia = vi.fn((query: string) => ({
    get matches() {
      return query.includes('dark') ? dark : !dark
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
  vi.stubGlobal('matchMedia', matchMedia)
  return {
    matchMedia,
    /** Simulates the OS switching its colour scheme. */
    setSystemDark(next: boolean) {
      dark = next
      act(() => {
        for (const cb of listeners) cb({ matches: next, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent)
      })
    },
  }
}

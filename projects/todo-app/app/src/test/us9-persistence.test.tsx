/** US-9 Persistence (AC-9.1, AC-9.2). Storage failures are simulated by mocking localStorage. */
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../lib/storage'
import { makeTask, reload, renderApp, rowFor, storedTasks, visibleTitles } from './helpers'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 1, 12, 0, 0))
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const realSetItem = Storage.prototype.setItem

/** Makes every localStorage write throw, like Safari private mode / blocked storage. */
function blockAllWrites() {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
  })
}

describe('US-9 Persistence', () => {
  it('AC-9.1 added, edited, toggled and deleted tasks are restored exactly after reload', async () => {
    const { user, unmount } = renderApp({ lang: 'en' })
    const input = screen.getByLabelText('Task')
    await user.type(input, 'Keep plain{Enter}')
    await user.type(input, 'Toggle me')
    await user.type(screen.getByLabelText('Due date (optional)'), '2026-03-20')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.type(input, 'Edit me{Enter}')
    await user.type(input, 'Delete me{Enter}')

    await user.click(screen.getByRole('checkbox', { name: 'Toggle me' }))
    await user.click(screen.getByRole('button', { name: 'Edit “Edit me”' }))
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Edited')
    await user.type(screen.getByLabelText('Due date'), '2026-04-01')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: 'Delete “Delete me”' }))

    const before = storedTasks()
    expect(before.map(({ title, due, done }) => ({ title, due, done }))).toEqual([
      { title: 'Edited', due: '2026-04-01', done: false },
      { title: 'Toggle me', due: '2026-03-20', done: true },
      { title: 'Keep plain', due: null, done: false },
    ])

    reload(unmount)

    expect(visibleTitles()).toEqual(['Edited', 'Toggle me', 'Keep plain'])
    expect(screen.getByRole('checkbox', { name: 'Toggle me' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Edited' })).not.toBeChecked()
    expect(rowFor('Edited')).toHaveTextContent('Due April 1, 2026')
    expect(rowFor('Toggle me')).toHaveTextContent('Due March 20, 2026')
    expect(screen.getByText('2 tasks left')).toBeInTheDocument()
    expect(storedTasks()).toEqual(before)
  })

  it('AC-9.1 tasks are stored under the versioned key todo-app:v1:tasks (NFR-4)', async () => {
    const { user } = renderApp({ lang: 'ar' })
    await user.type(screen.getByLabelText('المهمة'), 'مهمة{Enter}')
    expect(Object.keys(localStorage).sort()).toEqual([STORAGE_KEYS.lang, STORAGE_KEYS.tasks].sort())
    expect(STORAGE_KEYS).toEqual({ tasks: 'todo-app:v1:tasks', lang: 'todo-app:v1:lang', theme: 'todo-app:v1:theme' })
  })

  it('AC-9.2 empty localStorage loads an empty list without a storage notice', () => {
    renderApp({ lang: 'en' })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('No tasks yet. Add one above.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['a JSON object instead of an array', '{"id":"x"}'],
    ['JSON null', 'null'],
    ['a number', '42'],
  ])('AC-9.2 corrupt data (%s) loads an empty list without crashing', (_label, raw) => {
    localStorage.setItem(STORAGE_KEYS.tasks, raw)
    renderApp({ lang: 'en' })
    expect(screen.getByText('No tasks yet. Add one above.')).toBeInTheDocument()
    expect(screen.getByText('0 tasks left')).toBeInTheDocument()
  })

  it('AC-9.2 partially corrupt data keeps only valid tasks (invalid, duplicate and bad-date entries dropped)', () => {
    const good = makeTask({ title: 'Valid', due: '2026-03-05' })
    localStorage.setItem(
      STORAGE_KEYS.tasks,
      JSON.stringify([
        good,
        { ...good }, // duplicate id
        { id: 'x1', title: '   ', due: null, done: false, createdAt: 1 }, // blank title
        { id: 'x2', title: 'Bad date', due: '2026-02-31', done: false, createdAt: 2 },
        { id: 'x3', title: 'No done flag', due: null, createdAt: 3 },
        null,
        'string',
      ]),
    )
    renderApp({ lang: 'en' })
    expect(visibleTitles()).toEqual(['Valid'])
  })

  it('AC-9.2 storage unavailable (writes throw): empty list, non-blocking notice, app still usable (en)', async () => {
    blockAllWrites()
    const { user } = renderApp()

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent(
      'Storage is unavailable in this browser, so tasks will not be saved after you close the page.',
    )
    expect(screen.getByText('No tasks yet. Add one above.')).toBeInTheDocument()

    // Non-blocking: adding and completing still works in memory.
    await user.type(screen.getByLabelText('Task'), 'In memory only{Enter}')
    expect(visibleTitles()).toEqual(['In memory only'])
    await user.click(screen.getByRole('checkbox', { name: 'In memory only' }))
    expect(screen.getByText('0 tasks left')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Storage is unavailable')
  })

  it('AC-9.2 storage unavailable (window.localStorage access throws SecurityError): notice in Arabic', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ar-SA')
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    renderApp()

    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(screen.getByRole('status')).toHaveTextContent(
      'التخزين غير متاح في هذا المتصفح، لذلك لن تُحفظ المهام بعد إغلاق الصفحة.',
    )
    expect(screen.getByText('لا توجد مهام بعد. أضف مهمة من الأعلى.')).toBeInTheDocument()
  })

  it('AC-9.2 a failed write (quota exceeded) shows the write-failed notice, which clears after a successful save', async () => {
    let failTasksWrite = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (failTasksWrite && key === STORAGE_KEYS.tasks) {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      }
      realSetItem.call(this, key, value)
    })
    const { user } = renderApp({ lang: 'en' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    failTasksWrite = true
    await user.type(screen.getByLabelText('Task'), 'Will not save{Enter}')
    expect(visibleTitles()).toEqual(['Will not save'])
    expect(screen.getByRole('status')).toHaveTextContent('Your latest change could not be saved in this browser.')
    expect(storedTasks()).toEqual([])

    failTasksWrite = false
    await user.type(screen.getByLabelText('Task'), 'Saves now{Enter}')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(storedTasks().map((t) => t.title)).toEqual(['Saves now', 'Will not save'])
  })

  it('AC-9.2 the write-failed notice is shown in Arabic', async () => {
    let fail = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (fail && key === STORAGE_KEYS.tasks) throw new DOMException('quota', 'QuotaExceededError')
      realSetItem.call(this, key, value)
    })
    const { user } = renderApp({ lang: 'ar' })
    fail = true
    await user.type(screen.getByLabelText('المهمة'), 'لن تُحفظ{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('تعذّر حفظ آخر تغيير في هذا المتصفح.')
  })
})

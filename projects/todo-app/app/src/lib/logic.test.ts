import { describe, expect, it } from 'vitest'
import { formatDueDate, formatTasksLeft, pluralCategory } from './i18n'
import { STORAGE_KEYS, loadTasks } from './storage'
import { countActive, filterTasks, isOverdue, tasksReducer, type Task } from './tasks'

const base: Task = { id: 'a', title: 'A', due: null, done: false, createdAt: 1 }

describe('tasks reducer (smoke)', () => {
  it('adds trimmed titles newest first and refuses empty ones', () => {
    let s = tasksReducer([], { type: 'add', id: '1', title: '  Buy milk  ', due: null, createdAt: 1 })
    s = tasksReducer(s, { type: 'add', id: '2', title: 'Second', due: '2026-03-05', createdAt: 2 })
    expect(s.map((t) => t.title)).toEqual(['Second', 'Buy milk'])
    expect(tasksReducer(s, { type: 'add', id: '3', title: '   ', due: null, createdAt: 3 })).toBe(s)
  })

  it('refuses an empty edit title but allows clearing the date', () => {
    const s = [{ ...base, due: '2026-01-01' }]
    expect(tasksReducer(s, { type: 'edit', id: 'a', title: ' ', due: null })).toBe(s)
    expect(tasksReducer(s, { type: 'edit', id: 'a', title: 'B', due: null })[0]).toMatchObject({ title: 'B', due: null })
  })

  it('filters and counts independently of filter', () => {
    const s = [base, { ...base, id: 'b', done: true }]
    expect(filterTasks(s, 'active')).toHaveLength(1)
    expect(filterTasks(s, 'done')).toHaveLength(1)
    expect(countActive(s)).toBe(1)
  })

  it('marks only active past-due tasks as overdue', () => {
    expect(isOverdue({ ...base, due: '2026-01-01' }, '2026-01-02')).toBe(true)
    expect(isOverdue({ ...base, due: '2026-01-01', done: true }, '2026-01-02')).toBe(false)
    expect(isOverdue({ ...base, due: '2026-01-02' }, '2026-01-02')).toBe(false)
  })
})

describe('i18n (smoke)', () => {
  it('uses CLDR Arabic plural categories', () => {
    const cats = [0, 1, 2, 3, 10, 11, 99, 100, 102, 103, 111].map((n) => pluralCategory('ar', n))
    expect(cats).toEqual(['zero', 'one', 'two', 'few', 'few', 'many', 'many', 'other', 'other', 'few', 'many'])
  })

  it('formats the tasks-left count in both languages with Western digits', () => {
    expect(formatTasksLeft('en', 0)).toBe('0 tasks left')
    expect(formatTasksLeft('en', 1)).toBe('1 task left')
    expect(formatTasksLeft('en', 2)).toBe('2 tasks left')
    expect(formatTasksLeft('ar', 1)).toBe('مهمة واحدة متبقية')
    expect(formatTasksLeft('ar', 2)).toBe('مهمتان متبقيتان')
    expect(formatTasksLeft('ar', 3)).toBe('3 مهام متبقية')
    expect(formatTasksLeft('ar', 11)).toBe('11 مهمة متبقية')
    expect(formatDueDate('ar', '2026-03-05')).toMatch(/^[^٠-٩]*2026[^٠-٩]*$/)
  })
})

describe('storage (smoke)', () => {
  it('returns [] for corrupt data and drops invalid entries', () => {
    localStorage.setItem(STORAGE_KEYS.tasks, '{not json')
    expect(loadTasks()).toEqual([])
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify([base, { id: 5 }, null]))
    expect(loadTasks()).toEqual([base])
  })
})

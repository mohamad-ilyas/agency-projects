/** US-6 Tasks-left count (AC-6.1, AC-6.2). */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatTasksLeft, pluralCategory } from '../lib/i18n'
import type { Task } from '../lib/tasks'
import { makeTask, renderApp, seedTasks } from './helpers'

function nTasks(active: number, done = 0): Task[] {
  return [
    ...Array.from({ length: active }, (_, i) => makeTask({ title: `Active ${i}` })),
    ...Array.from({ length: done }, (_, i) => makeTask({ title: `Done ${i}`, done: true })),
  ]
}

describe('US-6 Tasks-left count', () => {
  it.each([
    [0, '0 tasks left'],
    [1, '1 task left'],
    [2, '2 tasks left'],
    [11, '11 tasks left'],
    [100, '100 tasks left'],
    [101, '101 tasks left'],
  ])('AC-6.1 English singular/plural: %i -> "%s"', (n, text) => {
    expect(formatTasksLeft('en', n)).toBe(text)
  })

  it('AC-6.1 footer count ignores the current filter and is a polite live region (en)', async () => {
    seedTasks(nTasks(2, 3))
    const { user } = renderApp({ lang: 'en' })
    const count = screen.getByText('2 tasks left')
    expect(count).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('contentinfo')).toContainElement(count)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByText('2 tasks left')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.getByText('2 tasks left')).toBeInTheDocument()
  })

  it('AC-6.1 footer shows "1 task left" and "0 tasks left" as tasks are completed (en)', async () => {
    seedTasks([makeTask({ title: 'One' })])
    const { user } = renderApp({ lang: 'en' })
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'One' }))
    expect(screen.getByText('0 tasks left')).toBeInTheDocument()
  })

  // CLDR Arabic categories. Note: the spec's shorthand "100+ -> other" is not literal CLDR:
  // 103 is "few" and 111 is "many" (the rule uses n % 100). The app follows CLDR via Intl.PluralRules.
  it.each([
    [0, 'zero', 'لا توجد مهام متبقية'],
    [1, 'one', 'مهمة واحدة متبقية'],
    [2, 'two', 'مهمتان متبقيتان'],
    [3, 'few', '3 مهام متبقية'],
    [10, 'few', '10 مهام متبقية'],
    [11, 'many', '11 مهمة متبقية'],
    [99, 'many', '99 مهمة متبقية'],
    [100, 'other', '100 مهمة متبقية'],
    [101, 'other', '101 مهمة متبقية'],
    [103, 'few', '103 مهام متبقية'],
    [111, 'many', '111 مهمة متبقية'],
  ] as const)('AC-6.2 Arabic plural for %i is "%s": "%s"', (n, category, text) => {
    expect(pluralCategory('ar', n)).toBe(category)
    expect(formatTasksLeft('ar', n)).toBe(text)
  })

  it.each([
    [0, 'لا توجد مهام متبقية'],
    [1, 'مهمة واحدة متبقية'],
    [2, 'مهمتان متبقيتان'],
    [3, '3 مهام متبقية'],
    [11, '11 مهمة متبقية'],
    [100, '100 مهمة متبقية'],
  ])('AC-6.2 footer renders the Arabic form for %i active tasks', (n, text) => {
    seedTasks(nTasks(n, 1))
    renderApp({ lang: 'ar' })
    expect(screen.getByText(text)).toHaveAttribute('aria-live', 'polite')
  })
})

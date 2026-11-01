/** A-5 Overdue highlighting (assumption, pending CEO confirmation). Date is fixed so results do not depend on the run day. */
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTask, renderApp, rowFor, seedTasks } from './helpers'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 10, 0, 30, 0)) // 10 March 2026, 00:30 local time
})
afterEach(() => {
  vi.useRealTimers()
})

describe('A-5 Overdue', () => {
  it('A-5 an active task due before today shows a text label, not colour alone (en)', () => {
    seedTasks([
      makeTask({ title: 'Yesterday', due: '2026-03-09' }),
      makeTask({ title: 'Today', due: '2026-03-10' }),
      makeTask({ title: 'Tomorrow', due: '2026-03-11' }),
      makeTask({ title: 'Done late', due: '2026-03-01', done: true }),
    ])
    renderApp({ lang: 'en' })

    expect(rowFor('Yesterday')).toHaveClass('task--overdue')
    expect(rowFor('Yesterday')).toHaveTextContent('Overdue')
    for (const title of ['Today', 'Tomorrow', 'Done late']) {
      expect(rowFor(title)).not.toHaveClass('task--overdue')
      expect(rowFor(title)).not.toHaveTextContent('Overdue')
    }
  })

  it('A-5 the overdue label is in Arabic and disappears when the task is completed (ar)', async () => {
    seedTasks([makeTask({ title: 'متأخرة جداً', due: '2026-02-01' })])
    const { user } = renderApp({ lang: 'ar' })
    expect(rowFor('متأخرة جداً')).toHaveTextContent('متأخرة')
    expect(screen.getByText('متأخرة', { selector: '.badge' })).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'متأخرة جداً' }))
    expect(rowFor('متأخرة جداً')).not.toHaveClass('task--overdue')
    expect(screen.queryByText('متأخرة', { selector: '.badge' })).not.toBeInTheDocument()
  })
})

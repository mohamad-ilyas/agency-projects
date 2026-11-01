/** US-3 Edit a task (AC-3.1 .. AC-3.3). */
import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTask, renderApp, rowFor, seedTasks, storedTasks } from './helpers'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 1, 12, 0, 0)) // 1 March 2026: seeded dates below are in the future
})
afterEach(() => {
  vi.useRealTimers()
})

describe('US-3 Edit a task', () => {
  it('AC-3.1 Edit, change title and date, Save button shows and stores the changes (en)', async () => {
    seedTasks([makeTask({ title: 'Draft report', due: '2026-03-05' })])
    const { user } = renderApp({ lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Edit “Draft report”' }))
    const form = screen.getByRole('form', { name: 'Edit task “Draft report”' })
    const title = screen.getByLabelText('Title')
    expect(form).toContainElement(title)
    expect(title).toHaveFocus()
    await user.clear(title)
    await user.type(title, '  Final report  ')
    const due = screen.getByLabelText('Due date')
    await user.clear(due)
    await user.type(due, '2026-04-10')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(rowFor('Final report')).toHaveTextContent('Due April 10, 2026')
    expect(screen.queryByText('Draft report')).not.toBeInTheDocument()
    expect(storedTasks()).toEqual([expect.objectContaining({ title: 'Final report', due: '2026-04-10' })])
    expect(screen.getByRole('button', { name: 'Edit “Final report”' })).toHaveFocus()
  })

  it('AC-3.1 Enter saves a title-only change (ar)', async () => {
    seedTasks([makeTask({ title: 'مسودة' })])
    const { user } = renderApp({ lang: 'ar' })

    await user.click(screen.getByRole('button', { name: 'تعديل «مسودة»' }))
    const title = screen.getByLabelText('العنوان')
    await user.clear(title)
    await user.type(title, 'نهائي{Enter}')

    expect(screen.getByText('نهائي')).toBeInTheDocument()
    expect(storedTasks()[0].title).toBe('نهائي')
  })

  it('AC-3.2 Escape cancels edit and keeps the original title and date', async () => {
    seedTasks([makeTask({ title: 'Original', due: '2026-03-05' })])
    const { user } = renderApp({ lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Edit “Original”' }))
    await user.type(screen.getByLabelText('Title'), ' changed')
    await user.clear(screen.getByLabelText('Due date'))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('form', { name: /Edit task/ })).not.toBeInTheDocument()
    expect(rowFor('Original')).toHaveTextContent('Due March 5, 2026')
    expect(storedTasks()[0]).toMatchObject({ title: 'Original', due: '2026-03-05' })
    expect(screen.getByRole('button', { name: 'Edit “Original”' })).toHaveFocus()
  })

  it('AC-3.2 Cancel button keeps the original values, and re-opening edit starts from them (ar)', async () => {
    seedTasks([makeTask({ title: 'الأصل' })])
    const { user } = renderApp({ lang: 'ar' })

    await user.click(screen.getByRole('button', { name: 'تعديل «الأصل»' }))
    await user.type(screen.getByLabelText('العنوان'), ' تغيير')
    await user.click(screen.getByRole('button', { name: 'إلغاء' }))
    expect(screen.getByText('الأصل')).toBeInTheDocument()
    expect(storedTasks()[0].title).toBe('الأصل')

    await user.click(screen.getByRole('button', { name: 'تعديل «الأصل»' }))
    expect(screen.getByLabelText('العنوان')).toHaveValue('الأصل')
  })

  it('AC-3.3 saving a whitespace-only title is refused with an error and the original is kept', async () => {
    seedTasks([makeTask({ title: 'Keep me' })])
    const { user } = renderApp({ lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Edit “Keep me”' }))
    const title = screen.getByLabelText('Title')
    await user.clear(title)
    await user.type(title, '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const form = screen.getByRole('form', { name: 'Edit task “Keep me”' })
    expect(within(form).getByRole('alert')).toHaveTextContent('Enter a task title.')
    expect(title).toHaveAccessibleDescription('Enter a task title.')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveFocus()
    expect(storedTasks()[0].title).toBe('Keep me')

    await user.keyboard('{Escape}')
    expect(screen.getByText('Keep me')).toBeInTheDocument()
  })

  it('AC-3.3 clearing the due date is allowed', async () => {
    seedTasks([makeTask({ title: 'Dated', due: '2026-03-05' })])
    const { user } = renderApp({ lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Edit “Dated”' }))
    await user.clear(screen.getByLabelText('Due date'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(rowFor('Dated')).not.toHaveTextContent(/Due/)
    expect(storedTasks()[0]).toMatchObject({ title: 'Dated', due: null })
  })
})

/** US-1 Add a task (AC-1.1 .. AC-1.3). */
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp, rowFor, storedTasks, visibleTitles } from './helpers'

afterEach(() => {
  vi.useRealTimers()
})

describe('US-1 Add a task', () => {
  it('AC-1.1 Enter adds a trimmed active task, clears the input, and keeps focus (en)', async () => {
    const { user } = renderApp({ lang: 'en' })
    const input = screen.getByLabelText('Task')

    await user.type(input, '  Buy milk  {Enter}')

    expect(visibleTitles()).toEqual(['Buy milk'])
    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(storedTasks()).toEqual([expect.objectContaining({ title: 'Buy milk', done: false, due: null })])
  })

  it('AC-1.1 Add button adds a trimmed task, clears the input, and returns focus to it (en)', async () => {
    const { user } = renderApp({ lang: 'en' })
    const input = screen.getByLabelText('Task')

    await user.type(input, '  Call the bank ')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(visibleTitles()).toEqual(['Call the bank'])
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('AC-1.1 adds a task in Arabic with the Arabic labels', async () => {
    const { user } = renderApp({ lang: 'ar' })
    const input = screen.getByLabelText('المهمة')

    await user.type(input, '  شراء الحليب  ')
    await user.click(screen.getByRole('button', { name: 'إضافة' }))

    expect(visibleTitles()).toEqual(['شراء الحليب'])
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.getByText('مهمة واحدة متبقية')).toBeInTheDocument()
  })

  it('AC-1.1 (A-4) new tasks appear newest first', async () => {
    const { user } = renderApp({ lang: 'en' })
    const input = screen.getByLabelText('Task')
    await user.type(input, 'First{Enter}')
    await user.type(input, 'Second{Enter}')
    await user.type(input, 'Third{Enter}')
    expect(visibleTitles()).toEqual(['Third', 'Second', 'First'])
  })

  it('AC-1.2 empty and whitespace-only titles create no task and announce an error (en)', async () => {
    const { user } = renderApp({ lang: 'en' })
    const input = screen.getByLabelText('Task')

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a task title.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a task title.')
    expect(input).toHaveFocus()

    await user.type(input, '    {Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a task title.')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('No tasks yet. Add one above.')).toBeInTheDocument()
    expect(storedTasks()).toEqual([])

    // The error clears once a real title is typed.
    await user.type(input, 'x')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('alert')).toHaveTextContent('')
  })

  it('AC-1.2 whitespace-only title is refused with an Arabic error message (ar)', async () => {
    const { user } = renderApp({ lang: 'ar' })
    await user.type(screen.getByLabelText('المهمة'), '   {Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('اكتب عنوان المهمة.')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('AC-1.3 a picked due date is shown on the task (en) and the date input is cleared', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 2, 1, 12, 0, 0)) // 1 March 2026, so 5 March is not overdue
    const { user } = renderApp({ lang: 'en' })
    const due = screen.getByLabelText('Due date (optional)')

    await user.type(screen.getByLabelText('Task'), 'Pay rent')
    await user.type(due, '2026-03-05')
    expect(due).toHaveValue('2026-03-05')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(rowFor('Pay rent')).toHaveTextContent('Due March 5, 2026')
    expect(due).toHaveValue('')
    expect(storedTasks()[0]).toMatchObject({ title: 'Pay rent', due: '2026-03-05' })
  })

  it('AC-1.3 a picked due date is shown in Arabic with Western digits (ar)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 2, 1, 12, 0, 0))
    const { user } = renderApp({ lang: 'ar' })

    await user.type(screen.getByLabelText('المهمة'), 'دفع الإيجار')
    await user.type(screen.getByLabelText('تاريخ الاستحقاق (اختياري)'), '2026-03-05')
    await user.click(screen.getByRole('button', { name: 'إضافة' }))

    const row = rowFor('دفع الإيجار')
    expect(row).toHaveTextContent('تستحق في 5 مارس 2026')
    expect(row.textContent).not.toMatch(/[٠-٩]/) // A-3: no Arabic-Indic digits
  })

  it('AC-1.3 with no due date picked, the task shows no date', async () => {
    const { user } = renderApp({ lang: 'en' })
    await user.type(screen.getByLabelText('Task'), 'No date{Enter}')

    const row = rowFor('No date')
    expect(row).not.toHaveTextContent(/Due/)
    expect(row.querySelector('.task__due')).toBeNull()
    expect(storedTasks()[0].due).toBeNull()
  })
})

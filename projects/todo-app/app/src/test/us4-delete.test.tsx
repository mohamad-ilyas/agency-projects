/** US-4 Delete a task (AC-4.1). */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeTask, renderApp, seedTasks, storedTasks, visibleTitles } from './helpers'

describe('US-4 Delete a task', () => {
  it('AC-4.1 Delete removes the task from the list and storage and updates the count (en)', async () => {
    seedTasks([makeTask({ title: 'Keep' }), makeTask({ title: 'Remove' })])
    const { user } = renderApp({ lang: 'en' })
    expect(screen.getByText('2 tasks left')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete “Remove”' }))

    expect(visibleTitles()).toEqual(['Keep'])
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    expect(storedTasks().map((t) => t.title)).toEqual(['Keep'])
    // Deletion is announced and focus moves to the list heading (not lost to <body>).
    expect(screen.getByText('Deleted “Remove”.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your tasks' })).toHaveFocus()
  })

  it('AC-4.1 deleting the last task shows the empty state and stores an empty list (ar)', async () => {
    seedTasks([makeTask({ title: 'وحيدة' })])
    const { user } = renderApp({ lang: 'ar' })

    await user.click(screen.getByRole('button', { name: 'حذف «وحيدة»' }))

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('لا توجد مهام بعد. أضف مهمة من الأعلى.')).toBeInTheDocument()
    expect(screen.getByText('لا توجد مهام متبقية')).toBeInTheDocument()
    expect(storedTasks()).toEqual([])
  })

  it('AC-4.1 deleting a done task leaves the active count unchanged', async () => {
    seedTasks([makeTask({ title: 'Active' }), makeTask({ title: 'Finished', done: true })])
    const { user } = renderApp({ lang: 'en' })
    await user.click(screen.getByRole('button', { name: 'Delete “Finished”' }))
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    expect(storedTasks().map((t) => t.title)).toEqual(['Active'])
  })
})

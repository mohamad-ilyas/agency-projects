/** US-2 Complete a task (AC-2.1, AC-2.2). */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeTask, renderApp, rowFor, seedTasks, storedTasks, visibleTitles } from './helpers'

describe('US-2 Complete a task', () => {
  it('AC-2.1 ticking an active task marks it done and the count goes down by 1 (en)', async () => {
    seedTasks([makeTask({ title: 'Alpha' }), makeTask({ title: 'Beta' })])
    const { user } = renderApp({ lang: 'en' })
    expect(screen.getByText('2 tasks left')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Alpha' }))

    expect(screen.getByRole('checkbox', { name: 'Alpha' })).toBeChecked()
    expect(rowFor('Alpha')).toHaveClass('task--done')
    expect(rowFor('Beta')).not.toHaveClass('task--done')
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    expect(storedTasks().find((t) => t.title === 'Alpha')?.done).toBe(true)
  })

  it('AC-2.1 ticking with the keyboard (Space) works and updates the Arabic count (ar)', async () => {
    seedTasks([makeTask({ title: 'أ' }), makeTask({ title: 'ب' }), makeTask({ title: 'ج' })])
    const { user } = renderApp({ lang: 'ar' })
    expect(screen.getByText('3 مهام متبقية')).toBeInTheDocument()

    screen.getByRole('checkbox', { name: 'ب' }).focus()
    await user.keyboard(' ')

    expect(screen.getByRole('checkbox', { name: 'ب' })).toBeChecked()
    expect(screen.getByText('مهمتان متبقيتان')).toBeInTheDocument()
  })

  it('AC-2.2 unticking a done task makes it active again and the count goes up by 1', async () => {
    seedTasks([makeTask({ title: 'Alpha', done: true }), makeTask({ title: 'Beta' })])
    const { user } = renderApp({ lang: 'en' })
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    expect(rowFor('Alpha')).toHaveClass('task--done')

    await user.click(screen.getByRole('checkbox', { name: 'Alpha' }))

    expect(screen.getByRole('checkbox', { name: 'Alpha' })).not.toBeChecked()
    expect(rowFor('Alpha')).not.toHaveClass('task--done')
    expect(screen.getByText('2 tasks left')).toBeInTheDocument()
    expect(storedTasks().find((t) => t.title === 'Alpha')?.done).toBe(false)
  })

  it('AC-2.2 (A-4) toggling does not change the list order', async () => {
    seedTasks([makeTask({ title: 'Old' }), makeTask({ title: 'Mid' }), makeTask({ title: 'New' })])
    const { user } = renderApp({ lang: 'en' })
    expect(visibleTitles()).toEqual(['New', 'Mid', 'Old'])
    await user.click(screen.getByRole('checkbox', { name: 'Mid' }))
    await user.click(screen.getByRole('checkbox', { name: 'Mid' }))
    expect(visibleTitles()).toEqual(['New', 'Mid', 'Old'])
  })
})

/** US-5 Filter tasks (AC-5.1, AC-5.2). */
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeTask, renderApp, seedTasks, visibleTitles } from './helpers'

function filterButtons(groupName: string) {
  return within(screen.getByRole('group', { name: groupName })).getAllByRole('button')
}

describe('US-5 Filter tasks', () => {
  it('AC-5.1 All / Active / Done show only matching tasks and mark the selected filter with aria-pressed (en)', async () => {
    seedTasks([makeTask({ title: 'A1' }), makeTask({ title: 'D1', done: true }), makeTask({ title: 'A2' })])
    const { user } = renderApp({ lang: 'en' })

    expect(filterButtons('Show tasks').map((b) => b.textContent)).toEqual(['All', 'Active', 'Done'])
    expect(screen.getByRole('button', { name: 'All', pressed: true })).toBeInTheDocument()
    expect(visibleTitles()).toEqual(['A2', 'D1', 'A1'])

    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(visibleTitles()).toEqual(['A2', 'A1'])
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(visibleTitles()).toEqual(['D1'])
    expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(visibleTitles()).toEqual(['A2', 'D1', 'A1'])
  })

  it('AC-5.1 a task ticked under the Active filter leaves the Active view (ar)', async () => {
    seedTasks([makeTask({ title: 'أولى' }), makeTask({ title: 'ثانية' })])
    const { user } = renderApp({ lang: 'ar' })

    await user.click(screen.getByRole('button', { name: 'النشطة' }))
    expect(screen.getByRole('button', { name: 'النشطة' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('checkbox', { name: 'أولى' }))
    expect(visibleTitles()).toEqual(['ثانية'])

    await user.click(screen.getByRole('button', { name: 'المنجزة' }))
    expect(visibleTitles()).toEqual(['أولى'])
  })

  it('AC-5.2 empty-state texts for All, Active and Done in English', async () => {
    const first = renderApp({ lang: 'en' })
    expect(screen.getByText('No tasks yet. Add one above.')).toBeInTheDocument()
    first.unmount()

    seedTasks([makeTask({ title: 'Only done', done: true })])
    const second = renderApp()
    await second.user.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('No active tasks.')).toBeInTheDocument()
    second.unmount()

    seedTasks([makeTask({ title: 'Only active' })])
    const third = renderApp()
    await third.user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('No completed tasks yet.')).toBeInTheDocument()
  })

  it('AC-5.2 empty-state texts for All, Active and Done in Arabic, and they follow a language switch', async () => {
    const first = renderApp({ lang: 'ar' })
    expect(screen.getByText('لا توجد مهام بعد. أضف مهمة من الأعلى.')).toBeInTheDocument()
    // Switching language re-renders the empty state in English, and back.
    await first.user.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByText('No tasks yet. Add one above.')).toBeInTheDocument()
    await first.user.click(screen.getByRole('button', { name: 'العربية' }))
    first.unmount()

    seedTasks([makeTask({ title: 'منجزة', done: true })])
    const second = renderApp()
    await second.user.click(screen.getByRole('button', { name: 'النشطة' }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('لا توجد مهام نشطة.')).toBeInTheDocument()
    second.unmount()

    seedTasks([makeTask({ title: 'نشطة' })])
    const third = renderApp()
    await third.user.click(screen.getByRole('button', { name: 'المنجزة' }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('لا توجد مهام منجزة بعد.')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEYS } from './lib/storage'

describe('App (smoke)', () => {
  it('adds, completes, and persists a task', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEYS.lang, 'en')
    render(<App />)

    const input = screen.getByLabelText('Task')
    await user.type(input, '  Buy milk  {Enter}')

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.getByText('1 task left')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Buy milk' }))
    expect(screen.getByText('0 tasks left')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) ?? '[]')[0]).toMatchObject({ title: 'Buy milk', done: true })
  })

  it('switches to Arabic and sets lang/dir on <html>', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEYS.lang, 'en')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'العربية' }))
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(localStorage.getItem(STORAGE_KEYS.lang)).toBe('ar')
    expect(screen.getByRole('button', { name: 'الكل' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('edits inline: Escape cancels, empty title is refused, Enter saves', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEYS.lang, 'en')
    render(<App />)
    await user.type(screen.getByLabelText('Task'), 'Original{Enter}')

    await user.click(screen.getByRole('button', { name: 'Edit “Original”' }))
    await user.type(screen.getByLabelText('Title'), ' changed{Escape}')
    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit “Original”' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Edit “Original”' }))
    await user.clear(screen.getByLabelText('Title'))
    await user.keyboard('{Enter}')
    expect(screen.getByText('Enter a task title.')).toHaveAttribute('role', 'alert')
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    await user.keyboard('{Escape}')
    expect(screen.getByText('Original')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit “Original”' }))
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Renamed{Enter}')
    expect(screen.getByText('Renamed')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) ?? '[]')[0].title).toBe('Renamed')
  })
})

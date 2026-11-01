/** US-8 Theme (AC-8.1, AC-8.2). jsdom has no matchMedia, so prefers-color-scheme is mocked. */
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../lib/storage'
import { mockColorScheme, reload, renderApp } from './helpers'

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.style.colorScheme = ''
})

const html = () => document.documentElement

describe('US-8 Theme', () => {
  it('AC-8.1 first visit follows a dark system preference', () => {
    const mm = mockColorScheme(true)
    renderApp({ lang: 'en' })
    expect(mm.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(html()).toHaveAttribute('data-theme', 'dark')
    expect(html().style.colorScheme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull()
  })

  it('AC-8.1 first visit follows a light system preference', () => {
    mockColorScheme(false)
    renderApp({ lang: 'en' })
    expect(html()).toHaveAttribute('data-theme', 'light')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('AC-8.1 with no saved choice, a live system change is followed', () => {
    const mm = mockColorScheme(false)
    renderApp({ lang: 'en' })
    expect(html()).toHaveAttribute('data-theme', 'light')
    mm.setSystemDark(true)
    expect(html()).toHaveAttribute('data-theme', 'dark')
  })

  it('AC-8.1 without matchMedia support the app falls back to light without crashing', () => {
    renderApp({ lang: 'en' })
    expect(html()).toHaveAttribute('data-theme', 'light')
  })

  it('AC-8.2 the toggle applies immediately, is saved, and survives reload (en)', async () => {
    mockColorScheme(false)
    const { user, unmount } = renderApp({ lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Dark mode' }))
    expect(html()).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark')

    reload(unmount)
    expect(html()).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC-8.2 switching back to light is saved and beats a dark system preference after reload (ar)', async () => {
    mockColorScheme(true)
    const { user, unmount } = renderApp({ lang: 'ar' })
    expect(html()).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getByRole('button', { name: 'الوضع الداكن' }))
    expect(html()).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('light')

    reload(unmount)
    expect(html()).toHaveAttribute('data-theme', 'light')
  })

  it('AC-8.2 once the user has chosen, system changes no longer override the choice', async () => {
    const mm = mockColorScheme(false)
    const { user } = renderApp({ lang: 'en' })
    await user.click(screen.getByRole('button', { name: 'Dark mode' }))
    mm.setSystemDark(false)
    mm.setSystemDark(true)
    mm.setSystemDark(false)
    expect(html()).toHaveAttribute('data-theme', 'dark')
  })

  it('AC-8.2 the theme toggle works from the keyboard (Enter)', async () => {
    mockColorScheme(false)
    const { user } = renderApp({ lang: 'en' })
    screen.getByRole('button', { name: 'Dark mode' }).focus()
    await user.keyboard('{Enter}')
    expect(html()).toHaveAttribute('data-theme', 'dark')
  })
})

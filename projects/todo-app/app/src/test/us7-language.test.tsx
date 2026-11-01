/** US-7 Language (AC-7.1 .. AC-7.3). */
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../lib/storage'
import { makeTask, reload, renderApp, seedTasks } from './helpers'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockBrowserLanguage(value: string) {
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(value)
}

describe('US-7 Language', () => {
  it('AC-7.1 selecting Arabic translates the UI and sets <html lang="ar" dir="rtl">', async () => {
    seedTasks([makeTask({ title: 'Task one' })])
    const { user } = renderApp({ lang: 'en' })
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')

    await user.click(screen.getByRole('button', { name: 'العربية' }))

    const html = document.documentElement
    expect(html).toHaveAttribute('lang', 'ar')
    expect(html).toHaveAttribute('dir', 'rtl')
    expect(document.title).toBe('المهام')
    expect(screen.getByRole('heading', { level: 1, name: 'المهام' })).toBeInTheDocument()
    expect(screen.getByLabelText('المهمة')).toBeInTheDocument()
    expect(screen.getByLabelText('تاريخ الاستحقاق (اختياري)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إضافة' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'مهامك' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'عرض المهام' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'الإعدادات' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'الوضع الداكن' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تعديل «Task one»' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'حذف «Task one»' })).toBeInTheDocument()
    expect(screen.getByText('مهمة واحدة متبقية')).toBeInTheDocument()
    // The switch is labelled in the target language and marked with that language.
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('lang', 'en')
    // No English UI chrome left over (task titles are user data and may be any language).
    for (const leftover of ['Tasks', 'Add', 'Your tasks', 'All', 'Active', 'Done', 'Dark mode']) {
      expect(screen.queryByRole('button', { name: leftover })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: leftover })).not.toBeInTheDocument()
    }
  })

  it('AC-7.1 selecting English sets <html lang="en" dir="ltr"> and English text', async () => {
    const { user } = renderApp({ lang: 'ar' })
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    expect(document.title).toBe('Tasks')
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument()
    expect(screen.getByLabelText('Task')).toBeInTheDocument()
    expect(screen.getByText('0 tasks left')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('lang', 'ar')
  })

  it('AC-7.1 task titles use dir="auto" for mixed-language text (NFR-1)', () => {
    seedTasks([makeTask({ title: 'Meeting مع الفريق' })])
    renderApp({ lang: 'ar' })
    expect(screen.getByText('Meeting مع الفريق')).toHaveAttribute('dir', 'auto')
    expect(screen.getByLabelText('المهمة')).toHaveAttribute('dir', 'auto')
  })

  it('AC-7.2 the chosen language is saved and used again after reload', async () => {
    mockBrowserLanguage('en-US')
    const { user, unmount } = renderApp()
    await user.click(screen.getByRole('button', { name: 'العربية' }))
    expect(localStorage.getItem(STORAGE_KEYS.lang)).toBe('ar')

    reload(unmount)
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('heading', { level: 1, name: 'المهام' })).toBeInTheDocument()
  })

  it('AC-7.2 a saved English choice wins over an Arabic browser language', () => {
    mockBrowserLanguage('ar-SA')
    renderApp({ lang: 'en' })
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument()
  })

  it.each([
    ['ar', 'ar', 'rtl'],
    ['ar-SA', 'ar', 'rtl'],
    ['AR-eg', 'ar', 'rtl'],
    ['en-US', 'en', 'ltr'],
    ['fr-FR', 'en', 'ltr'],
    ['', 'en', 'ltr'],
  ])('AC-7.3 first visit with navigator.language "%s" uses %s (%s) and saves nothing', (browserLang, lang, dir) => {
    mockBrowserLanguage(browserLang)
    renderApp()
    expect(document.documentElement).toHaveAttribute('lang', lang)
    expect(document.documentElement).toHaveAttribute('dir', dir)
    expect(screen.getByRole('heading', { level: 1, name: lang === 'ar' ? 'المهام' : 'Tasks' })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEYS.lang)).toBeNull()
  })

  it('AC-7.3 an invalid saved language value falls back to the browser language', () => {
    localStorage.setItem(STORAGE_KEYS.lang, 'de')
    mockBrowserLanguage('ar-JO')
    renderApp()
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
  })
})

import type { Theme } from './storage'

export const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Browser chrome colour per theme; must match --color-bg in index.css. */
export const THEME_COLORS: Record<Theme, string> = {
  light: '#f6f7f9',
  dark: '#0f1115',
}

export function systemTheme(): Theme {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Applies the effective theme to <html> and the theme-color meta tags. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', THEME_COLORS[theme]))
}

/** US-12 Language and accessibility: AC-12.1 .. AC-12.5 */
import { act, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectLang, MESSAGES } from '../lib/i18n'
import { MemoryBroker } from '../lib/transport'
import { createGame, enterName, move, mount, playDrawXStarts, startGame } from './helpers'

const LATIN = /[A-Za-z]/

/** Visible text and accessible-name attributes that contain Latin letters, ignoring user names (bdi, avatar initial),
 *  the "English" switch (lang="en"), X/O marks and the share URL. */
function latinLeftovers(root: HTMLElement): string[] {
  const bad: string[] = []
  const skip = (el: Element | null) => !!el?.closest('bdi, .avatar, [lang="en"], [dir="ltr"], input')
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent?.trim() ?? ''
    if (!text || skip(n.parentElement)) continue
    // Player names (user content) and X/O marks may appear inside translated sentences.
    if (!LATIN.test(text.replace(/\b(Alice|Bob|X|O)\b/g, ''))) continue
    bad.push(text)
  }
  for (const el of root.querySelectorAll('[aria-label], [title], [placeholder]')) {
    if (skip(el)) continue
    for (const attr of ['aria-label', 'title', 'placeholder']) {
      const v = el.getAttribute(attr)
      // Allow player names and marks inside labels.
      const stripped = v?.replace(/\b(Alice|Bob|X|O)\b/g, '')
      if (stripped && LATIN.test(stripped)) bad.push(`${attr}=${v}`)
    }
  }
  return bad
}

function setLanguages(langs: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(langs)
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(langs[0] ?? '')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('US-12 Language and accessibility', () => {
  it('AC-12.1 every UI string has an Arabic translation', () => {
    const en = MESSAGES.en as unknown as Record<string, unknown>
    const ar = MESSAGES.ar as unknown as Record<string, unknown>
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort())
    const sample = (v: unknown): string =>
      typeof v === 'string'
        ? v
        : typeof v === 'function'
          ? String((v as (...a: unknown[]) => unknown)('', '', 0, ''))
          : Object.values(v as object).join(' ')
    for (const key of Object.keys(ar)) {
      if (key === 'otherLanguageName' || key === 'markName') continue
      const text = sample(ar[key])
      expect.soft(text, key).toMatch(/[؀-ۿ]/)
      expect.soft(text.replace(/\b[XO]\b/g, ''), key).not.toMatch(LATIN)
    }
  })

  it('AC-12.1 choosing Arabic makes all text Arabic with RTL layout, and the choice persists on reload', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'us12-a-host')
    await enterName(host, 'Alice')
    const id = await createGame(host)
    const a = mount(broker, 'us12-a')
    await a.user.click(a.q.getByRole('button', { name: 'Language: العربية' }))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(latinLeftovers(a.host)).toEqual([])
    await enterName(a, 'Bob', 'اسمك', 'متابعة')
    // Lobby in Arabic.
    const list = await a.q.findByTestId('lobby-list')
    expect(within(list).getByText('لعبة Alice')).toBeInTheDocument()
    expect(latinLeftovers(a.host)).toEqual([])
    // Game screen in Arabic.
    await a.user.click(within(list).getByRole('button', { name: 'الانضمام إلى لعبة Alice' }))
    await waitFor(() => expect(a.q.getByTestId('turn')).toHaveTextContent('دور Alice'))
    expect(latinLeftovers(a.host)).toEqual([])
    expect(document.title).toBe('إكس أو أونلاين')
    a.unmount()

    const reloaded = mount(broker, 'us12-a', { hash: `#/game/${id}` })
    await waitFor(() => expect(reloaded.q.getByTestId('turn')).toHaveTextContent('دور Alice'))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(reloaded.q.getByRole('button', { name: 'اللغة: English' })).toBeInTheDocument()
  })

  it('AC-12.2 on a first visit the language follows the browser, with English as fallback', () => {
    expect(detectLang(['ar-EG', 'en'])).toBe('ar')
    expect(detectLang(['fr-FR', 'ar'])).toBe('ar')
    expect(detectLang(['en-GB', 'ar'])).toBe('en')
    expect(detectLang(['fr-FR', 'de'])).toBe('en')
    expect(detectLang([])).toBe('en')
    expect(detectLang(undefined)).toBe('en')
  })

  it('AC-12.2 (UI) Arabic browser → Arabic UI; unsupported browser language → English; saved choice wins', async () => {
    const broker = new MemoryBroker()
    setLanguages(['ar-SA'])
    const a = mount(broker, 'us12-b1')
    expect(a.q.getByLabelText('اسمك')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    a.unmount()

    setLanguages(['fr-FR'])
    const b = mount(broker, 'us12-b2')
    expect(b.q.getByLabelText('Your name')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    await b.user.click(b.q.getByRole('button', { name: /العربية/ }))
    b.unmount()
    const b2 = mount(broker, 'us12-b2') // browser still French, saved choice Arabic
    expect(b2.q.getByLabelText('اسمك')).toBeInTheDocument()
  })

  it('AC-12.3 arrow keys move focus between cells (clamped at edges) and Enter places my mark', async () => {
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us12-c')
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    const cell = (i: number) => host.q.getByTestId(`cell-${i}`)
    // Roving tabindex: exactly one cell in the tab order (the centre).
    expect(host.q.getAllByRole('button', { name: /Row \d, column \d/ }).filter((b) => b.tabIndex === 0)).toEqual([cell(4)])
    act(() => cell(4).focus())
    await host.user.keyboard('{ArrowRight}')
    expect(cell(5)).toHaveFocus()
    await host.user.keyboard('{ArrowRight}') // clamped at the edge
    expect(cell(5)).toHaveFocus()
    await host.user.keyboard('{ArrowDown}{ArrowDown}{ArrowLeft}')
    expect(cell(7)).toHaveFocus()
    await host.user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowLeft}')
    expect(cell(0)).toHaveFocus()
    expect(cell(0).tabIndex).toBe(0)
    await host.user.keyboard('{Enter}')
    await waitFor(() => expect(guest.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X'))
    // Guest: Enter on an occupied cell does nothing; Enter on an empty one places O.
    const g = (i: number) => guest.q.getByTestId(`cell-${i}`)
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    act(() => g(4).focus())
    await guest.user.keyboard('{ArrowUp}{ArrowLeft}{Enter}')
    expect(g(0)).toHaveAccessibleName('Row 1, column 1, X')
    await guest.user.keyboard('{ArrowRight}{Enter}')
    await waitFor(() => expect(cell(1)).toHaveAccessibleName('Row 1, column 2, O'))
  })

  it('AC-12.3 in Arabic (RTL page) the board keeps LTR positions so arrows match what both players see', async () => {
    const broker = new MemoryBroker()
    const { host } = await startGame(broker, 'us12-d')
    await host.user.click(host.q.getByRole('button', { name: /العربية/ }))
    const board = host.q.getByTestId('board')
    expect(board).toHaveAttribute('dir', 'ltr')
    act(() => host.q.getByTestId('cell-4').focus())
    await host.user.keyboard('{ArrowRight}')
    expect(host.q.getByTestId('cell-5')).toHaveFocus()
  })

  it('AC-12.4 each cell has a row/column/content label in the current language', async () => {
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us12-e')
    const cells = within(host.q.getByRole('group', { name: 'Game board' })).getAllByRole('button')
    expect(cells).toHaveLength(9)
    expect(cells.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Row 1, column 1, empty',
      'Row 1, column 2, empty',
      'Row 1, column 3, empty',
      'Row 2, column 1, empty',
      'Row 2, column 2, empty',
      'Row 2, column 3, empty',
      'Row 3, column 1, empty',
      'Row 3, column 2, empty',
      'Row 3, column 3, empty',
    ])
    await move(host, 2, [host, guest])
    expect(host.q.getByTestId('cell-2')).toHaveAccessibleName('Row 1, column 3, X')
    await guest.user.click(guest.q.getByRole('button', { name: /العربية/ }))
    expect(guest.q.getByRole('group', { name: 'لوحة اللعب' })).toBeInTheDocument()
    expect(guest.q.getByTestId('cell-2')).toHaveAccessibleName('الصف 1، العمود 3، X')
    expect(guest.q.getByTestId('cell-8')).toHaveAccessibleName('الصف 3، العمود 3، فارغ')
  })

  it('AC-12.5 a polite live region announces turn changes and results', async () => {
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us12-f')
    const live = (app: typeof host) => app.q.getByTestId('live-region')
    expect(live(host)).toHaveAttribute('aria-live', 'polite')
    expect(live(host)).toHaveAttribute('role', 'status')
    await waitFor(() => expect(live(host)).toHaveTextContent('Bob joined. X moves first. Your turn'))
    await move(host, 0, [host, guest])
    await waitFor(() => expect(live(host)).toHaveTextContent('Bob’s turn'))
    await waitFor(() => expect(live(guest)).toHaveTextContent('Your turn'))
    await move(guest, 3, [host, guest])
    await move(host, 1, [host, guest])
    await move(guest, 4, [host, guest])
    await move(host, 2, [host, guest])
    await waitFor(() => expect(live(host)).toHaveTextContent('You win!'))
    await waitFor(() => expect(live(guest)).toHaveTextContent('Alice wins'))
  })

  it('AC-12.5 a draw is announced, and announcements follow the current language', async () => {
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us12-g')
    await guest.user.click(guest.q.getByRole('button', { name: /العربية/ }))
    await playDrawXStarts(host, guest)
    await waitFor(() => expect(host.q.getByTestId('live-region')).toHaveTextContent('Draw'))
    await waitFor(() => expect(guest.q.getByTestId('live-region')).toHaveTextContent('تعادل'))
  })
})

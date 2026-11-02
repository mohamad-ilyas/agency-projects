/**
 * US-11 Animation: AC-11.1, AC-11.2.
 * Partial by nature: jsdom does not run CSS animations or evaluate media queries (vite test css:false), so these
 * tests check the observable hooks (SVG stroke elements, classes, keyframes and the reduced-motion stylesheet
 * block) and that every function works with reduced motion requested. Visual playback needs a manual check.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryBroker } from '../lib/transport'
import { createGame, enterName, mount, playTopRowWin, startGame } from './helpers'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8') // vitest runs from the app root

function block(selectorStart: string, source = css): string {
  const i = source.indexOf(selectorStart)
  if (i < 0) return ''
  const open = source.indexOf('{', i)
  let depth = 0
  for (let j = open; j < source.length; j++) {
    if (source[j] === '{') depth++
    else if (source[j] === '}' && --depth === 0) return source.slice(open + 1, j)
  }
  return ''
}

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia
})

describe('US-11 Animation', () => {
  it('AC-11.1 placed marks are SVG strokes that draw; the win line is drawn (partial: hooks only)', async () => {
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us11-a')
    await playTopRowWin(host, guest)
    await waitFor(() => expect(guest.q.getByTestId('result')).toBeInTheDocument())
    const x = guest.q.getByTestId('cell-0').querySelector('svg.mark.mark--x')!
    expect(x.querySelectorAll('.mark__stroke[pathLength="1"]')).toHaveLength(2)
    const o = guest.q.getByTestId('cell-3').querySelector('svg.mark.mark--o')!
    expect(o.querySelectorAll('circle.mark__stroke[pathLength="1"]')).toHaveLength(1)
    expect(guest.host.querySelector('svg.winline line[pathLength="1"]')).not.toBeNull()
    // Stylesheet: the strokes animate via stroke-dashoffset keyframes.
    expect(block('@keyframes draw')).toMatch(/stroke-dashoffset:\s*0/)
    expect(css).toMatch(/\.mark__stroke[^{]*\{[^}]*stroke-dashoffset:\s*1/)
    expect(css).toMatch(/\.winline line[^{]*\{[^}]*animation:\s*draw/)
  })

  it('AC-11.1 screens enter with a transition class (partial: hooks only)', async () => {
    const a = mount(new MemoryBroker(), 'us11-b')
    expect(a.host.querySelector('.name-card.enter')).not.toBeNull()
    await enterName(a, 'Alice')
    expect(a.host.querySelector('.hero.enter')).not.toBeNull()
    await createGame(a)
    expect(a.q.getByTestId('game').className).toContain('enter')
    // main is keyed by screen, so each screen change remounts and replays the enter animation.
    expect(css).toMatch(/\.enter\s*\{[^}]*animation:\s*screen-in/)
    expect(block('@keyframes screen-in')).not.toBe('')
  })

  it('AC-11.2 with reduced motion, animations are removed or reduced to fades (stylesheet check)', () => {
    const reduced = block('@media (prefers-reduced-motion: reduce)')
    expect(reduced).not.toBe('')
    expect(reduced).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(reduced).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
    // Marks and the win line appear fully drawn, confetti/background motion removed, screens fade.
    expect(reduced).toMatch(/\.mark__stroke,\s*\.winline line\s*\{\s*stroke-dashoffset:\s*0/)
    expect(reduced).toMatch(/\.confetti,\s*\.bg__blob\s*\{\s*display:\s*none/)
    expect(reduced).toMatch(/\.enter,\s*\.result\s*\{\s*animation:\s*fade/)
    expect(block('@keyframes fade')).toMatch(/opacity:\s*0/)
  })

  it('AC-11.2 all functions still work when the OS requests reduced motion', async () => {
    const matchMedia = vi.fn((q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }))
    Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true, writable: true })
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us11-c')
    await playTopRowWin(host, guest)
    expect(await host.q.findByTestId('result')).toHaveTextContent('You win!')
    await host.user.click(host.q.getByRole('button', { name: 'Play again' }))
    await guest.user.click(await guest.q.findByRole('button', { name: 'Play again' }))
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn'))
  })
})

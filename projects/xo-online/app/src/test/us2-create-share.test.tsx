/** US-2 Create and share: AC-2.1 .. AC-2.4 */
import { waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryBroker } from '../lib/transport'
import { createGame, enterName, mount, retainedRoom } from './helpers'

function setShare(fn: ((data: ShareData) => Promise<void>) | undefined) {
  if (fn) Object.defineProperty(navigator, 'share', { value: fn, configurable: true, writable: true })
  else delete (navigator as { share?: unknown }).share
}

afterEach(() => setShare(undefined))

describe('US-2 Create and share', () => {
  it('AC-2.1 Create game makes a unique id, seats me as X, and shows the waiting screen with …/#/game/<id>', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'us2-a')
    await enterName(a, 'Alice')
    const id = await createGame(a)
    expect(id).toMatch(/^[a-z0-9]{8}$/)
    expect(a.q.getByTestId('waiting')).toHaveTextContent('Waiting for an opponent')
    expect(a.q.getByTestId('game')).toHaveAttribute('data-seat', 'X')
    expect(a.q.getByTestId('share-link')).toHaveValue(`https://example.test/xo/#/game/${id}`)
    expect(a.router.get()).toBe(`#/game/${id}`)
    const room = retainedRoom(broker, id)!
    expect(room.players[0]?.name).toBe('Alice')
    expect(room.players[1]).toBeNull()
    expect(room.status).toBe('waiting')

    // A second game gets a different id.
    a.router.navigate('#/')
    const id2 = await createGame(a)
    expect(id2).not.toBe(id)
    expect(retainedRoom(broker, id2)).not.toBeNull()
  })

  it('AC-2.2 Copy link copies the link and shows a confirmation', async () => {
    const a = mount(new MemoryBroker(), 'us2-b')
    await enterName(a, 'Alice')
    const id = await createGame(a)
    await a.user.click(a.q.getByRole('button', { name: 'Copy link' }))
    // userEvent installs a clipboard stub on navigator; read back what the app wrote.
    expect(await navigator.clipboard.readText()).toBe(`https://example.test/xo/#/game/${id}`)
    expect(await a.q.findByRole('button', { name: /Link copied/ })).toBeInTheDocument()
    expect(a.q.getByTestId('live-region')).toHaveTextContent('Link copied')
  })

  it('AC-2.2 when copying fails, an error with a manual fallback is shown', async () => {
    const a = mount(new MemoryBroker(), 'us2-c')
    await enterName(a, 'Alice')
    await createGame(a)
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'))
    await a.user.click(a.q.getByRole('button', { name: 'Copy link' }))
    expect(await a.q.findByText(/Could not copy/, { selector: 'p.field-error' })).toBeInTheDocument()
    expect(a.q.getByTestId('live-region')).toHaveTextContent('Could not copy')
  })

  it('AC-2.3 with Web Share the Share button opens navigator.share with the link (partial: native sheet not testable in jsdom)', async () => {
    const share = vi.fn<(d: ShareData) => Promise<void>>().mockResolvedValue(undefined)
    setShare(share)
    const a = mount(new MemoryBroker(), 'us2-d')
    await enterName(a, 'Alice')
    const id = await createGame(a)
    await a.user.click(a.q.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalledTimes(1)
    expect(share.mock.calls[0][0]).toMatchObject({
      url: `https://example.test/xo/#/game/${id}`,
      text: 'Alice invites you to a game of XO',
    })
  })

  it('AC-2.3 without Web Share the Share button is hidden', async () => {
    setShare(undefined)
    expect('share' in navigator).toBe(false)
    const a = mount(new MemoryBroker(), 'us2-e')
    await enterName(a, 'Alice')
    await createGame(a)
    expect(a.q.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(a.q.queryByRole('button', { name: 'Share' })).toBeNull()
  })

  it('AC-2.4 a created game is listed in the lobby for anyone', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'us2-f-host')
    await enterName(host, 'Alice')
    await createGame(host)
    // A visitor who opens the lobby afterwards gets it from the retained state.
    const visitor = mount(broker, 'us2-f-visitor')
    await enterName(visitor, 'Zed')
    const list = await visitor.q.findByTestId('lobby-list')
    expect(within(list).getByText('Alice’s game')).toBeInTheDocument()
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(1))
  })
})

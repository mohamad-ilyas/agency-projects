/** US-6 Locked: AC-6.1, AC-6.2, plus the GameScreen join-retry regression (seat O frees up). */
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { moveRoom, joinRoom } from '../lib/room'
import { MemoryBroker } from '../lib/transport'
import { enterName, move, mount, retainedRaw, retainedRoom, startGame } from './helpers'

describe('US-6 Locked', () => {
  it('AC-6.1 with both seats taken, a third visitor sees "This game is locked", a lobby link, and no board controls', async () => {
    const broker = new MemoryBroker()
    const { id } = await startGame(broker, 'us6-a')
    const third = mount(broker, 'us6-a-third', { hash: `#/game/${id}` })
    await enterName(third, 'Carol')
    const locked = await third.q.findByTestId('locked')
    expect(locked).toHaveTextContent('This game is locked')
    expect(third.q.queryByTestId('board')).toBeNull()
    expect(third.q.queryAllByRole('button', { name: /Row \d, column \d/ })).toHaveLength(0)
    expect(third.q.queryByRole('button', { name: 'Play again' })).toBeNull()
    expect(third.q.queryByRole('button', { name: 'Leave game' })).toBeNull()
    await third.user.click(third.q.getByRole('link', { name: 'Back to lobby' }))
    expect(third.router.get()).toBe('#/')
  })

  it('AC-6.2 nothing the locked visitor does changes the game for the two players', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us6-b')
    await move(host, 0, [host, guest])
    const before = retainedRaw(broker, id)
    const third = mount(broker, 'us6-b-third', { hash: `#/game/${id}` })
    await enterName(third, 'Carol')
    await third.q.findByTestId('locked')
    // Interact with everything on the locked screen, reload it, change language.
    await third.user.click(third.q.getByRole('button', { name: /العربية/ }))
    await third.user.click(third.q.getByRole('button', { name: /English/ }))
    third.unmount()
    const thirdAgain = mount(broker, 'us6-b-third', { hash: `#/game/${id}` })
    await thirdAgain.q.findByTestId('locked')
    await new Promise((r) => setTimeout(r, 20))
    expect(retainedRaw(broker, id)).toBe(before)
    // The pure model rejects a non-seated client too.
    const room = retainedRoom(broker, id)!
    expect(moveRoom(room, { clientId: 'third-client-xyz', index: 4, now: Date.now() })).toEqual({ ok: false, reason: 'not-seated' })
    expect(joinRoom(room, { clientId: 'third-client-xyz', name: 'Carol', now: Date.now() })).toEqual({ ok: false, reason: 'locked' })
    // Players continue normally.
    await move(guest, 4, [host, guest])
    expect(host.q.getByTestId('player-O')).toHaveTextContent('Bob')
  })

  it('regression (James, GameScreen join retry): a visitor on the locked screen takes seat O when it frees up', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us6-c')
    const third = mount(broker, 'us6-c-third', { hash: `#/game/${id}` })
    await enterName(third, 'Carol')
    await third.q.findByTestId('locked')

    // Bob leaves → room re-opens with Alice waiting.
    await guest.user.click(guest.q.getByRole('button', { name: 'Leave game' }))

    // Carol (still on the same screen, no reload) is seated as O and play starts.
    await waitFor(() => expect(third.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    await waitFor(() => expect(host.q.getByTestId('player-O')).toHaveTextContent('Carol'))
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    const room = retainedRoom(broker, id)!
    expect(room.players.map((p) => p?.name)).toEqual(['Alice', 'Carol'])
    expect(room.status).toBe('playing')
  })

  it('regression (join retry): when X leaves, O becomes X and the locked visitor takes seat O', async () => {
    const broker = new MemoryBroker()
    const { host, id } = await startGame(broker, 'us6-d')
    const third = mount(broker, 'us6-d-third', { hash: `#/game/${id}` })
    await enterName(third, 'Carol')
    await third.q.findByTestId('locked')
    await host.user.click(host.q.getByRole('button', { name: 'Leave game' }))
    await waitFor(() => expect(third.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    expect(retainedRoom(broker, id)!.players.map((p) => p?.name)).toEqual(['Bob', 'Carol'])
  })
})

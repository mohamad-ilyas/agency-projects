/** US-3 Join via link: AC-3.1 .. AC-3.4 */
import { waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { topics } from '../lib/client'
import { createRoom, ROOM_EXPIRE_MS } from '../lib/room'
import { MemoryBroker } from '../lib/transport'
import { advance, createGame, enterName, mount, press, retainedRaw, retainedRoom, settle, startGame, typeName, useFakeClock } from './helpers'

afterEach(() => {
  vi.useRealTimers()
})

describe('US-3 Join via link', () => {
  it('AC-3.1 with seat O free, opening the link takes seat O, both see the board, X moves first', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us3-a')
    expect(guest.q.getByTestId('game')).toHaveAttribute('data-seat', 'O')
    expect(host.q.getByTestId('game')).toHaveAttribute('data-seat', 'X')
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Alice’s turn'))
    expect(host.q.getByTestId('player-O')).toHaveTextContent('Bob')
    expect(guest.q.getByTestId('player-X')).toHaveTextContent('Alice')
    const room = retainedRoom(broker, id)!
    expect(room.status).toBe('playing')
    expect(room.turn).toBe('X')
    expect(room.players[1]?.name).toBe('Bob')
  })

  it('AC-3.2 without a saved name, the link asks for the name first and then joins', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'us3-b-host')
    await enterName(host, 'Alice')
    const id = await createGame(host)

    const guest = mount(broker, 'us3-b-guest', { hash: `#/game/${id}` })
    expect(guest.q.getByLabelText('Your name')).toBeInTheDocument()
    expect(guest.q.queryByTestId('board')).toBeNull()
    expect(retainedRoom(broker, id)!.players[1]).toBeNull() // not joined before naming
    await enterName(guest, 'Bob')
    await waitFor(() => expect(guest.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    expect(retainedRoom(broker, id)!.players[1]?.name).toBe('Bob')
  })

  it('AC-3.3 reopening the link in the same browser returns me to my seat, not a new one', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us3-c')
    const before = retainedRaw(broker, id)
    guest.unmount()
    host.unmount()

    const host2 = mount(broker, 'us3-c-host', { hash: `#/game/${id}` })
    const guest2 = mount(broker, 'us3-c-guest', { hash: `#/game/${id}` })
    await waitFor(() => expect(host2.q.getByTestId('game')).toHaveAttribute('data-seat', 'X'))
    await waitFor(() => expect(guest2.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    // Reclaiming the same seat does not write a new state.
    expect(retainedRaw(broker, id)).toBe(before)
  })

  it('AC-3.4 an unknown id shows "Game not found" after 5 s with a link to the lobby', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const a = mount(broker, 'us3-d', { hash: '#/game/zzzzzz99', notFoundMs: 5000 })
    await settle()
    await typeName(a, 'Dan')
    expect(a.q.getByTestId('game-loading')).toBeInTheDocument()
    await advance(4900)
    expect(a.q.queryByTestId('not-found')).toBeNull()
    await advance(200)
    const nf = a.q.getByTestId('not-found')
    expect(nf).toHaveTextContent('Game not found')
    await press(a.q.getByRole('link', { name: 'Back to lobby' }))
    expect(a.router.get()).toBe('#/')
    expect(a.q.getByRole('heading', { name: 'Play XO online' })).toBeInTheDocument()
  })

  it('AC-3.4 the default not-found wait is 5 s', async () => {
    useFakeClock()
    const a = mount(new MemoryBroker(), 'us3-d2', { hash: '#/game/zzzzzz98' }) // App default notFoundMs
    await settle()
    await typeName(a, 'Dan')
    await advance(4999)
    expect(a.q.queryByTestId('not-found')).toBeNull()
    await advance(2)
    expect(a.q.getByTestId('not-found')).toBeInTheDocument()
  })

  it('AC-3.4 an expired (idle > 24 h) or cleared game shows "Game not found"', async () => {
    const broker = new MemoryBroker()
    const old = createRoom({ id: 'oldgame1', clientId: 'someone-else-1', name: 'Old', now: Date.now() - ROOM_EXPIRE_MS - 60_000 })
    broker.retained.set(topics.room(old.id), JSON.stringify(old))
    const a = mount(broker, 'us3-e', { hash: '#/game/oldgame1', notFoundMs: 60_000 })
    await enterName(a, 'Dan')
    expect(await a.q.findByTestId('not-found')).toBeInTheDocument()
    // Regression (bug found by EMP-012): the visitor must not take seat O and revive the expired game.
    await new Promise((r) => setTimeout(r, 50))
    expect(retainedRoom(broker, 'oldgame1')!.players[1]).toBeNull()
    expect(a.q.getByTestId('not-found')).toBeInTheDocument()

    // Cleared: the host leaves its waiting game (empty retained payload); a later visitor gets "Game not found".
    const host = mount(broker, 'us3-e-host')
    await enterName(host, 'Alice')
    const id = await createGame(host)
    await host.user.click(host.q.getByRole('button', { name: 'Leave game' }))
    expect(retainedRaw(broker, id)).toBeUndefined()
    const visitor = mount(broker, 'us3-e-visitor', { hash: `#/game/${id}`, notFoundMs: 300 })
    await enterName(visitor, 'Eve')
    expect(await visitor.q.findByTestId('not-found')).toBeInTheDocument()
  })
})

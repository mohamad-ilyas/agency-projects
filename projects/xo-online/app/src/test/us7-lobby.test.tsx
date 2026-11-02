/** US-7 Lobby: AC-7.1 .. AC-7.5 (fake clock for the 10-minute idle rule). */
import { waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { topics } from '../lib/client'
import { createRoom, joinRoom, LOBBY_IDLE_MS, openGames } from '../lib/room'
import { MemoryBroker } from '../lib/transport'
import { advance, createGame, enterName, mount, press, settle, startGame, typeName, useFakeClock, sentence } from './helpers'

afterEach(() => {
  vi.useRealTimers()
})

describe('US-7 Lobby', () => {
  it('AC-7.1 the main URL lists waiting games with host name and created time', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'us7-a-host')
    await enterName(host, 'Alice')
    const id = await createGame(host)
    const createdAt = JSON.parse(broker.retained.get(topics.room(id))!).createdAt as number

    const viewer = mount(broker, 'us7-a-viewer')
    await enterName(viewer, 'Zed')
    const list = await viewer.q.findByTestId('lobby-list')
    const item = within(list).getByRole('listitem')
    expect(item).toHaveTextContent('Alice’s game')
    const time = item.querySelector('time')!
    expect(time).toHaveAttribute('datetime', new Date(createdAt).toISOString())
    expect(time).toHaveTextContent(/^Created (now|\d+ (seconds?|minutes?) ago)$/)
  })

  it('AC-7.1 relative created time is shown for older games (fake clock)', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const room = createRoom({ id: 'abcdef12', clientId: 'host-client-1', name: 'Hana', now: Date.now() - 3 * 60_000 })
    broker.retained.set(topics.room(room.id), JSON.stringify(room))
    const viewer = mount(broker, 'us7-b')
    await settle()
    await typeName(viewer, 'Zed')
    await advance(700)
    expect(viewer.q.getByTestId('lobby-list')).toHaveTextContent('Created 3 minutes ago')
    expect(viewer.q.getByTestId('lobby-list')).toHaveTextContent('Hana’s game')
  })

  it('AC-7.2 full games and games idle > 10 minutes are not listed', () => {
    const now = 1_700_000_000_000
    const waiting = createRoom({ id: 'wait0001', clientId: 'host-client-1', name: 'A', now })
    const res = joinRoom(createRoom({ id: 'full0001', clientId: 'host-client-2', name: 'B', now }), {
      clientId: 'guest-client-2',
      name: 'C',
      now,
    })
    const full = res.ok ? res.room : null
    const stale = createRoom({ id: 'stal0001', clientId: 'host-client-3', name: 'D', now: now - LOBBY_IDLE_MS - 1 })
    const edge = createRoom({ id: 'edge0001', clientId: 'host-client-4', name: 'E', now: now - LOBBY_IDLE_MS })
    expect(openGames([waiting, full!, stale, edge], now).map((r) => r.id)).toEqual(['wait0001', 'edge0001'])
  })

  it('AC-7.3 Join on a listed game joins it as O, as in AC-3.1', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'us7-c-host')
    await enterName(host, 'Alice')
    const id = await createGame(host)
    const guest = mount(broker, 'us7-c-guest')
    await enterName(guest, 'Bob')
    const list = await guest.q.findByTestId('lobby-list')
    await guest.user.click(within(list).getByRole('button', { name: 'Join Alice’s game' }))
    expect(guest.router.get()).toBe(`#/game/${id}`)
    await waitFor(() => expect(guest.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    expect(guest.q.getByTestId('turn')).toHaveTextContent('Alice’s turn')
  })

  it('AC-7.4 with no waiting games, an empty state with a working "Create game" is shown', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'us7-d')
    await enterName(a, 'Alice')
    const empty = await a.q.findByTestId('lobby-empty')
    expect(empty).toHaveTextContent('No games are waiting right now.')
    await a.user.click(within(empty).getByRole('button', { name: /Create game/ }))
    expect(await a.q.findByTestId('waiting')).toBeInTheDocument()
  })

  it('AC-7.5 the open lobby updates without reload when games are created, filled, or go stale', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const viewer = mount(broker, 'us7-e-viewer')
    await settle()
    await typeName(viewer, 'Zed')
    await advance(700)
    expect(viewer.q.getByTestId('lobby-empty')).toBeInTheDocument()

    // Created → appears.
    const host = mount(broker, 'us7-e-host')
    await settle()
    await typeName(host, 'Alice')
    await press(host.q.getAllByRole('button', { name: /Create game/ })[0])
    expect(within(viewer.q.getByTestId('lobby-list')).getByText(sentence('Alice’s game'))).toBeInTheDocument()

    // Filled → disappears.
    const id = /#\/game\/(\w+)$/.exec((host.q.getByTestId('share-link') as HTMLInputElement).value)![1]
    const guest = mount(broker, 'us7-e-guest', { hash: `#/game/${id}` })
    await settle()
    await typeName(guest, 'Bob')
    expect(viewer.q.getByTestId('lobby-empty')).toBeInTheDocument()

    // Another game goes stale (idle > 10 min) → disappears on the periodic refresh.
    const host2 = mount(broker, 'us7-e-host2')
    await settle()
    await typeName(host2, 'Hana')
    await press(host2.q.getAllByRole('button', { name: /Create game/ })[0])
    expect(within(viewer.q.getByTestId('lobby-list')).getByText(sentence('Hana’s game'))).toBeInTheDocument()
    // F-05: a game is idle once its host is gone (an online waiting host keeps refreshing it), so the host leaves.
    host2.unmount()
    await advance(LOBBY_IDLE_MS - 30_000)
    expect(within(viewer.q.getByTestId('lobby-list')).getByText(sentence('Hana’s game'))).toBeInTheDocument()
    await advance(60_000)
    expect(viewer.q.getByTestId('lobby-empty')).toBeInTheDocument()
  })

  it('AC-7.2/7.5 (UI) a full game is not listed for a newcomer', async () => {
    const broker = new MemoryBroker()
    await startGame(broker, 'us7-f')
    const viewer = mount(broker, 'us7-f-viewer')
    await enterName(viewer, 'Zed')
    expect(await viewer.q.findByTestId('lobby-empty')).toBeInTheDocument()
  })
})

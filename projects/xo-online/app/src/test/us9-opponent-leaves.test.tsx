/** US-9 Opponent leaves: AC-9.1 .. AC-9.3 (fake clock for the 15 s presence threshold). */
import { act, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OFFLINE_AFTER_MS } from '../lib/client'
import { MemoryBroker } from '../lib/transport'
import { advance, enterName, move, mount, retainedRoom, settle, startGame, startGameSync, typeName, useFakeClock } from './helpers'

afterEach(() => {
  vi.useRealTimers()
})

describe('US-9 Opponent leaves', () => {
  it('AC-9.1 after the opponent closes the tab, their name shows "offline" once ~15 s pass without contact', async () => {
    expect(OFFLINE_AFTER_MS).toBe(15_000)
    useFakeClock()
    const broker = new MemoryBroker()
    const { host, guest } = await startGameSync(broker, 'us9-a')
    await advance(1000)
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online')

    // Tab closed silently (no pagehide, no Last Will): heartbeats just stop.
    guest.unmount()
    await advance(OFFLINE_AFTER_MS - 2000)
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online')
    await advance(3000)
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Offline')
    expect(host.q.getByTestId('live-region')).toHaveTextContent('Bob is offline.')
  })

  it('AC-9.1 heartbeats keep a connected opponent online beyond 15 s', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const { host, guest } = await startGameSync(broker, 'us9-b')
    await advance(60_000)
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online')
    expect(guest.q.getByTestId('presence-X')).toHaveTextContent('Online')
  })

  it('AC-9.1 a lost connection (broker Last Will) or tab close (pagehide) marks the opponent offline', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const { host, guest } = await startGameSync(broker, 'us9-c')
    await advance(1000)
    act(() => guest.transport.simulateDrop())
    await settle()
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Offline')
    act(() => guest.transport.simulateReconnect())
    await advance(1000)
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online')
    fireEvent(window, new Event('pagehide')) // all mounted apps publish "offline"
    await settle()
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Offline')
  })

  it('AC-9.2 while a seat holder is offline, a stranger opening the link still sees the locked screen', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGameSync(broker, 'us9-d')
    guest.unmount()
    await advance(OFFLINE_AFTER_MS + 5000)
    expect(host.q.getByTestId('presence-O')).toHaveTextContent('Offline')
    const stranger = mount(broker, 'us9-d-stranger', { hash: `#/game/${id}` })
    await settle()
    await typeName(stranger, 'Mallory')
    expect(stranger.q.getByTestId('locked')).toBeInTheDocument()
    expect(retainedRoom(broker, id)!.players[1]?.name).toBe('Bob')
  })

  it('AC-9.3 the offline player returns in the same browser, retakes the seat, and play continues', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us9-e')
    await move(host, 0, [host, guest])
    act(() => guest.transport.simulateDrop())
    await waitFor(() => expect(host.q.getByTestId('presence-O')).toHaveTextContent('Offline'))
    guest.unmount()

    const back = mount(broker, 'us9-e-guest', { hash: `#/game/${id}` })
    await waitFor(() => expect(back.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    await waitFor(() => expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online'))
    expect(back.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X')
    await move(back, 4, [host, back])
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    // A different browser cannot take the seat (seat reclaim is same-browser only, spec A6).
    const other = mount(broker, 'us9-e-other', { hash: `#/game/${id}` })
    await enterName(other, 'Bob')
    expect(await other.q.findByTestId('locked')).toBeInTheDocument()
  })
})

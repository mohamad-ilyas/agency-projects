/** US-8 Rematch and score: AC-8.1 .. AC-8.4 */
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { starterForRound } from '../lib/game'
import { MemoryBroker } from '../lib/transport'
import { move, mount, playDrawXStarts, playTopRowWin, retainedRoom, startGame, type Mounted } from './helpers'

async function rematch(first: Mounted, second: Mounted) {
  await first.user.click(await first.q.findByRole('button', { name: 'Play again' }))
  await second.user.click(await second.q.findByRole('button', { name: 'Play again' }))
}

describe('US-8 Rematch and score', () => {
  it('AC-8.1 "Play again" shows "Waiting for <opponent>"; the new round starts only after both press it', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us8-a')
    await playTopRowWin(host, guest)
    await host.user.click(await host.q.findByRole('button', { name: 'Play again' }))
    expect(await host.q.findByTestId('waiting-rematch')).toHaveTextContent('Waiting for Bob…')
    expect(host.q.queryByRole('button', { name: 'Play again' })).toBeNull()
    // Opponent is told; round has not started for anyone.
    expect(await guest.q.findByText('Alice wants to play again')).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 20))
    expect(retainedRoom(broker, id)!.status).toBe('finished')
    expect(retainedRoom(broker, id)!.round).toBe(1)
    expect(guest.q.getByText('Round 1')).toBeInTheDocument()
    expect(host.q.getByTestId('result')).toBeInTheDocument()

    await guest.user.click(guest.q.getByRole('button', { name: 'Play again' }))
    await waitFor(() => expect(host.q.getByText('Round 2')).toBeInTheDocument())
    await waitFor(() => expect(guest.q.getByText('Round 2')).toBeInTheDocument())
    expect(host.q.queryByTestId('result')).toBeNull()
    for (let i = 0; i < 9; i++) expect(host.q.getByTestId(`cell-${i}`)).toHaveAccessibleName(/empty/)
  })

  it('AC-8.2 the starting player alternates each round (round 1: X)', async () => {
    expect([1, 2, 3, 4].map(starterForRound)).toEqual(['X', 'O', 'X', 'O'])
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us8-b')
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn')) // round 1: X
    await playTopRowWin(host, guest)
    await rematch(host, guest)
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn')) // round 2: O
    expect(host.q.getByTestId('turn')).toHaveTextContent('Bob’s turn')
    expect(retainedRoom(broker, id)!.starter).toBe('O')
    // Round 2: O wins the top row (O 0, X 3, O 1, X 4, O 2).
    const both = [host, guest]
    await move(guest, 0, both)
    await move(host, 3, both)
    await move(guest, 1, both)
    await move(host, 4, both)
    await move(guest, 2, both)
    await rematch(guest, host)
    await waitFor(() => expect(host.q.getByText('Round 3')).toBeInTheDocument())
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn')) // round 3: X
  })

  it('AC-8.3 the score shows wins per player name and draws, carried across rounds', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us8-c')
    await playTopRowWin(host, guest) // Alice +1
    await rematch(host, guest)
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    await playDrawXStarts(guest, host) // round 2: O (Bob) starts; draw
    await waitFor(() => expect(host.q.getByTestId('result')).toHaveTextContent('Draw'))
    for (const app of [host, guest]) {
      await waitFor(() => expect(app.q.getByTestId('draws')).toHaveAccessibleName('Draws: 1'))
      expect(app.q.getByTestId('player-X')).toHaveAccessibleName(/^Alice, X, score 1,/)
      expect(app.q.getByTestId('player-O')).toHaveAccessibleName(/^Bob, O, score 0,/)
    }
    expect(retainedRoom(broker, id)!.scores).toEqual({ x: 1, o: 0, draws: 1 })
  })

  it('AC-8.4 after a reload the player returns to the seat with board and score unchanged', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us8-d')
    await playTopRowWin(host, guest)
    await rematch(host, guest)
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    await move(guest, 4, [host, guest])
    await move(host, 0, [host, guest])
    const before = retainedRoom(broker, id)!
    host.unmount()

    const host2 = mount(broker, 'us8-d-host', { hash: `#/game/${id}` })
    await waitFor(() => expect(host2.q.getByTestId('game')).toHaveAttribute('data-seat', 'X'))
    expect(host2.q.getByTestId('cell-4')).toHaveAccessibleName('Row 2, column 2, O')
    expect(host2.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X')
    expect(host2.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/)
    expect(host2.q.getByText('Round 2')).toBeInTheDocument()
    expect(host2.q.getByTestId('turn')).toHaveTextContent('Bob’s turn')
    expect(retainedRoom(broker, id)).toEqual(before)
  })
})

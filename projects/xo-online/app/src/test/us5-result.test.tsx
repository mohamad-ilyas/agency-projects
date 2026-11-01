/** US-5 Result: AC-5.1 .. AC-5.3 */
import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LINES, outcomeOf, scoreRound, type Cell } from '../lib/game'
import { MemoryBroker } from '../lib/transport'
import { move, playDrawXStarts, playTopRowWin, retainedRoom, startGame } from './helpers'

describe('US-5 Result', () => {
  it('AC-5.1 every row, column and diagonal is detected as a win with its line', () => {
    expect(LINES).toHaveLength(8)
    for (const line of LINES) {
      const board: Cell[] = Array(9).fill(null)
      for (const i of line) board[i] = 'O'
      expect(outcomeOf(board)).toEqual({ kind: 'win', mark: 'O', line })
    }
  })

  it('AC-5.1 both screens show the winner by name and the winning line is highlighted', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us5-a')
    await playTopRowWin(host, guest)
    expect(await guest.q.findByTestId('result')).toHaveTextContent('Alice wins')
    expect(await host.q.findByTestId('result')).toHaveTextContent('You win!')
    // The winner is also identified by name on the winner's own screen (player card).
    expect(host.q.getByTestId('player-X')).toHaveTextContent('Alice')
    for (const app of [host, guest]) {
      for (const i of [0, 1, 2]) expect(app.q.getByTestId(`cell-${i}`).className).toContain('cell--win')
      for (const i of [3, 4, 5, 6, 7, 8]) expect(app.q.getByTestId(`cell-${i}`).className).not.toContain('cell--win')
      expect(app.host.querySelector('svg.winline line')).not.toBeNull()
    }
    expect(retainedRoom(broker, id)!.result).toEqual({ kind: 'win', mark: 'X', line: [0, 1, 2] })
  })

  it('AC-5.1 an O win is shown by name to X', async () => {
    const broker = new MemoryBroker()
    const { host, guest } = await startGame(broker, 'us5-b')
    const both = [host, guest]
    // X 0, O 2, X 1, O 4, X 8, O 6 → O wins the anti-diagonal 2-4-6.
    await move(host, 0, both)
    await move(guest, 2, both)
    await move(host, 1, both)
    await move(guest, 4, both)
    await move(host, 8, both)
    await move(guest, 6, both)
    expect(await host.q.findByTestId('result')).toHaveTextContent('Bob wins')
    expect(await guest.q.findByTestId('result')).toHaveTextContent('You win!')
    for (const i of [2, 4, 6]) expect(host.q.getByTestId(`cell-${i}`).className).toContain('cell--win')
  })

  it('AC-5.2 a full board with no line shows "Draw" on both screens', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us5-c')
    await playDrawXStarts(host, guest)
    expect(await host.q.findByTestId('result')).toHaveTextContent('Draw')
    expect(await guest.q.findByTestId('result')).toHaveTextContent('Draw')
    expect(host.host.querySelector('svg.winline')).toBeNull()
    expect(retainedRoom(broker, id)!.result).toEqual({ kind: 'draw' })
    // A last move that fills the board AND completes a line is a win, not a draw.
    expect(outcomeOf(['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'])).toMatchObject({ kind: 'win', mark: 'X' })
  })

  it('AC-5.3 the score updates exactly once per round, even when the final state is re-delivered', async () => {
    const r1 = scoreRound({ x: 0, o: 0, draws: 0 }, { kind: 'draw' }, 1, 0)
    expect(r1).toEqual({ scores: { x: 0, o: 0, draws: 1 }, scoredRound: 1 })
    expect(scoreRound(r1.scores, { kind: 'draw' }, 1, r1.scoredRound)).toEqual(r1)

    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us5-d')
    await playTopRowWin(host, guest)
    await waitFor(() => expect(guest.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/))
    expect(host.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/)
    expect(host.q.getByTestId('player-O')).toHaveAccessibleName(/score 0/)
    // Network blip: both reconnect and receive the retained final state again.
    act(() => {
      host.transport.simulateDrop()
      guest.transport.simulateDrop()
    })
    act(() => {
      host.transport.simulateReconnect()
      guest.transport.simulateReconnect()
    })
    await waitFor(() => expect(host.q.getByTestId('status-pill')).toHaveAttribute('data-status', 'online'))
    await new Promise((r) => setTimeout(r, 20))
    for (const app of [host, guest]) {
      expect(app.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/)
      expect(app.q.getByTestId('draws')).toHaveAccessibleName('Draws: 0')
    }
    expect(retainedRoom(broker, id)!.scores).toEqual({ x: 1, o: 0, draws: 0 })
  })
})

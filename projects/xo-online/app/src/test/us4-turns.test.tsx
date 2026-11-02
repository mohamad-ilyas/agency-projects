/** US-4 Turns: AC-4.1 .. AC-4.4 */
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryBroker } from '../lib/transport'
import { move, playTopRowWin, retainedRaw, retainedRoom, startGame } from './helpers'

describe('US-4 Turns', () => {
  it('AC-4.1 on my turn, an empty cell gets my mark, the turn passes, and the opponent sees it', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us4-a')
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    await move(host, 4, [host, guest])
    expect(host.q.getByTestId('cell-4')).toHaveAccessibleName('Row 2, column 2, X')
    expect(guest.q.getByTestId('cell-4')).toHaveAccessibleName('Row 2, column 2, X')
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    expect(host.q.getByTestId('turn')).toHaveTextContent('Bob’s turn')
    expect(retainedRoom(broker, id)!.turn).toBe('O')

    await move(guest, 0, [host, guest])
    expect(host.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, O')
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
  })

  it('AC-4.2 picking an occupied cell changes nothing', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us4-b')
    await move(host, 0, [host, guest])
    const before = retainedRaw(broker, id)
    await guest.user.click(guest.q.getByTestId('cell-0'))
    expect(guest.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X')
    expect(guest.q.getByTestId('cell-0')).toHaveAttribute('aria-disabled', 'true')
    expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn')
    expect(retainedRaw(broker, id)).toBe(before)
  })

  it('AC-4.3 when it is not my turn, no cell changes and the board shows whose turn it is', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us4-c')
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Alice’s turn'))
    const before = retainedRaw(broker, id)
    for (const i of [0, 4, 8]) await guest.user.click(guest.q.getByTestId(`cell-${i}`))
    for (let i = 0; i < 9; i++) {
      expect(guest.q.getByTestId(`cell-${i}`)).toHaveAccessibleName(/empty/)
      expect(guest.q.getByTestId(`cell-${i}`)).toHaveAttribute('aria-disabled', 'true')
    }
    expect(retainedRaw(broker, id)).toBe(before)
    expect(guest.q.getByTestId('player-X').className).toContain('player--active')
    expect(host.q.getByTestId('cell-4')).toHaveAccessibleName(/empty/)
  })

  it('AC-4.4 after the round is over, picking any cell changes nothing', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us4-d')
    await playTopRowWin(host, guest)
    await waitFor(() => expect(guest.q.getByTestId('result')).toBeInTheDocument())
    const before = retainedRaw(broker, id)
    for (const app of [host, guest]) {
      for (const i of [5, 6, 7, 8]) await app.user.click(app.q.getByTestId(`cell-${i}`))
    }
    for (const app of [host, guest]) {
      for (const i of [5, 6, 7, 8]) expect(app.q.getByTestId(`cell-${i}`)).toHaveAccessibleName(/empty/)
    }
    expect(retainedRaw(broker, id)).toBe(before)
  })
})

/** End-to-end journey in jsdom: several app instances ("browsers") share one in-memory broker. */
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { createMemoryRouter } from '../lib/router'
import { MemoryBroker, MemoryTransport } from '../lib/transport'
import { sentence } from './helpers'

function mount(broker: MemoryBroker, ns: string, hash = '#/') {
  const transport = new MemoryTransport(broker)
  const router = createMemoryRouter(hash)
  const host = document.createElement('div')
  host.dataset.ns = ns
  document.body.appendChild(host)
  const user = userEvent.setup()
  const r = render(<App transport={transport} prefsNamespace={ns} router={router} notFoundMs={300} />, { container: host })
  return { ...r, transport, router, user, q: within(host) }
}

async function enterName(app: ReturnType<typeof mount>, name: string) {
  await app.user.type(app.q.getByLabelText('Your name'), name)
  await app.user.click(app.q.getByRole('button', { name: 'Continue' }))
}

async function createGame(app: ReturnType<typeof mount>): Promise<string> {
  await app.user.click((await app.q.findAllByRole('button', { name: /Create game/ }))[0])
  const link = (await app.q.findByTestId('share-link')) as HTMLInputElement
  const id = /#\/game\/([a-z0-9]+)$/.exec(link.value)?.[1]
  if (!id) throw new Error('no id in ' + link.value)
  return id
}

describe('XO journey', () => {
  it('validates the name (AC-1.1, AC-1.2) and prefills it on revisit (AC-1.3)', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'n1')
    await a.user.click(a.q.getByRole('button', { name: 'Continue' }))
    expect(a.q.getByRole('alert')).toHaveTextContent('Enter your name.')
    await a.user.type(a.q.getByLabelText('Your name'), '   ')
    await a.user.click(a.q.getByRole('button', { name: 'Continue' }))
    expect(a.q.getByRole('alert')).toHaveTextContent('Enter your name.')
    await a.user.type(a.q.getByLabelText('Your name'), 'x'.repeat(21))
    await a.user.click(a.q.getByRole('button', { name: 'Continue' }))
    expect(a.q.getByRole('alert')).toHaveTextContent('20 characters or fewer')
    await a.user.clear(a.q.getByLabelText('Your name'))
    await enterName(a, '  Alice  ')
    expect(await a.q.findByText('Alice')).toBeInTheDocument()
    a.unmount()
    const again = mount(broker, 'n1')
    await again.user.click(await again.q.findByRole('button', { name: 'Change name' }))
    expect(again.q.getByLabelText('Your name')).toHaveValue('Alice')
  })

  it('create → lobby → join → win → score → rematch → locked third visitor → reload keeps seat', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'host')
    await enterName(host, 'Alice')
    expect(await host.q.findByTestId('lobby-empty')).toBeInTheDocument() // AC-7.4

    const id = await createGame(host) // AC-2.1
    expect(host.q.getByTestId('waiting')).toBeInTheDocument()

    // Guest sees the game in the lobby (AC-2.4, AC-7.1) and joins (AC-7.3, AC-3.1).
    const guest = mount(broker, 'guest')
    await enterName(guest, 'Bob')
    const list = await guest.q.findByTestId('lobby-list')
    expect(within(list).getByText(sentence('Alice’s game'))).toBeInTheDocument()
    await guest.user.click(within(list).getByRole('button', { name: 'Join Alice’s game' }))

    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Alice’s turn'))
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    // Lobby no longer lists the full game (AC-7.2, AC-7.5) — checked via a third viewer below.

    // Wrong turn: nothing changes (AC-4.3).
    await guest.user.click(guest.q.getByTestId('cell-4'))
    expect(guest.q.getByTestId('cell-4')).toHaveAccessibleName('Row 2, column 2, empty')

    const move = async (app: typeof host, i: number) => {
      await app.user.click(app.q.getByTestId(`cell-${i}`))
      await waitFor(() => expect(host.q.getByTestId(`cell-${i}`)).not.toHaveAccessibleName(/empty/))
      await waitFor(() => expect(guest.q.getByTestId(`cell-${i}`)).not.toHaveAccessibleName(/empty/))
    }
    await move(host, 0)
    // Occupied: nothing changes (AC-4.2).
    await guest.user.click(guest.q.getByTestId('cell-0'))
    expect(guest.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X')
    await move(guest, 3)
    await move(host, 1)
    await move(guest, 4)
    await move(host, 2)

    // AC-5.1 winner by name on both screens; AC-5.3 score once.
    expect(await host.q.findByTestId('result')).toHaveTextContent('You win!')
    expect(await guest.q.findByTestId('result')).toHaveTextContent('Alice wins')
    expect(guest.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/)
    // AC-4.4 round over: nothing changes.
    await guest.user.click(guest.q.getByTestId('cell-8'))
    expect(guest.q.getByTestId('cell-8')).toHaveAccessibleName(/empty/)

    // AC-8.1 rematch needs both; AC-8.2 starter alternates.
    await host.user.click(host.q.getByRole('button', { name: 'Play again' }))
    expect(await host.q.findByTestId('waiting-rematch')).toHaveTextContent('Waiting for Bob')
    await guest.user.click(await guest.q.findByRole('button', { name: 'Play again' }))
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    expect(host.q.getByText('Round 2')).toBeInTheDocument()
    expect(host.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/) // AC-8.3

    // AC-6.1 third visitor sees locked; AC-6.2 nothing changes.
    const version = broker.retained.get(`aicos-xo/v1/rooms/${id}`)
    const third = mount(broker, 'third', `#/game/${id}`)
    await enterName(third, 'Carol')
    expect(await third.q.findByTestId('locked')).toBeInTheDocument()
    expect(third.q.queryByTestId('board')).toBeNull()
    expect(broker.retained.get(`aicos-xo/v1/rooms/${id}`)).toBe(version)
    third.router.navigate('#/')
    expect(await third.q.findByTestId('lobby-empty')).toBeInTheDocument() // full game not listed

    // AC-8.4 / AC-3.3 reload returns to the same seat with board and score unchanged.
    guest.unmount()
    const guest2 = mount(broker, 'guest', `#/game/${id}`)
    await waitFor(() => expect(guest2.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    expect(guest2.q.getByTestId('player-X')).toHaveAccessibleName(/score 1/)
  })

  it('shows "Game not found" for unknown ids (AC-3.4)', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'nf', '#/game/zzzzzz99')
    await enterName(a, 'Dan')
    expect(await a.q.findByTestId('not-found')).toBeInTheDocument()
  })

  it('arrow keys move focus on the board and Enter places a mark (AC-12.3, AC-12.4)', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'kh')
    await enterName(host, 'Alice')
    const id = await createGame(host)
    const guest = mount(broker, 'kg', `#/game/${id}`)
    await enterName(guest, 'Bob')
    await waitFor(() => expect(host.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    const center = host.q.getByTestId('cell-4')
    act(() => center.focus())
    await host.user.keyboard('{ArrowUp}{ArrowLeft}')
    expect(host.q.getByTestId('cell-0')).toHaveFocus()
    await host.user.keyboard('{Enter}')
    await waitFor(() => expect(guest.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X'))
  })

  it('marks the opponent offline after a drop and disables moves when offline (AC-9.1, AC-10.2)', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'oh')
    await enterName(host, 'Alice')
    const id = await createGame(host)
    const guest = mount(broker, 'og', `#/game/${id}`)
    await enterName(guest, 'Bob')
    await waitFor(() => expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online'))
    act(() => guest.transport.simulateDrop()) // Last Will → offline immediately
    await waitFor(() => expect(host.q.getByTestId('presence-O')).toHaveTextContent('Offline'))
    expect(guest.q.getByTestId('status-pill')).toHaveAttribute('data-status', 'offline')
    act(() => host.transport.simulateDrop())
    await waitFor(() => expect(host.q.getByTestId('cell-0')).toHaveAttribute('aria-disabled', 'true'))
    act(() => {
      host.transport.simulateReconnect()
      guest.transport.simulateReconnect()
    })
    await waitFor(() => expect(host.q.getByTestId('presence-O')).toHaveTextContent('Online'))
    await waitFor(() => expect(host.q.getByTestId('cell-0')).toHaveAttribute('aria-disabled', 'false'))
  })

  it('switches to Arabic with RTL and persists the choice (AC-12.1)', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'lang')
    await a.user.click(a.q.getByRole('button', { name: /العربية/ }))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(a.q.getByLabelText('اسمك')).toBeInTheDocument()
    a.unmount()
    const b = mount(broker, 'lang')
    expect(b.q.getByLabelText('اسمك')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })
})

/** US-10 Connection: AC-10.1 .. AC-10.3 */
import { act, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BroadcastTransport, MemoryBroker, MqttTransport } from '../lib/transport'
import { DeferredTransport, createGame, enterName, mount, playDrawXStarts, startGame } from './helpers'

// Fake MQTT.js client: lets us drive connect/offline/reconnect events without a broker.
type Handler = (...args: unknown[]) => void
const fakeClients: FakeClient[] = []
class FakeClient {
  handlers = new Map<string, Handler[]>()
  subscribed: string[] = []
  published: { topic: string; payload: string; retain: boolean }[] = []
  readonly url: string
  readonly opts: Record<string, unknown>
  constructor(url: string, opts: Record<string, unknown>) {
    this.url = url
    this.opts = opts
  }
  on(ev: string, cb: Handler) {
    this.handlers.set(ev, [...(this.handlers.get(ev) ?? []), cb])
    return this
  }
  emit(ev: string, ...args: unknown[]) {
    for (const h of this.handlers.get(ev) ?? []) h(...args)
  }
  subscribe(topic: string) {
    this.subscribed.push(topic)
  }
  unsubscribe() {}
  publish(topic: string, payload: string, o: { retain: boolean }) {
    this.published.push({ topic, payload, retain: o.retain })
  }
  end() {}
}
vi.mock('mqtt', () => ({
  connect: (url: string, opts: Record<string, unknown>) => {
    const c = new FakeClient(url, opts)
    fakeClients.push(c)
    return c
  },
}))

const transports: BroadcastTransport[] = []
afterEach(() => {
  for (const t of transports.splice(0)) t.close()
})

describe('US-10 Connection', () => {
  it('AC-10.1 the indicator shows connecting / online / offline on the lobby and game screens', async () => {
    const broker = new MemoryBroker()
    const transport = new DeferredTransport(broker)
    const a = mount(broker, 'us10-a', { transport })
    const pill = () => a.q.getByTestId('status-pill')
    expect(pill()).toHaveAttribute('data-status', 'connecting')
    expect(pill()).toHaveTextContent('Connection: Connecting')
    act(() => transport.go())
    await waitFor(() => expect(pill()).toHaveAttribute('data-status', 'online'))
    await enterName(a, 'Alice')
    expect(pill()).toHaveTextContent('Connection: Online') // lobby
    act(() => transport.simulateDrop())
    expect(pill()).toHaveAttribute('data-status', 'offline')
    expect(pill()).toHaveTextContent('Connection: Offline')
    act(() => transport.simulateReconnect())
    await waitFor(() => expect(pill()).toHaveAttribute('data-status', 'online'))
    await createGame(a)
    expect(a.q.getByTestId('waiting')).toBeInTheDocument()
    act(() => transport.simulateDrop())
    expect(pill()).toHaveAttribute('data-status', 'offline') // game screen
  })

  it('AC-10.2 offline disables moves, Create game and Play again; reconnect restores play', async () => {
    const broker = new MemoryBroker()
    const { host, guest, id } = await startGame(broker, 'us10-b')
    await waitFor(() => expect(host.q.getByTestId('cell-0')).toHaveAttribute('aria-disabled', 'false'))
    act(() => host.transport.simulateDrop())
    expect(host.q.getByRole('note')).toHaveTextContent('You are offline. Moves are paused')
    for (let i = 0; i < 9; i++) expect(host.q.getByTestId(`cell-${i}`)).toHaveAttribute('aria-disabled', 'true')
    await host.user.click(host.q.getByTestId('cell-0'))
    expect(host.q.getByTestId('cell-0')).toHaveAccessibleName(/empty/)
    // Meanwhile nothing reached the broker.
    expect(JSON.parse(broker.retained.get(`aicos-xo/v1/rooms/${id}`)!).board[0]).toBeNull()

    act(() => host.transport.simulateReconnect())
    await waitFor(() => expect(host.q.getByTestId('cell-0')).toHaveAttribute('aria-disabled', 'false'))
    expect(host.q.queryByRole('note')).toBeNull()
    await host.user.click(host.q.getByTestId('cell-0'))
    await waitFor(() => expect(guest.q.getByTestId('cell-0')).toHaveAccessibleName('Row 1, column 1, X'))

    // Lobby: Create game disabled while offline.
    const lobby = mount(broker, 'us10-b-lobby')
    await enterName(lobby, 'Zed')
    act(() => lobby.transport.simulateDrop())
    for (const b of lobby.q.getAllByRole('button', { name: /Create game/ })) expect(b).toBeDisabled()
    expect(lobby.q.getByText(/You are offline\. The list will refresh/)).toBeInTheDocument()
  })

  it('AC-10.2 the MQTT transport reports offline and reconnects automatically, re-subscribing for retained state (partial: no live broker)', async () => {
    const t = new MqttTransport('wss://broker.invalid/mqtt')
    const statuses: string[] = []
    t.onStatus((s) => statuses.push(s))
    t.subscribe('aicos-xo/v1/rooms/+', () => {})
    t.connect()
    await waitFor(() => expect(fakeClients).toHaveLength(1))
    const c = fakeClients[0]
    expect(c.opts.reconnectPeriod).toBeGreaterThan(0) // MQTT.js auto-reconnect is on
    c.emit('connect')
    expect(t.status).toBe('online')
    expect(c.subscribed).toEqual(['aicos-xo/v1/rooms/+'])
    c.emit('offline')
    expect(t.status).toBe('offline')
    c.emit('reconnect')
    expect(t.status).toBe('connecting')
    c.emit('connect')
    expect(t.status).toBe('online')
    expect(c.subscribed).toEqual(['aicos-xo/v1/rooms/+', 'aicos-xo/v1/rooms/+']) // re-subscribed → retained re-sent
    expect(statuses).toEqual(['online', 'offline', 'connecting', 'online'])
    t.close()
  })

  it('AC-10.3 in local test mode two tabs of one browser play a full round without the broker', async () => {
    // Two BroadcastTransports on one BroadcastChannel name + shared localStorage = two tabs of one browser.
    // perTabIdentity keeps identity in sessionStorage; distinct namespaces stand in for the two tabs' sessions.
    const broker = new MemoryBroker() // unused by these transports; proves no broker is involved
    const t1 = new BroadcastTransport()
    const t2 = new BroadcastTransport()
    transports.push(t1, t2)
    const tab1 = mount(broker, 'us10-c-tab1', { transport: t1, perTabIdentity: true })
    await enterName(tab1, 'Alice')
    const id = await createGame(tab1)
    expect(tab1.q.getByTestId('share-link')).toHaveValue(`https://example.test/xo/#/game/${id}`)
    const tab2 = mount(broker, 'us10-c-tab2', { transport: t2, perTabIdentity: true, hash: `#/game/${id}` })
    await enterName(tab2, 'Bob')
    await waitFor(() => expect(tab2.q.getByTestId('game')).toHaveAttribute('data-seat', 'O'))
    await waitFor(() => expect(tab1.q.getByTestId('turn')).toHaveTextContent('Your turn'))
    await playDrawXStarts(tab1, tab2)
    expect(await tab1.q.findByTestId('result')).toHaveTextContent('Draw')
    expect(await tab2.q.findByTestId('result')).toHaveTextContent('Draw')
    expect(broker.retained.size).toBe(0)
    expect(localStorage.getItem(`aicos-xo:retained:aicos-xo/v1/rooms/${id}`)).toContain('"draws":1')
  })
})

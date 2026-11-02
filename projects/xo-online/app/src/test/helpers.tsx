/**
 * Shared helpers for the per-story acceptance tests. Each mounted App is one "browser"
 * (own localStorage namespace + router); several apps share one in-memory broker.
 *
 * Two modes:
 * - real timers: use userEvent + findBy/waitFor (default).
 * - fake timers (presence 15 s, not-found 5 s, lobby idle 10 min): call `useFakeClock()` first, then use the
 *   synchronous `typeName`/`press` helpers and `settle()`/`advance()` instead of waitFor.
 */
import { act, fireEvent, render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi } from 'vitest'
import App from '../App'
import { topics } from '../lib/client'
import { parseRoom, type Room } from '../lib/room'
import { createMemoryRouter } from '../lib/router'
import { MemoryBroker, MemoryTransport, type Transport, type Will } from '../lib/transport'

export interface MountOpts {
  hash?: string
  notFoundMs?: number
  transport?: Transport
  perTabIdentity?: boolean
}

export function mount(broker: MemoryBroker, ns: string, opts: MountOpts = {}) {
  const transport = (opts.transport as MemoryTransport | undefined) ?? new MemoryTransport(broker)
  const router = createMemoryRouter(opts.hash ?? '#/')
  const host = document.createElement('div')
  host.dataset.ns = ns
  document.body.appendChild(host)
  const user = vi.isFakeTimers() ? userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) : userEvent.setup()
  const r = render(
    <App
      transport={transport}
      prefsNamespace={ns}
      router={router}
      perTabIdentity={opts.perTabIdentity}
      {...(opts.notFoundMs !== undefined ? { notFoundMs: opts.notFoundMs } : {})}
    />,
    { container: host },
  )
  return { ...r, transport, router, user, host, q: within(host) }
}

export type Mounted = ReturnType<typeof mount>

/** Real-timer name entry via userEvent. */
export async function enterName(app: Mounted, name: string, label = 'Your name', button = 'Continue') {
  await app.user.type(app.q.getByLabelText(label), name)
  await app.user.click(app.q.getByRole('button', { name: button }))
}

/** Real-timer: press Create game and return the new id from the share link. */
export async function createGame(app: Mounted): Promise<string> {
  await app.user.click((await app.q.findAllByRole('button', { name: /Create game/ }))[0])
  return idFromLink(app)
}

export async function idFromLink(app: Mounted): Promise<string> {
  const link = (await app.q.findByTestId('share-link')) as HTMLInputElement
  const id = /#\/game\/([a-z0-9]+)$/.exec(link.value)?.[1]
  if (!id) throw new Error('no id in ' + link.value)
  return id
}

/** Real-timer: host "Alice" creates a game, guest "Bob" joins via the link; both see the board. */
export async function startGame(broker: MemoryBroker, prefix: string) {
  const host = mount(broker, `${prefix}-host`)
  await enterName(host, 'Alice')
  const id = await createGame(host)
  const guest = mount(broker, `${prefix}-guest`, { hash: `#/game/${id}` })
  await enterName(guest, 'Bob')
  await guest.q.findByTestId('board')
  await host.q.findByTestId('board')
  return { host, guest, id }
}

/** Retained room state on the broker (what any newcomer would receive). */
export function retainedRoom(broker: MemoryBroker, id: string): Room | null {
  const raw = broker.retained.get(topics.room(id))
  return raw ? parseRoom(raw, id) : null
}

export function retainedRaw(broker: MemoryBroker, id: string): string | undefined {
  return broker.retained.get(topics.room(id))
}

// ---------------------------------------------------------------- fake clock helpers

export function useFakeClock() {
  // queueMicrotask stays real: MemoryTransport delivers on microtasks.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
}

/** Flush microtasks + React work a few rounds (message → state → effect → publish → …). */
export async function settle(rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
  }
}

export async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
  await settle()
}

/** Synchronous name entry (fake-timer safe). */
export async function typeName(app: Mounted, name: string) {
  fireEvent.change(app.q.getByLabelText('Your name'), { target: { value: name } })
  fireEvent.click(app.q.getByRole('button', { name: 'Continue' }))
  await settle()
}

export async function press(el: HTMLElement) {
  fireEvent.click(el)
  await settle()
}

/** Fake-timer variant of startGame. */
export async function startGameSync(broker: MemoryBroker, prefix: string) {
  const host = mount(broker, `${prefix}-host`)
  await settle()
  await typeName(host, 'Alice')
  await press(host.q.getAllByRole('button', { name: /Create game/ })[0])
  const link = host.q.getByTestId('share-link') as HTMLInputElement
  const id = /#\/game\/([a-z0-9]+)$/.exec(link.value)![1]
  const guest = mount(broker, `${prefix}-guest`, { hash: `#/game/${id}` })
  await settle()
  await typeName(guest, 'Bob')
  host.q.getByTestId('board')
  guest.q.getByTestId('board')
  return { host, guest, id }
}

/** A MemoryTransport that stays "connecting" until `go()` is called (to observe the connecting state). */
export class DeferredTransport extends MemoryTransport {
  private pending: { will?: Will } | undefined
  private released = false
  connect(opts?: { will?: Will }): void {
    this.pending = opts
    if (this.released) super.connect(opts)
  }
  go(): void {
    this.released = true
    super.connect(this.pending)
  }
}

/** Real-timer move: click a cell and wait until every listed app sees it filled. */
export async function move(app: Mounted, i: number, observers: Mounted[]) {
  await app.user.click(app.q.getByTestId(`cell-${i}`))
  for (const o of observers) {
    await waitFor(() => expect(o.q.getByTestId(`cell-${i}`)).not.toHaveAccessibleName(/empty|فارغ/))
  }
}

/** Alice (X) wins the top row: X 0, O 3, X 1, O 4, X 2. */
export async function playTopRowWin(host: Mounted, guest: Mounted) {
  const both = [host, guest]
  await move(host, 0, both)
  await move(guest, 3, both)
  await move(host, 1, both)
  await move(guest, 4, both)
  await move(host, 2, both)
}

/** Draw when X starts: X O X / X O O / O X X. */
export async function playDrawXStarts(x: Mounted, o: Mounted) {
  const both = [x, o]
  for (const [app, i] of [
    [x, 0],
    [o, 1],
    [x, 2],
    [o, 4],
    [x, 3],
    [o, 5],
    [x, 7],
    [o, 6],
    [x, 8],
  ] as const) {
    await move(app, i, both)
  }
}

/**
 * Text matcher for sentences that contain an isolated name (<bdi>, F-06): matches the innermost element whose full
 * text equals `text`, even though the name sits in a child element.
 */
export function sentence(text: string) {
  return (_content: string, el: Element | null) =>
    !!el && el.textContent === text && ![...el.children].some((c) => c.textContent === text)
}

/** Fixes for review findings F-02, F-03, F-05, F-06, F-09 (docs/review.md): pure model + XoClient. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FSI, isolate, PDI, splitIsolates } from './bidi'
import { MAX_ROOMS, topics, XoClient } from './client'
import { validateName } from './name'
import {
  createRoom,
  isExpired,
  joinRoom,
  LOBBY_IDLE_MS,
  LOBBY_MAX,
  LOBBY_REFRESH_MS,
  MAX_FUTURE_SKEW_MS,
  MAX_VERSION_JUMP,
  normalizeName,
  openGames,
  parseRoom,
  plausibleVersion,
  ROOM_EXPIRE_MS,
  shouldAccept,
  touchWaitingRoom,
  VERSION_MAX,
  type Room,
} from './room'
import { MemoryBroker, MemoryTransport } from './transport'

const NOW = 1_800_000_000_000
const HOST = 'host-client-1'
const GUEST = 'guest-client-2'
const flush = () => new Promise((r) => setTimeout(r, 0))

function room(id = 'room1234', now = NOW): Room {
  return createRoom({ id, clientId: HOST, name: 'Host', now })
}
const parse = (r: unknown, now = NOW) => parseRoom(JSON.stringify(r), undefined, { now })

afterEach(() => {
  vi.useRealTimers()
})

describe('F-02 bounded parsing of untrusted room state', () => {
  it('F-02 version must be a safe integer between 1 and VERSION_MAX', () => {
    expect(parse(room())).not.toBeNull()
    expect(parse({ ...room(), version: VERSION_MAX })).not.toBeNull()
    expect(parse({ ...room(), version: VERSION_MAX + 1 })).toBeNull()
    expect(parse({ ...room(), version: 2 ** 53 })).toBeNull()
    expect(parse({ ...room(), version: 0 })).toBeNull()
    expect(parse({ ...room(), version: 1.5 })).toBeNull()
  })

  it('F-02 timestamps more than ~2 minutes in the future, negative or non-finite are rejected', () => {
    expect(parse({ ...room(), updatedAt: NOW + MAX_FUTURE_SKEW_MS })).not.toBeNull()
    expect(parse({ ...room(), updatedAt: NOW + MAX_FUTURE_SKEW_MS + 1 })).toBeNull()
    expect(parse({ ...room(), createdAt: NOW + 24 * 3600_000 })).toBeNull()
    expect(parse({ ...room(), createdAt: -1 })).toBeNull()
    const r = room()
    expect(parse({ ...r, players: [{ ...r.players[0], lastSeen: NOW + 3600_000 }, null] })).toBeNull()
    expect(parseRoom({ ...room(), updatedAt: Infinity }, undefined, { now: NOW })).toBeNull()
    expect(parseRoom({ ...room(), updatedAt: Number.NaN }, undefined, { now: NOW })).toBeNull()
  })

  it('F-02 scores, rounds and the board must be in range and consistent', () => {
    expect(parse({ ...room(), scores: { x: 1e7, o: 0, draws: 0 } })).toBeNull()
    expect(parse({ ...room(), scores: { x: -1, o: 0, draws: 0 } })).toBeNull()
    expect(parse({ ...room(), round: 2, scoredRound: 3 })).toBeNull()
    expect(parse({ ...room(), board: ['X', 'X', 'X', null, null, null, null, null, null] })).toBeNull()
    expect(parse({ ...room(), board: ['X', 'O', 'X', null, null, null, null, null, null] })).not.toBeNull()
  })

  it('F-02 an incoming version may not jump more than MAX_VERSION_JUMP past the known one', () => {
    const local = { ...room(), version: 5 }
    expect(plausibleVersion(local, { ...local, version: 5 + MAX_VERSION_JUMP })).toBe(true)
    expect(plausibleVersion(local, { ...local, version: 6 + MAX_VERSION_JUMP })).toBe(false)
    expect(plausibleVersion(undefined, { ...local, version: 6 + MAX_VERSION_JUMP })).toBe(true)
  })

  it('F-02 the lobby lists at most LOBBY_MAX games (newest first) and skips future-dated ones', () => {
    const many = Array.from({ length: LOBBY_MAX + 20 }, (_, i) => room(`r${String(i).padStart(6, '0')}`, NOW - i * 1000))
    const list = openGames(many, NOW)
    expect(list).toHaveLength(LOBBY_MAX)
    expect(list[0].id).toBe('r000000')
    const future = { ...room('future01'), updatedAt: NOW + 10 * 60_000, createdAt: NOW + 10 * 60_000 }
    expect(openGames([future], NOW)).toEqual([])
  })

  it('F-02 XoClient ignores a spoofed version jump; a seated player restores its state on the broker', async () => {
    const broker = new MemoryBroker()
    const host = new XoClient(new MemoryTransport(broker), HOST, { now: () => NOW })
    host.start()
    const r = room()
    host.watchRoom(r.id, () => {})
    host.commit(r)
    await flush()
    const spoof = { ...r, version: r.version + MAX_VERSION_JUMP + 1, writer: 'attacker-1', players: [r.players[0], null] }
    broker.route(topics.room(r.id), JSON.stringify(spoof), true)
    await flush()
    expect(host.getRoom(r.id)).toEqual(r)
    expect(JSON.parse(broker.retained.get(topics.room(r.id))!)).toEqual(r)
  })

  it('F-02 XoClient keeps at most MAX_ROOMS rooms in memory', async () => {
    const broker = new MemoryBroker()
    for (let i = 0; i < MAX_ROOMS + 25; i++) {
      const r = createRoom({ id: `m${String(i).padStart(6, '0')}`, clientId: `other-client-${i}`, name: 'N', now: NOW + i })
      broker.retained.set(topics.room(r.id), JSON.stringify(r))
    }
    const viewer = new XoClient(new MemoryTransport(broker), 'viewer-client', { now: () => NOW + 10_000 })
    viewer.start()
    let seen: Room[] = []
    viewer.watchLobby((rooms) => (seen = rooms))
    await flush()
    expect(seen.length).toBe(MAX_ROOMS)
    // The least recently updated rooms were dropped.
    expect(viewer.getRoom('m000000')).toBeUndefined()
    expect(viewer.getRoom(`m${String(MAX_ROOMS + 24).padStart(6, '0')}`)).toBeDefined()
  })
})

describe('F-03 lobby viewers never delete rooms', () => {
  it('F-03 a viewer whose clock is 25 h ahead hides old rooms but does not clear them on the broker', async () => {
    const broker = new MemoryBroker()
    const r = room('live0001', NOW)
    broker.retained.set(topics.room(r.id), JSON.stringify(r))
    const skewed = NOW + ROOM_EXPIRE_MS + 3600_000
    const viewer = new XoClient(new MemoryTransport(broker), 'viewer-client', { now: () => skewed })
    viewer.start()
    let seen: Room[] = []
    viewer.watchLobby((rooms) => (seen = rooms))
    await flush()
    expect(broker.retained.has(topics.room(r.id))).toBe(true)
    expect(isExpired(seen[0], skewed)).toBe(true)
    expect(openGames(seen, skewed)).toEqual([])
  })
})

describe('F-05 an online waiting host stays listed', () => {
  it('F-05 touchWaitingRoom refreshes updatedAt without bumping the version, only for the lone host', () => {
    const r = room()
    const t = touchWaitingRoom(r, { clientId: HOST, now: NOW + LOBBY_REFRESH_MS })!
    expect(t.version).toBe(r.version)
    expect(t.updatedAt).toBe(NOW + LOBBY_REFRESH_MS)
    expect(shouldAccept(r, t)).toBe(true)
    expect(touchWaitingRoom(r, { clientId: GUEST, now: NOW + 1 })).toBeNull()
    expect(touchWaitingRoom(r, { clientId: HOST, now: NOW })).toBeNull()
    const joined = joinRoom(r, { clientId: GUEST, name: 'Guest', now: NOW + 1 })
    if (!joined.ok) throw new Error('join failed')
    expect(touchWaitingRoom(joined.room, { clientId: HOST, now: NOW + 5 })).toBeNull()
    // A concurrent join (version + 1) always wins over a refresh of the same base state.
    expect(shouldAccept(t, joined.room)).toBe(true)
    expect(shouldAccept(joined.room, t)).toBe(false)
  })

  it('F-05 keepWaitingRoomFresh keeps the room in openGames beyond LOBBY_IDLE_MS while the host is online', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(NOW)
    const broker = new MemoryBroker()
    const host = new XoClient(new MemoryTransport(broker), HOST)
    host.start()
    const r = createRoom({ id: 'wait0001', clientId: HOST, name: 'Host', now: Date.now() })
    host.commit(r)
    const stop = host.keepWaitingRoomFresh(r.id)
    await vi.advanceTimersByTimeAsync(LOBBY_IDLE_MS + 60_000)
    const retained = parseRoom(broker.retained.get(topics.room(r.id))!, r.id)!
    expect(retained.version).toBe(r.version)
    expect(openGames([retained], Date.now()).map((x) => x.id)).toEqual(['wait0001'])
    stop()
    await vi.advanceTimersByTimeAsync(LOBBY_IDLE_MS + 60_000)
    expect(openGames([parseRoom(broker.retained.get(topics.room(r.id))!, r.id)!], Date.now())).toEqual([])
  })
})

describe('F-06 bidi-safe names', () => {
  it('F-06 bidi controls and other control characters are stripped from names', () => {
    expect(normalizeName('‮Alice‬')).toBe('Alice')
    expect(normalizeName('A⁦b⁩‎‏؜ c\u0000\u0007')).toBe('Ab c')
    expect(normalizeName(' tab\there\nnew ')).toBe('tab here new')
    expect(validateName('‮⁧')).toEqual({ ok: false, error: 'empty' })
    expect(validateName('سامي‏')).toEqual({ ok: true, name: 'سامي' })
  })

  it('F-06 names received from the broker are stripped too', () => {
    const r = room()
    const parsed = parse({ ...r, players: [{ ...r.players[0], name: '‮evil⁦' }, null] })!
    expect(parsed.players[0]!.name).toBe('evil')
    expect(parse({ ...r, players: [{ ...r.players[0], name: '‮‬' }, null] })).toBeNull()
  })

  it('F-06 isolate/splitIsolates mark names with FSI…PDI and split them back out', () => {
    expect(isolate('Bob')).toBe(`${FSI}Bob${PDI}`)
    expect(splitIsolates(`${isolate('Bob')} wins`)).toEqual([
      { text: 'Bob', isolated: true },
      { text: ' wins', isolated: false },
    ])
    expect(splitIsolates('plain')).toEqual([{ text: 'plain', isolated: false }])
  })
})

describe('F-09 presence hygiene', () => {
  it('F-09 pagehide (goOffline) clears this client’s retained room heartbeats', async () => {
    const broker = new MemoryBroker()
    const c = new XoClient(new MemoryTransport(broker), HOST)
    c.start()
    const stop = c.startHeartbeat('room1234')
    expect(broker.retained.has(topics.presence('room1234', HOST))).toBe(true)
    c.goOffline()
    expect(broker.retained.has(topics.presence('room1234', HOST))).toBe(false)
    stop()
  })
})

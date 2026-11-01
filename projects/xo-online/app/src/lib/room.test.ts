import { describe, expect, it } from 'vitest'
import {
  compareRooms,
  createRoom,
  joinRoom,
  LOBBY_IDLE_MS,
  leaveRoom,
  moveRoom,
  openGames,
  parseRoom,
  rematchVote,
  seatOf,
  shouldAccept,
  type Room,
} from './room'

const HOST = 'host-client-1'
const GUEST = 'guest-client-2'
const THIRD = 'third-client-3'
const T0 = 1_700_000_000_000

function ok(res: ReturnType<typeof joinRoom>): Room {
  if (!res.ok) throw new Error(res.reason)
  return res.room
}

function started(): Room {
  const r = createRoom({ id: 'room1234', clientId: HOST, name: 'Host', now: T0 })
  return ok(joinRoom(r, { clientId: GUEST, name: 'Guest', now: T0 + 1 }))
}

function play(room: Room, moves: [string, number][]): Room {
  let r = room
  for (const [c, i] of moves) r = ok(moveRoom(r, { clientId: c, index: i, now: T0 + 10 }))
  return r
}

describe('room reducers', () => {
  it('creates a waiting room with the host as X', () => {
    const r = createRoom({ id: 'room1234', clientId: HOST, name: 'Host', now: T0 })
    expect(r.status).toBe('waiting')
    expect(seatOf(r, HOST)).toBe('X')
    expect(r.version).toBe(1)
  })

  it('seats a joiner as O, starts play with X to move, and locks a third visitor', () => {
    const r = started()
    expect(seatOf(r, GUEST)).toBe('O')
    expect(r.status).toBe('playing')
    expect(r.turn).toBe('X')
    expect(r.version).toBe(2)
    expect(joinRoom(r, { clientId: THIRD, name: 'Third', now: T0 })).toEqual({ ok: false, reason: 'locked' })
  })

  it('lets the same clientId reclaim its seat without changes', () => {
    const r = started()
    const res = joinRoom(r, { clientId: GUEST, name: 'Guest', now: T0 + 99 })
    expect(res.ok && res.changed).toBe(false)
    expect(res.ok && res.room).toBe(r)
  })

  it('validates turns and occupied cells', () => {
    const r = started()
    expect(moveRoom(r, { clientId: GUEST, index: 0, now: T0 })).toEqual({ ok: false, reason: 'wrong-turn' })
    const r2 = play(r, [[HOST, 0]])
    expect(moveRoom(r2, { clientId: GUEST, index: 0, now: T0 })).toEqual({ ok: false, reason: 'occupied' })
    expect(moveRoom(r2, { clientId: THIRD, index: 1, now: T0 })).toEqual({ ok: false, reason: 'not-seated' })
  })

  it('finishes on a win, records the line, scores once, and blocks further moves', () => {
    const r = play(started(), [
      [HOST, 0],
      [GUEST, 3],
      [HOST, 1],
      [GUEST, 4],
      [HOST, 2],
    ])
    expect(r.status).toBe('finished')
    expect(r.result).toEqual({ kind: 'win', mark: 'X', line: [0, 1, 2] })
    expect(r.scores).toEqual({ x: 1, o: 0, draws: 0 })
    expect(moveRoom(r, { clientId: GUEST, index: 8, now: T0 })).toEqual({ ok: false, reason: 'finished' })
  })

  it('starts a new round only after both rematch votes, alternating the starter and keeping the score', () => {
    const fin = play(started(), [
      [HOST, 0],
      [GUEST, 3],
      [HOST, 1],
      [GUEST, 4],
      [HOST, 2],
    ])
    const one = ok(rematchVote(fin, { clientId: HOST, now: T0 + 20 }))
    expect(one.status).toBe('finished')
    expect(one.rematch).toEqual({ x: true, o: false })
    const two = ok(rematchVote(one, { clientId: GUEST, now: T0 + 21 }))
    expect(two.status).toBe('playing')
    expect(two.round).toBe(2)
    expect(two.starter).toBe('O')
    expect(two.turn).toBe('O')
    expect(two.board.every((c) => c === null)).toBe(true)
    expect(two.scores).toEqual({ x: 1, o: 0, draws: 0 })
    expect(rematchVote(two, { clientId: HOST, now: T0 })).toEqual({ ok: false, reason: 'not-finished' })
  })

  it('counts a draw', () => {
    // X O X / X O O / O X X
    const r = play(started(), [
      [HOST, 0],
      [GUEST, 1],
      [HOST, 2],
      [GUEST, 4],
      [HOST, 3],
      [GUEST, 5],
      [HOST, 7],
      [GUEST, 6],
      [HOST, 8],
    ])
    expect(r.result).toEqual({ kind: 'draw' })
    expect(r.scores.draws).toBe(1)
  })

  it('leave: last player clears the room; otherwise the remaining player waits as X', () => {
    const solo = createRoom({ id: 'room1234', clientId: HOST, name: 'Host', now: T0 })
    expect(leaveRoom(solo, { clientId: HOST, now: T0 })).toEqual({ ok: true, room: null })
    const r = started()
    const res = leaveRoom(r, { clientId: HOST, now: T0 + 5 })
    expect(res.ok && res.room && seatOf(res.room, GUEST)).toBe('X')
    expect(res.ok && res.room?.status).toBe('waiting')
    expect(leaveRoom(r, { clientId: THIRD, now: T0 })).toEqual({ ok: false, reason: 'not-seated' })
  })
})

describe('lobby selectors', () => {
  it('lists only waiting, non-full, recent games, newest first', () => {
    const a = createRoom({ id: 'aaaaaa11', clientId: HOST, name: 'A', now: T0 })
    const b = createRoom({ id: 'bbbbbb22', clientId: 'host-client-b', name: 'B', now: T0 + 1000 })
    const stale = createRoom({ id: 'cccccc33', clientId: 'host-client-c', name: 'C', now: T0 - LOBBY_IDLE_MS - 1 })
    const full = started()
    const list = openGames([a, b, stale, full], T0 + 2000)
    expect(list.map((r) => r.id)).toEqual(['bbbbbb22', 'aaaaaa11'])
  })
})

describe('conflicts and parsing', () => {
  it('higher version wins; ties are broken deterministically', () => {
    const base = createRoom({ id: 'room1234', clientId: HOST, name: 'Host', now: T0 })
    const g = ok(joinRoom(base, { clientId: GUEST, name: 'Guest', now: T0 + 5 }))
    const t = ok(joinRoom(base, { clientId: THIRD, name: 'Third', now: T0 + 5 }))
    expect(g.version).toBe(t.version)
    expect(Math.sign(compareRooms(g, t))).toBe(-Math.sign(compareRooms(t, g)))
    expect(compareRooms(g, t)).not.toBe(0)
    expect(shouldAccept(base, g)).toBe(true)
    expect(shouldAccept(g, base)).toBe(false)
    expect(shouldAccept(g, g)).toBe(false)
  })

  it('parses valid rooms and ignores malformed payloads', () => {
    const r = started()
    expect(parseRoom(JSON.stringify(r), 'room1234')).toEqual(r)
    expect(parseRoom(JSON.stringify(r), 'other123')).toBeNull()
    expect(parseRoom('not json')).toBeNull()
    expect(parseRoom('')).toBeNull()
    expect(parseRoom(JSON.stringify({ ...r, board: [1, 2, 3] }))).toBeNull()
    expect(parseRoom(JSON.stringify({ ...r, players: [{ ...r.players[0], name: 'x'.repeat(21) }, null] }))).toBeNull()
  })
})

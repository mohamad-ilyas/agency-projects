/** Pure room state model, reducers, lobby selectors and conflict resolution. No I/O. */
import {
  applyMove,
  emptyBoard,
  scoreRound,
  starterForRound,
  voteRematch as voteRematchVotes,
  type Board,
  type Cell,
  type Line,
  type Mark,
  type MoveError,
  type Outcome,
  type RematchVotes,
  type Scores,
} from './game'

/** Games idle longer than this are hidden from the lobby (spec A2 / AC-7.2). */
export const LOBBY_IDLE_MS = 10 * 60 * 1000
/** Games idle longer than this are treated as expired ("Game not found", AC-3.4). */
export const ROOM_EXPIRE_MS = 24 * 60 * 60 * 1000
export const NAME_MAX = 20

export interface Player {
  clientId: string
  name: string
  lastSeen: number
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  schema: 1
  id: string
  /** [X, O] */
  players: [Player | null, Player | null]
  board: Cell[]
  turn: Mark
  round: number
  starter: Mark
  scores: Scores
  /** Last round already added to `scores` (guards against double counting). */
  scoredRound: number
  rematch: RematchVotes
  status: RoomStatus
  result: Outcome | null
  createdAt: number
  updatedAt: number
  /** Incremented by every accepted write; higher version wins. */
  version: number
  /** clientId of the last writer; used as a deterministic tie-breaker. */
  writer: string
}

export type RoomError = MoveError | 'locked' | 'not-finished'

export type RoomResult = { ok: true; room: Room; changed: boolean } | { ok: false; reason: RoomError }

interface Actor {
  clientId: string
  now: number
}

function bump(room: Room, actor: Actor, patch: Partial<Room>): Room {
  return { ...room, ...patch, updatedAt: actor.now, version: room.version + 1, writer: actor.clientId }
}

function freshRound(round: number): Pick<Room, 'board' | 'turn' | 'round' | 'starter' | 'rematch' | 'result'> {
  const starter = starterForRound(round)
  return { board: emptyBoard(), turn: starter, round, starter, rematch: { x: false, o: false }, result: null }
}

export function seatOf(room: Room, clientId: string): Mark | null {
  if (room.players[0]?.clientId === clientId) return 'X'
  if (room.players[1]?.clientId === clientId) return 'O'
  return null
}

export function playerFor(room: Room, mark: Mark): Player | null {
  return mark === 'X' ? room.players[0] : room.players[1]
}

export function createRoom(input: { id: string; clientId: string; name: string; now: number }): Room {
  return {
    schema: 1,
    id: input.id,
    players: [{ clientId: input.clientId, name: input.name, lastSeen: input.now }, null],
    ...freshRound(1),
    scores: { x: 0, o: 0, draws: 0 },
    scoredRound: 0,
    status: 'waiting',
    createdAt: input.now,
    updatedAt: input.now,
    version: 1,
    writer: input.clientId,
  }
}

/**
 * Join: the same clientId reclaims its seat (unchanged unless the name changed); otherwise seat O is taken
 * only if it is free. A new opponent starts a fresh match (round 1, X starts, scores reset).
 */
export function joinRoom(room: Room, actor: Actor & { name: string }): RoomResult {
  const seat = seatOf(room, actor.clientId)
  if (seat) {
    const idx = seat === 'X' ? 0 : 1
    const current = room.players[idx] as Player
    if (current.name === actor.name) return { ok: true, room, changed: false }
    const players: Room['players'] = [...room.players]
    players[idx] = { ...current, name: actor.name, lastSeen: actor.now }
    return { ok: true, room: bump(room, actor, { players }), changed: true }
  }
  if (room.players[0] && !room.players[1] && room.status === 'waiting') {
    const players: Room['players'] = [room.players[0], { clientId: actor.clientId, name: actor.name, lastSeen: actor.now }]
    return {
      ok: true,
      changed: true,
      room: bump(room, actor, {
        players,
        ...freshRound(1),
        scores: { x: 0, o: 0, draws: 0 },
        scoredRound: 0,
        status: 'playing',
      }),
    }
  }
  return { ok: false, reason: 'locked' }
}

export function moveRoom(room: Room, actor: Actor & { index: number }): RoomResult {
  const mark = seatOf(room, actor.clientId)
  const res = applyMove({ board: room.board, turn: room.turn, phase: room.status }, mark, actor.index)
  if (!res.ok) return res
  const players: Room['players'] = [...room.players]
  const idx = mark === 'X' ? 0 : 1
  players[idx] = { ...(players[idx] as Player), lastSeen: actor.now }
  let patch: Partial<Room> = { board: res.board, turn: res.turn, players }
  if (res.outcome) {
    const scored = scoreRound(room.scores, res.outcome, room.round, room.scoredRound)
    patch = { ...patch, status: 'finished', result: res.outcome, ...scored }
  }
  return { ok: true, room: bump(room, actor, patch), changed: true }
}

/** Both players must vote; then a new round starts and the starter alternates. */
export function rematchVote(room: Room, actor: Actor): RoomResult {
  const mark = seatOf(room, actor.clientId)
  if (!mark) return { ok: false, reason: 'not-seated' }
  if (room.status !== 'finished') return { ok: false, reason: 'not-finished' }
  if ((mark === 'X' && room.rematch.x) || (mark === 'O' && room.rematch.o)) return { ok: true, room, changed: false }
  const { votes, start } = voteRematchVotes(room.rematch, mark)
  if (!start) return { ok: true, room: bump(room, actor, { rematch: votes }), changed: true }
  return { ok: true, room: bump(room, actor, { ...freshRound(room.round + 1), status: 'playing' }), changed: true }
}

/**
 * Leave: returns null when the room should be cleared (no players left). Otherwise the remaining player
 * becomes X and the room waits for a new opponent; the previous score is kept for display.
 */
export function leaveRoom(room: Room, actor: Actor): { ok: true; room: Room | null } | { ok: false; reason: 'not-seated' } {
  const mark = seatOf(room, actor.clientId)
  if (!mark) return { ok: false, reason: 'not-seated' }
  const remaining = mark === 'X' ? room.players[1] : room.players[0]
  if (!remaining) return { ok: true, room: null }
  const scores = mark === 'X' ? { x: room.scores.o, o: room.scores.x, draws: room.scores.draws } : room.scores
  return {
    ok: true,
    room: bump(room, actor, { players: [remaining, null], ...freshRound(1), scores, scoredRound: 0, status: 'waiting' }),
  }
}

export function isExpired(room: Room, now: number): boolean {
  return now - room.updatedAt > ROOM_EXPIRE_MS
}

/** Lobby: waiting games with one free seat, active within the last 10 minutes, newest first. */
export function openGames(rooms: Iterable<Room>, now: number): Room[] {
  const list: Room[] = []
  for (const r of rooms) {
    if (r.status !== 'waiting') continue
    if (!r.players[0] || r.players[1]) continue
    if (now - r.updatedAt > LOBBY_IDLE_MS) continue
    list.push(r)
  }
  return list.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
}

/** >0 if a wins over b. Higher version wins; ties broken by updatedAt, then writer, then content. */
export function compareRooms(a: Room, b: Room): number {
  if (a.version !== b.version) return a.version - b.version
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt
  if (a.writer !== b.writer) return a.writer < b.writer ? -1 : 1
  const sa = JSON.stringify(a)
  const sb = JSON.stringify(b)
  return sa === sb ? 0 : sa < sb ? -1 : 1
}

/** Should an incoming state replace the local one? */
export function shouldAccept(local: Room | undefined, incoming: Room): boolean {
  return !local || compareRooms(incoming, local) > 0
}

// ---------- Defensive parsing of untrusted messages (public broker: anyone can publish) ----------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isInt = (v: unknown, min = 0): v is number => Number.isInteger(v) && (v as number) >= min
const isMark = (v: unknown): v is Mark => v === 'X' || v === 'O'
export const ID_RE = /^[a-z0-9]{6,16}$/
const CLIENT_RE = /^[A-Za-z0-9_-]{6,40}$/

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export function nameLength(name: string): number {
  return [...name].length
}

function parsePlayer(v: unknown): Player | null | undefined {
  if (v === null) return null
  if (!isObj(v)) return undefined
  if (typeof v.clientId !== 'string' || !CLIENT_RE.test(v.clientId)) return undefined
  if (typeof v.name !== 'string') return undefined
  const name = normalizeName(v.name)
  if (nameLength(name) < 1 || nameLength(name) > NAME_MAX) return undefined
  if (!isNum(v.lastSeen)) return undefined
  return { clientId: v.clientId, name, lastSeen: v.lastSeen }
}

function parseOutcome(v: unknown): Outcome | null | undefined {
  if (v === null) return null
  if (!isObj(v)) return undefined
  if (v.kind === 'draw') return { kind: 'draw' }
  if (v.kind !== 'win' || !isMark(v.mark) || !Array.isArray(v.line) || v.line.length !== 3) return undefined
  if (!v.line.every((n) => isInt(n) && (n as number) <= 8)) return undefined
  return { kind: 'win', mark: v.mark, line: v.line.slice() as unknown as Line }
}

/** Returns a valid Room or null. Malformed or inconsistent payloads are ignored. */
export function parseRoom(raw: unknown, expectedId?: string): Room | null {
  let v: unknown = raw
  if (typeof raw === 'string') {
    if (raw.length === 0 || raw.length > 8192) return null
    try {
      v = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!isObj(v) || v.schema !== 1) return null
  if (typeof v.id !== 'string' || !ID_RE.test(v.id)) return null
  if (expectedId !== undefined && v.id !== expectedId) return null
  if (!Array.isArray(v.players) || v.players.length !== 2) return null
  const p0 = parsePlayer(v.players[0])
  const p1 = parsePlayer(v.players[1])
  if (p0 === undefined || p1 === undefined) return null
  if (!Array.isArray(v.board) || v.board.length !== 9 || !v.board.every((c) => c === null || isMark(c))) return null
  if (!isMark(v.turn) || !isMark(v.starter)) return null
  if (!isInt(v.round, 1) || !isInt(v.scoredRound) || !isInt(v.version, 1)) return null
  if (!isObj(v.scores) || !isInt(v.scores.x) || !isInt(v.scores.o) || !isInt(v.scores.draws)) return null
  if (!isObj(v.rematch) || typeof v.rematch.x !== 'boolean' || typeof v.rematch.o !== 'boolean') return null
  if (v.status !== 'waiting' && v.status !== 'playing' && v.status !== 'finished') return null
  const result = parseOutcome(v.result)
  if (result === undefined) return null
  if (!isNum(v.createdAt) || !isNum(v.updatedAt)) return null
  if (typeof v.writer !== 'string' || v.writer.length > 40) return null
  if (!p0) return null
  if (p1 && p1.clientId === p0.clientId) return null
  return {
    schema: 1,
    id: v.id,
    players: [p0, p1],
    board: (v.board as Board).slice(),
    turn: v.turn,
    round: v.round,
    starter: v.starter,
    scores: { x: v.scores.x, o: v.scores.o, draws: v.scores.draws },
    scoredRound: v.scoredRound,
    rematch: { x: v.rematch.x, o: v.rematch.o },
    status: v.status,
    result,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    version: v.version,
    writer: v.writer,
  }
}

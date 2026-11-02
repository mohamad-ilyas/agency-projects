/**
 * XoClient: glues the pure room model to a Transport. Holds the latest accepted state per room,
 * resolves conflicts (higher version wins), and tracks presence heartbeats.
 */
import { LOBBY_REFRESH_MS, parseRoom, plausibleVersion, seatOf, shouldAccept, compareRooms, touchWaitingRoom, type Room } from './room'
import type { Transport, TransportStatus } from './transport'

export const TOPIC_PREFIX = 'aicos-xo/v1/'
export const HEARTBEAT_MS = 5_000
export const OFFLINE_AFTER_MS = 15_000
/** Placeholder room segment for the per-client presence topic that carries the Last Will. */
const WILL_SEGMENT = '_'
/** F-02: cap on rooms held in memory (the public broker may carry many retained rooms). */
export const MAX_ROOMS = 300

export const topics = {
  room: (id: string) => `${TOPIC_PREFIX}rooms/${id}`,
  allRooms: () => `${TOPIC_PREFIX}rooms/+`,
  presence: (roomId: string, clientId: string) => `${TOPIC_PREFIX}presence/${roomId}/${clientId}`,
  presenceAny: (clientId: string) => `${TOPIC_PREFIX}presence/+/${clientId}`,
}

/** undefined = not known yet; null = cleared/deleted. */
export type RoomView = Room | null | undefined

interface PresenceMsg {
  online: boolean
  ts: number
}

function parsePresence(payload: string): PresenceMsg | null {
  if (!payload || payload.length > 200) return null
  try {
    const v = JSON.parse(payload) as unknown
    if (typeof v !== 'object' || v === null) return null
    const o = v as Record<string, unknown>
    if (typeof o.online !== 'boolean' || typeof o.ts !== 'number' || !Number.isFinite(o.ts)) return null
    return { online: o.online, ts: o.ts }
  } catch {
    return null
  }
}

export class XoClient {
  private rooms = new Map<string, Room>()
  private cleared = new Set<string>()
  private roomListeners = new Map<string, Set<(r: RoomView) => void>>()
  private lobbyListeners = new Set<(rooms: Room[]) => void>()
  private started = false
  /** Rooms with an active heartbeat (cleared on pagehide, F-09). */
  private beating = new Set<string>()
  private connectedAt = 0
  readonly now: () => number
  readonly transport: Transport
  readonly clientId: string

  constructor(transport: Transport, clientId: string, opts: { now?: () => number } = {}) {
    this.transport = transport
    this.clientId = clientId
    this.now = opts.now ?? (() => Date.now())
  }

  get status(): TransportStatus {
    return this.transport.status
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.connectedAt = this.now()
    const willTopic = topics.presence(WILL_SEGMENT, this.clientId)
    this.transport.onStatus((s) => {
      if (s === 'online') {
        // Overwrite a Last Will left by a previous session.
        this.transport.publish(willTopic, JSON.stringify({ online: true, ts: this.now() }), { retain: true })
      }
    })
    this.transport.connect({
      will: { topic: willTopic, payload: JSON.stringify({ online: false, ts: this.connectedAt }), retain: true },
    })
    if (this.transport.status === 'online') {
      this.transport.publish(willTopic, JSON.stringify({ online: true, ts: this.now() }), { retain: true })
    }
  }

  /**
   * Best effort "I'm leaving" signal (tab close). Also clears this client's retained room heartbeats so they do not
   * pile up on the public broker (F-09); they are re-published if the page comes back.
   */
  goOffline(): void {
    for (const roomId of this.beating) this.clearHeartbeat(roomId)
    this.transport.publish(topics.presence(WILL_SEGMENT, this.clientId), JSON.stringify({ online: false, ts: this.now() }), {
      retain: true,
    })
  }

  onStatus(cb: (s: TransportStatus) => void): () => void {
    return this.transport.onStatus(cb)
  }

  getRoom(id: string): RoomView {
    if (this.rooms.has(id)) return this.rooms.get(id)
    return this.cleared.has(id) ? null : undefined
  }

  private ingest(topic: string, payload: string): void {
    const prefix = TOPIC_PREFIX + 'rooms/'
    if (!topic.startsWith(prefix)) return
    const id = topic.slice(prefix.length)
    if (!id || id.includes('/')) return
    if (payload === '') {
      if (!this.rooms.has(id) && this.cleared.has(id)) return
      this.rooms.delete(id)
      this.cleared.add(id)
      this.emit(id)
      return
    }
    const incoming = parseRoom(payload, id, { now: this.now() })
    if (!incoming) return // malformed / spoofed / out-of-range: ignore
    const local = this.rooms.get(id)
    if (!plausibleVersion(local, incoming)) {
      // F-02: absurd version jump (would freeze the room). Seated players restore their state on the broker.
      if (local && seatOf(local, this.clientId)) this.transport.publish(topics.room(id), JSON.stringify(local), { retain: true })
      return
    }
    if (shouldAccept(local, incoming)) {
      this.rooms.set(id, incoming)
      if (!local) this.evict()
      this.cleared.delete(id)
      this.emit(id)
      return
    }
    // Rejected (older or losing tie). If we are seated, re-publish our winning state so the broker's
    // retained copy converges to it. Identical echoes (compare === 0) are ignored.
    if (local && compareRooms(incoming, local) < 0 && seatOf(local, this.clientId)) {
      this.transport.publish(topics.room(id), JSON.stringify(local), { retain: true })
    }
  }

  /** F-02: keep at most MAX_ROOMS in memory; drop the least recently updated rooms nobody here watches or sits in. */
  private evict(): void {
    if (this.rooms.size <= MAX_ROOMS) return
    const candidates = [...this.rooms.values()]
      .filter((r) => !this.roomListeners.get(r.id)?.size && !seatOf(r, this.clientId))
      .sort((a, b) => a.updatedAt - b.updatedAt)
    for (const r of candidates) {
      if (this.rooms.size <= MAX_ROOMS) break
      this.rooms.delete(r.id)
    }
    if (this.cleared.size > MAX_ROOMS) this.cleared.clear()
  }

  private emit(id: string): void {
    const view = this.getRoom(id)
    for (const l of [...(this.roomListeners.get(id) ?? [])]) l(view)
    const all = [...this.rooms.values()]
    for (const l of [...this.lobbyListeners]) l(all)
  }

  watchRoom(id: string, cb: (r: RoomView) => void): () => void {
    let set = this.roomListeners.get(id)
    if (!set) this.roomListeners.set(id, (set = new Set()))
    set.add(cb)
    const unsub = this.transport.subscribe(topics.room(id), (t, p) => this.ingest(t, p))
    return () => {
      set.delete(cb)
      unsub()
    }
  }

  watchLobby(cb: (rooms: Room[]) => void): () => void {
    this.lobbyListeners.add(cb)
    cb([...this.rooms.values()])
    // F-03: lobby viewers never clear rooms; expired rooms are only hidden (isExpired / openGames). Seated players
    // clear their own room when the last one leaves (leaveRoom → clearRoom).
    const unsub = this.transport.subscribe(topics.allRooms(), (t, p) => this.ingest(t, p))
    return () => {
      this.lobbyListeners.delete(cb)
      unsub()
    }
  }

  /** Accept a locally-produced state and publish it (retained). */
  commit(room: Room): void {
    const local = this.rooms.get(room.id)
    if (!shouldAccept(local, room)) return
    this.rooms.set(room.id, room)
    this.cleared.delete(room.id)
    this.emit(room.id)
    this.transport.publish(topics.room(room.id), JSON.stringify(room), { retain: true })
  }

  /** Remove a room from the broker (empty retained payload). */
  clearRoom(id: string): void {
    this.rooms.delete(id)
    this.cleared.add(id)
    this.emit(id)
    this.transport.publish(topics.room(id), '', { retain: true })
  }

  /**
   * F-05: while the host waits alone, refresh the room's updatedAt (same version) so the lobby keeps listing it.
   * Returns a stop function.
   */
  keepWaitingRoomFresh(roomId: string, everyMs = LOBBY_REFRESH_MS): () => void {
    const timer = setInterval(() => {
      if (this.transport.status !== 'online') return
      const room = this.rooms.get(roomId)
      const next = room && touchWaitingRoom(room, { clientId: this.clientId, now: this.now() })
      if (next) this.commit(next)
    }, everyMs)
    return () => clearInterval(timer)
  }

  /** Publish a heartbeat for this room every HEARTBEAT_MS while active. Returns a stop function. */
  startHeartbeat(roomId: string): () => void {
    this.beating.add(roomId)
    const topic = topics.presence(roomId, this.clientId)
    const beat = () => {
      if (this.transport.status === 'online') {
        this.transport.publish(topic, JSON.stringify({ online: true, ts: this.now() }), { retain: true })
      }
    }
    beat()
    const offStatus = this.transport.onStatus((s) => s === 'online' && beat())
    const timer = setInterval(beat, HEARTBEAT_MS)
    return () => {
      this.beating.delete(roomId)
      clearInterval(timer)
      offStatus()
    }
  }

  /** Clears this client's retained heartbeat for a room (used when leaving). */
  clearHeartbeat(roomId: string): void {
    this.transport.publish(topics.presence(roomId, this.clientId), '', { retain: true })
  }

  /**
   * Watch another client's presence. Online = a heartbeat within OFFLINE_AFTER_MS and no later offline signal.
   * Live messages use receipt time; retained ones use min(now, payload ts) to limit clock-skew effects.
   */
  watchPresence(clientId: string, cb: (online: boolean | null) => void, checkEveryMs = 1000): () => void {
    let lastAlive = 0
    let offlineAt = 0
    let current: boolean | null = null
    let sawAny = false
    const startedAt = this.now()
    const evaluate = () => {
      const now = this.now()
      let next: boolean | null
      if (lastAlive && offlineAt <= lastAlive && now - lastAlive < OFFLINE_AFTER_MS) next = true
      else if (sawAny || now - startedAt >= OFFLINE_AFTER_MS) next = false
      else next = null // unknown yet
      if (next !== current) {
        current = next
        cb(next)
      }
    }
    const unsub = this.transport.subscribe(topics.presenceAny(clientId), (_t, payload, meta) => {
      const msg = parsePresence(payload)
      if (!msg) return
      const now = this.now()
      const at = meta.retained ? Math.min(now, msg.ts) : now
      sawAny = true
      if (msg.online) lastAlive = Math.max(lastAlive, at)
      else offlineAt = Math.max(offlineAt, at)
      evaluate()
    })
    const timer = setInterval(evaluate, checkEveryMs)
    evaluate()
    return () => {
      clearInterval(timer)
      unsub()
    }
  }
}

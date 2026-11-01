/**
 * XoClient: glues the pure room model to a Transport. Holds the latest accepted state per room,
 * resolves conflicts (higher version wins), and tracks presence heartbeats.
 */
import { isExpired, parseRoom, seatOf, shouldAccept, compareRooms, type Room } from './room'
import type { Transport, TransportStatus } from './transport'

export const TOPIC_PREFIX = 'aicos-xo/v1/'
export const HEARTBEAT_MS = 5_000
export const OFFLINE_AFTER_MS = 15_000
/** Placeholder room segment for the per-client presence topic that carries the Last Will. */
const WILL_SEGMENT = '_'

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

  /** Best effort "I'm leaving" signal (tab close). */
  goOffline(): void {
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
    const incoming = parseRoom(payload, id)
    if (!incoming) return // malformed / spoofed garbage: ignore
    const local = this.rooms.get(id)
    if (shouldAccept(local, incoming)) {
      this.rooms.set(id, incoming)
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
    const unsub = this.transport.subscribe(topics.allRooms(), (t, p) => {
      this.ingest(t, p)
      // Housekeeping: clear long-expired rooms so the public broker does not accumulate them.
      const id = t.slice((TOPIC_PREFIX + 'rooms/').length)
      const r = this.rooms.get(id)
      if (r && isExpired(r, this.now())) this.clearRoom(id)
    })
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

  /** Publish a heartbeat for this room every HEARTBEAT_MS while active. Returns a stop function. */
  startHeartbeat(roomId: string): () => void {
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

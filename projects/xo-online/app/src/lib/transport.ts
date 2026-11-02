/**
 * Pub/sub transport abstraction with retained-message semantics (MQTT-like).
 * - MqttTransport: MQTT.js over WSS to a free public broker (production).
 * - BroadcastTransport: BroadcastChannel + localStorage, same-browser test mode (?transport=local).
 * - MemoryTransport: in-process broker for automated tests.
 * All implementations echo a client's own publishes back to its matching subscriptions, like MQTT.
 */

export type TransportStatus = 'connecting' | 'online' | 'offline'

export interface Will {
  topic: string
  payload: string
  retain: boolean
}

export interface MessageMeta {
  retained: boolean
}

export type MessageHandler = (topic: string, payload: string, meta: MessageMeta) => void

export interface Transport {
  readonly status: TransportStatus
  connect(opts?: { will?: Will }): void
  subscribe(topic: string, cb: MessageHandler): () => void
  publish(topic: string, payload: string, opts?: { retain?: boolean }): void
  onStatus(cb: (status: TransportStatus) => void): () => void
  close(): void
}

export const DEFAULT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'

/** MQTT topic filter matching with `+` (one level) and `#` (rest). */
export function topicMatches(filter: string, topic: string): boolean {
  const f = filter.split('/')
  const t = topic.split('/')
  for (let i = 0; i < f.length; i++) {
    if (f[i] === '#') return true
    if (i >= t.length) return false
    if (f[i] !== '+' && f[i] !== t[i]) return false
  }
  return f.length === t.length
}

interface Sub {
  filter: string
  cb: MessageHandler
}

/** Shared base: local subscription registry and status listeners. */
abstract class BaseTransport implements Transport {
  status: TransportStatus = 'connecting'
  protected subs = new Set<Sub>()
  private statusListeners = new Set<(s: TransportStatus) => void>()

  abstract connect(opts?: { will?: Will }): void
  abstract publish(topic: string, payload: string, opts?: { retain?: boolean }): void
  abstract close(): void
  protected onSubscribe(_filter: string): void {}
  protected onUnsubscribe(_filter: string): void {}
  protected deliverRetainedOnSubscribe(_sub: Sub): void {}

  subscribe(filter: string, cb: MessageHandler): () => void {
    const sub = { filter, cb }
    const first = ![...this.subs].some((s) => s.filter === filter)
    this.subs.add(sub)
    if (first) this.onSubscribe(filter)
    this.deliverRetainedOnSubscribe(sub)
    return () => {
      this.subs.delete(sub)
      if (![...this.subs].some((s) => s.filter === filter)) this.onUnsubscribe(filter)
    }
  }

  onStatus(cb: (s: TransportStatus) => void): () => void {
    this.statusListeners.add(cb)
    return () => this.statusListeners.delete(cb)
  }

  protected setStatus(s: TransportStatus): void {
    if (s === this.status) return
    this.status = s
    for (const l of [...this.statusListeners]) l(s)
  }

  protected dispatch(topic: string, payload: string, meta: MessageMeta, only?: Sub): void {
    const targets = only ? [only] : [...this.subs]
    for (const s of targets) {
      if (!this.subs.has(s) || !topicMatches(s.filter, topic)) continue
      try {
        s.cb(topic, payload, meta)
      } catch (err) {
        console.warn('[xo] handler error', err)
      }
    }
  }
}

// ------------------------------------------------------------------ MQTT

type MqttClientLike = {
  on(event: string, cb: (...args: never[]) => void): unknown
  subscribe(topic: string, opts: { qos: 0 | 1 }): unknown
  unsubscribe(topic: string): unknown
  publish(topic: string, payload: string, opts: { qos: 0 | 1; retain: boolean }): unknown
  end(force?: boolean): unknown
}

export class MqttTransport extends BaseTransport {
  private client: MqttClientLike | null = null
  private closed = false
  private readonly url: string

  constructor(url?: string) {
    super()
    this.url = url || DEFAULT_BROKER_URL
  }

  connect(opts?: { will?: Will }): void {
    if (this.client || this.closed) return
    this.setStatus('connecting')
    // Loaded lazily so the app shell renders before the MQTT library is downloaded.
    import('mqtt')
      .then((mod) => {
        if (this.closed) return
        const connect = (mod as unknown as { connect: (url: string, o: object) => MqttClientLike }).connect ??
          (mod as unknown as { default: { connect: (url: string, o: object) => MqttClientLike } }).default.connect
        const client = connect(this.url, {
          clean: true,
          resubscribe: false,
          keepalive: 10,
          reconnectPeriod: 2000,
          connectTimeout: 10_000,
          clientId: 'aicos-xo-' + Math.random().toString(36).slice(2, 12),
          will: opts?.will
            ? { topic: opts.will.topic, payload: opts.will.payload, qos: 1, retain: opts.will.retain }
            : undefined,
        })
        this.client = client
        client.on('connect', () => {
          this.setStatus('online')
          // (Re)subscribe on every connect; the broker then re-sends retained state.
          for (const f of new Set([...this.subs].map((s) => s.filter))) client.subscribe(f, { qos: 1 })
        })
        client.on('reconnect', () => this.setStatus('connecting'))
        client.on('close', () => this.setStatus('offline'))
        client.on('offline', () => this.setStatus('offline'))
        client.on('error', () => this.setStatus('offline'))
        client.on('message', ((topic: string, payload: Uint8Array, packet: { retain?: boolean }) => {
          const text = new TextDecoder().decode(payload)
          this.dispatch(topic, text, { retained: !!packet?.retain })
        }) as (...args: never[]) => void)
      })
      .catch(() => this.setStatus('offline'))
  }

  protected onSubscribe(filter: string): void {
    if (this.status === 'online') this.client?.subscribe(filter, { qos: 1 })
  }

  protected onUnsubscribe(filter: string): void {
    this.client?.unsubscribe(filter)
  }

  publish(topic: string, payload: string, opts?: { retain?: boolean }): void {
    this.client?.publish(topic, payload, { qos: 1, retain: !!opts?.retain })
  }

  close(): void {
    this.closed = true
    this.client?.end(true)
    this.client = null
    this.setStatus('offline')
  }
}

// ------------------------------------------------------------------ BroadcastChannel (same browser)

const BC_NAME = 'aicos-xo-local'
const RETAIN_PREFIX = 'aicos-xo:retained:'

interface BcMessage {
  topic: string
  payload: string
}

export class BroadcastTransport extends BaseTransport {
  private channel: BroadcastChannel | null = null
  private will: Will | undefined
  private readonly onPageHide = () => {
    if (this.will) this.publish(this.will.topic, this.will.payload, { retain: this.will.retain })
  }

  connect(opts?: { will?: Will }): void {
    if (this.channel) return
    this.will = opts?.will
    this.channel = new BroadcastChannel(BC_NAME)
    this.channel.onmessage = (ev: MessageEvent<BcMessage>) => {
      const d = ev.data
      if (d && typeof d.topic === 'string' && typeof d.payload === 'string') {
        this.dispatch(d.topic, d.payload, { retained: false })
      }
    }
    window.addEventListener('pagehide', this.onPageHide)
    this.setStatus('online')
  }

  protected deliverRetainedOnSubscribe(sub: Sub): void {
    let entries: [string, string][] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(RETAIN_PREFIX)) continue
        const topic = key.slice(RETAIN_PREFIX.length)
        if (topicMatches(sub.filter, topic)) entries.push([topic, localStorage.getItem(key) ?? ''])
      }
    } catch {
      entries = []
    }
    queueMicrotask(() => {
      for (const [topic, payload] of entries) if (payload) this.dispatch(topic, payload, { retained: true }, sub)
    })
  }

  publish(topic: string, payload: string, opts?: { retain?: boolean }): void {
    if (opts?.retain) {
      try {
        if (payload) localStorage.setItem(RETAIN_PREFIX + topic, payload)
        else localStorage.removeItem(RETAIN_PREFIX + topic)
      } catch {
        /* storage unavailable: live messages still work */
      }
    }
    this.channel?.postMessage({ topic, payload } satisfies BcMessage)
    queueMicrotask(() => this.dispatch(topic, payload, { retained: false }))
  }

  close(): void {
    window.removeEventListener('pagehide', this.onPageHide)
    this.channel?.close()
    this.channel = null
    this.setStatus('offline')
  }
}

// ------------------------------------------------------------------ In-memory (tests)

/** A shared in-process "broker": several MemoryTransports attached to one broker simulate several clients. */
export class MemoryBroker {
  readonly retained = new Map<string, string>()
  readonly clients = new Set<MemoryTransport>()

  route(topic: string, payload: string, retain: boolean): void {
    if (retain) {
      if (payload) this.retained.set(topic, payload)
      else this.retained.delete(topic)
    }
    for (const c of [...this.clients]) c.receive(topic, payload)
  }
}

export class MemoryTransport extends BaseTransport {
  private will: Will | undefined
  private attached = false

  readonly broker: MemoryBroker

  constructor(broker: MemoryBroker) {
    super()
    this.broker = broker
  }

  connect(opts?: { will?: Will }): void {
    this.will = opts?.will
    this.attach()
  }

  private attach(): void {
    if (this.attached) return
    this.attached = true
    this.broker.clients.add(this)
    this.setStatus('online')
    // Like an MQTT reconnect: re-deliver retained messages for existing subscriptions.
    for (const s of [...this.subs]) this.deliverRetainedOnSubscribe(s)
  }

  /** Test helper: drop the connection; the broker publishes the Last Will (if any). */
  simulateDrop(): void {
    if (!this.attached) return
    this.attached = false
    this.broker.clients.delete(this)
    this.setStatus('offline')
    if (this.will) this.broker.route(this.will.topic, this.will.payload, this.will.retain)
  }

  /** Test helper: network returns. */
  simulateReconnect(): void {
    this.setStatus('connecting')
    this.attach()
  }

  receive(topic: string, payload: string): void {
    queueMicrotask(() => this.dispatch(topic, payload, { retained: false }))
  }

  protected deliverRetainedOnSubscribe(sub: Sub): void {
    if (!this.attached) return
    const entries = [...this.broker.retained].filter(([t]) => topicMatches(sub.filter, t))
    queueMicrotask(() => {
      for (const [t, p] of entries) this.dispatch(t, p, { retained: true }, sub)
    })
  }

  publish(topic: string, payload: string, opts?: { retain?: boolean }): void {
    if (!this.attached) return // offline: dropped (the UI disables actions while offline)
    this.broker.route(topic, payload, !!opts?.retain)
  }

  close(): void {
    this.attached = false
    this.broker.clients.delete(this)
    this.setStatus('offline')
  }
}

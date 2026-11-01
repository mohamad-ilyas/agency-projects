import { describe, expect, it, vi } from 'vitest'
import { MemoryBroker, MemoryTransport, topicMatches } from './transport'

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('transport', () => {
  it('matches MQTT wildcards', () => {
    expect(topicMatches('a/rooms/+', 'a/rooms/x1')).toBe(true)
    expect(topicMatches('a/rooms/+', 'a/rooms/x1/y')).toBe(false)
    expect(topicMatches('a/#', 'a/b/c')).toBe(true)
    expect(topicMatches('a/presence/+/c1', 'a/presence/r1/c1')).toBe(true)
  })

  it('delivers live messages to all clients and retained ones to late subscribers; empty clears', async () => {
    const broker = new MemoryBroker()
    const a = new MemoryTransport(broker)
    const b = new MemoryTransport(broker)
    a.connect()
    b.connect()
    const live = vi.fn()
    b.subscribe('t/+', live)
    a.publish('t/1', 'hello', { retain: true })
    await flush()
    expect(live).toHaveBeenCalledWith('t/1', 'hello', { retained: false })
    const late = vi.fn()
    a.subscribe('t/1', late)
    await flush()
    expect(late).toHaveBeenCalledWith('t/1', 'hello', { retained: true })
    a.publish('t/1', '', { retain: true })
    expect(broker.retained.has('t/1')).toBe(false)
  })

  it('publishes the Last Will when a client drops', async () => {
    const broker = new MemoryBroker()
    const a = new MemoryTransport(broker)
    const b = new MemoryTransport(broker)
    a.connect({ will: { topic: 'p/a', payload: 'gone', retain: true } })
    b.connect()
    const cb = vi.fn()
    b.subscribe('p/a', cb)
    const statuses: string[] = []
    a.onStatus((s) => statuses.push(s))
    a.simulateDrop()
    await flush()
    expect(cb).toHaveBeenCalledWith('p/a', 'gone', { retained: false })
    a.simulateReconnect()
    expect(statuses).toEqual(['offline', 'connecting', 'online'])
  })
})

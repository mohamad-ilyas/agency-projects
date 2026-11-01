/** React contexts and hooks: environment (client/prefs/router), i18n, live-region announcements. */
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import type { RoomView, XoClient } from './lib/client'
import type { Lang, Messages } from './lib/i18n'
import type { Prefs } from './lib/prefs'
import type { Room } from './lib/room'
import { parseRoute, type Route, type Router } from './lib/router'
import type { TransportStatus } from './lib/transport'

export interface Env {
  client: XoClient
  prefs: Prefs
  router: Router
  /** How long to wait for a room's retained state before showing "Game not found". */
  notFoundMs: number
}

export const EnvContext = createContext<Env | null>(null)

export function useEnv(): Env {
  const env = useContext(EnvContext)
  if (!env) throw new Error('EnvContext missing')
  return env
}

export interface I18n {
  lang: Lang
  t: Messages
  setLang: (l: Lang) => void
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const v = useContext(I18nContext)
  if (!v) throw new Error('I18nContext missing')
  return v
}

type Announce = (msg: string) => void
export const AnnounceContext = createContext<Announce>(() => {})
export const useAnnounce = () => useContext(AnnounceContext)

export function useStatus(): TransportStatus {
  const { client } = useEnv()
  return useSyncExternalStore(
    (cb) => client.onStatus(cb),
    () => client.status,
  )
}

export function useRoute(): Route {
  const { router } = useEnv()
  const hash = useSyncExternalStore(
    (cb) => router.subscribe(cb),
    () => router.get(),
  )
  return parseRoute(hash)
}

export function useRoom(id: string): RoomView {
  const { client } = useEnv()
  const [state, setState] = useState<{ id: string; room: RoomView }>(() => ({ id, room: client.getRoom(id) }))
  useEffect(() => client.watchRoom(id, (room) => setState({ id, room })), [client, id])
  return state.id === id ? state.room : client.getRoom(id)
}

export function useLobbyRooms(): { rooms: Room[]; loaded: boolean } {
  const { client } = useEnv()
  const status = useStatus()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => client.watchLobby(setRooms), [client])
  useEffect(() => {
    if (status !== 'online') return
    // Retained messages arrive right after subscribing; after a short grace period show the list/empty state.
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [status])
  return { rooms, loaded: loaded || rooms.length > 0 }
}

export function usePresence(clientId: string | undefined): boolean | null {
  const { client } = useEnv()
  const [state, setState] = useState<{ id?: string; online: boolean | null }>({ online: null })
  useEffect(() => {
    if (!clientId) return
    return client.watchPresence(clientId, (online) => setState({ id: clientId, online }))
  }, [client, clientId])
  return clientId && state.id === clientId ? state.online : null
}

/** Current time, refreshed every `everyMs` (for relative times and lobby staleness). */
export function useNow(everyMs: number): number {
  const { client } = useEnv()
  const [now, setNow] = useState(() => client.now())
  useEffect(() => {
    const t = setInterval(() => setNow(client.now()), everyMs)
    return () => clearInterval(t)
  }, [client, everyMs])
  return now
}

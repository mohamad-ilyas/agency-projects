import { useCallback, useState, type ReactNode } from 'react'
import { AnnounceContext } from '../context'

/** Polite live region; re-announces identical messages by toggling a zero-width suffix. */
export function Announcer({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const announce = useCallback((m: string) => setMsg((prev) => (prev === m ? m + '\u200b' : m)), [])
  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="live-region">
        {msg}
      </div>
    </AnnounceContext.Provider>
  )
}

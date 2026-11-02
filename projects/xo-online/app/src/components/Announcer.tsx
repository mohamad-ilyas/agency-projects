import { useCallback, useState, type ReactNode } from 'react'
import { AnnounceContext } from '../context'
import { Isolated } from './Isolated'

/**
 * Polite live region; re-announces identical messages by toggling a zero-width suffix.
 * Names isolated with FSI…PDI (lib/bidi) are rendered as <bdi> (F-06).
 */
export function Announcer({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const announce = useCallback((m: string) => setMsg((prev) => (prev === m ? m + '\u200b' : m)), [])
  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="live-region">
        <Isolated text={msg} />
      </div>
    </AnnounceContext.Provider>
  )
}

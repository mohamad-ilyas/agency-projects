import { useEffect, useId, useState } from 'react'
import { useAnnounce, useI18n } from '../context'

/** Share link with Copy (navigator.clipboard) and native Share when available (AC-2.2, AC-2.3). */
export function ShareBox({ url, hostName }: { url: string; hostName: string }) {
  const { t } = useI18n()
  const announce = useAnnounce()
  const id = useId()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (copyState !== 'copied') return
    const timer = setTimeout(() => setCopyState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [copyState])

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard')
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      announce(t.copied)
    } catch {
      setCopyState('failed')
      announce(t.copyFailed)
    }
  }

  async function share() {
    try {
      await navigator.share({ title: t.appTitle, text: t.shareText(hostName), url })
    } catch {
      /* user cancelled the share sheet */
    }
  }

  return (
    <div className="share">
      <label htmlFor={`${id}-link`} className="field-label">
        {t.linkLabel}
      </label>
      <div className="share__row">
        <input
          id={`${id}-link`}
          className="input input--mono"
          value={url}
          readOnly
          dir="ltr"
          onFocus={(e) => e.currentTarget.select()}
          data-testid="share-link"
        />
      </div>
      <div className="row">
        <button type="button" className={`btn btn--primary btn--grow ${copyState === 'copied' ? 'btn--success' : ''}`} onClick={copy}>
          {copyState === 'copied' ? `✓ ${t.copied}` : t.copyLink}
        </button>
        {canShare && (
          <button type="button" className="btn btn--ghost btn--grow" onClick={share}>
            {t.share}
          </button>
        )}
      </div>
      {copyState === 'failed' && <p className="field-error">{t.copyFailed}</p>}
    </div>
  )
}

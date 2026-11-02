import type { ReactNode } from 'react'
import { useEnv, useI18n } from '../context'

/** Full-card message (locked / not found) with a way back to the lobby and no board controls. */
export function MessageScreen({ icon, title, body, testId }: { icon: ReactNode; title: string; body: string; testId: string }) {
  const { t } = useI18n()
  const { router } = useEnv()
  return (
    <section className="card message enter" aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className="message__icon" aria-hidden="true">
        {icon}
      </div>
      <h1 id={`${testId}-title`} className="message__title">
        {title}
      </h1>
      <p className="muted">{body}</p>
      <a
        className="btn btn--primary"
        href="#/"
        onClick={(e) => {
          e.preventDefault()
          router.navigate('#/')
        }}
      >
        {t.backToLobby}
      </a>
    </section>
  )
}

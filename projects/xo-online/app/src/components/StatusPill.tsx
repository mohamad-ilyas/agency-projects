import { useI18n, useStatus } from '../context'

/** Connection indicator: connecting / online / offline (AC-10.1). */
export function StatusPill() {
  const status = useStatus()
  const { t } = useI18n()
  const label = t.status[status]
  return (
    <span className={`pill pill--${status}`} title={t.statusAria(label)} data-testid="status-pill" data-status={status}>
      <span className="pill__dot" aria-hidden="true" />
      <span className="sr-only">{t.statusAria(label)}</span>
      <span aria-hidden="true">{label}</span>
    </span>
  )
}

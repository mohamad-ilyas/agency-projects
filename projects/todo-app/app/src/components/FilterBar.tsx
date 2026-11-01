import type { Messages } from '../lib/i18n'
import { FILTERS, type Filter } from '../lib/tasks'

interface Props {
  t: Messages
  filter: Filter
  onChange: (f: Filter) => void
}

/** US-5: toggle buttons; the selected one has aria-pressed="true" (AC-5.1). */
export function FilterBar({ t, filter, onChange }: Props) {
  return (
    <div className="filters" role="group" aria-label={t.filterGroupLabel}>
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          className="btn btn--filter"
          aria-pressed={filter === f}
          onClick={() => onChange(f)}
        >
          {t.filters[f]}
        </button>
      ))}
    </div>
  )
}

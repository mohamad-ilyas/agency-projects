import { useId, useState, type FormEvent } from 'react'
import { useI18n } from '../context'
import { validateName, type NameError } from '../lib/name'

export function NameForm({ initial, onSave, onCancel }: { initial: string; onSave: (name: string) => void; onCancel?: () => void }) {
  const { t } = useI18n()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<NameError | null>(null)
  const id = useId()

  function submit(e: FormEvent) {
    e.preventDefault()
    const res = validateName(value)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setError(null)
    onSave(res.name)
  }

  const errorText = error === 'empty' ? t.nameErrEmpty : error === 'tooLong' ? t.nameErrTooLong : ''
  return (
    <section className="card name-card enter" aria-labelledby={`${id}-h`}>
      <div className="name-card__marks" aria-hidden="true">
        <span className="chip chip--x">X</span>
        <span className="chip chip--o">O</span>
      </div>
      <h1 id={`${id}-h`}>{t.nameHeading}</h1>
      <p className="muted">{t.nameIntro}</p>
      <form className="name-form" onSubmit={submit} noValidate>
        <label htmlFor={`${id}-in`} className="field-label">
          {t.nameLabel}
        </label>
        <input
          id={`${id}-in`}
          className={`input ${error ? 'input--error' : ''}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          placeholder={t.namePlaceholder}
          autoComplete="nickname"
          autoFocus
          enterKeyHint="go"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint ${error ? `${id}-err` : ''}`.trim()}
        />
        <p id={`${id}-hint`} className="field-hint">
          {t.nameHint}
        </p>
        {error && (
          <p id={`${id}-err`} className="field-error" role="alert">
            {errorText}
          </p>
        )}
        <div className="row">
          <button type="submit" className="btn btn--primary btn--grow">
            {t.nameContinue}
          </button>
          {onCancel && (
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              {t.nameCancel}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

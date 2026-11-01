import { useId, useRef, useState, type FormEvent } from 'react'
import type { Messages } from '../lib/i18n'
import { normalizeTitle, type DueDate } from '../lib/tasks'

interface Props {
  t: Messages
  onAdd: (title: string, due: DueDate) => void
}

/** US-1: title + optional due date. Empty titles are refused with an announced error (AC-1.2). */
export function AddTaskForm({ t, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [error, setError] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const titleId = `${id}-title`
  const dueId = `${id}-due`
  const errorId = `${id}-error`

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const clean = normalizeTitle(title)
    if (clean === null) {
      setError(true)
      titleRef.current?.focus()
      return
    }
    onAdd(clean, due || null)
    setTitle('')
    setDue('')
    setError(false)
    titleRef.current?.focus() // AC-1.1: input keeps focus
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="visually-hidden">
        {t.addHeading}
      </h2>
      <div className="field field--grow">
        <label htmlFor={titleId}>{t.titleLabel}</label>
        <input
          ref={titleRef}
          id={titleId}
          name="title"
          type="text"
          dir="auto"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={500}
          placeholder={t.titlePlaceholder}
          value={title}
          aria-invalid={error || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error && e.target.value.trim()) setError(false)
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={dueId}>{t.dueLabel}</label>
        <input id={dueId} name="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      <button type="submit" className="btn btn--primary">
        {t.addButton}
      </button>
      <p id={errorId} className="field-error" role="alert">
        {error ? t.errorEmptyTitle : ''}
      </p>
    </form>
  )
}

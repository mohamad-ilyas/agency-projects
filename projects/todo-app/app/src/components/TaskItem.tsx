import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { formatDueDate, type Lang, type Messages } from '../lib/i18n'
import { isOverdue, normalizeTitle, type DueDate, type Task } from '../lib/tasks'

interface Props {
  task: Task
  lang: Lang
  t: Messages
  today: string
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, due: DueDate) => void
  onDelete: (task: Task) => void
}

/** One list row: view mode (US-2, US-4) or inline edit mode (US-3). */
export function TaskItem({ task, lang, t, today, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [draftDue, setDraftDue] = useState(task.due ?? '')
  const [error, setError] = useState(false)
  const editTitleRef = useRef<HTMLInputElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)
  const id = useId()
  const titleId = `${id}-title`
  const overdue = isOverdue(task, today)

  useEffect(() => {
    if (editing) {
      editTitleRef.current?.focus()
      editTitleRef.current?.select()
    } else if (returnFocus.current) {
      returnFocus.current = false
      editButtonRef.current?.focus()
    }
  }, [editing])

  function startEdit() {
    setDraftTitle(task.title)
    setDraftDue(task.due ?? '')
    setError(false)
    setEditing(true)
  }

  function cancel() {
    returnFocus.current = true
    setError(false)
    setEditing(false)
  }

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const clean = normalizeTitle(draftTitle)
    if (clean === null) {
      setError(true) // AC-3.3: refuse; original stays in storage
      editTitleRef.current?.focus()
      return
    }
    onEdit(task.id, clean, draftDue || null)
    returnFocus.current = true
    setEditing(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    }
  }

  if (editing) {
    const errorId = `${id}-edit-error`
    return (
      <li className="task task--editing">
        <form className="edit-form" onSubmit={save} onKeyDown={onKeyDown} noValidate aria-label={t.editFormLabel(task.title)}>
          <div className="field field--grow">
            <label htmlFor={`${id}-edit-title`}>{t.editTitleLabel}</label>
            <input
              ref={editTitleRef}
              id={`${id}-edit-title`}
              type="text"
              dir="auto"
              autoComplete="off"
              enterKeyHint="done"
              maxLength={500}
              value={draftTitle}
              aria-invalid={error || undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setDraftTitle(e.target.value)
                if (error && e.target.value.trim()) setError(false)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-edit-due`}>{t.editDueLabel}</label>
            <input id={`${id}-edit-due`} type="date" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} />
          </div>
          <div className="task__actions">
            <button type="submit" className="btn btn--primary">
              {t.save}
            </button>
            <button type="button" className="btn" onClick={cancel}>
              {t.cancel}
            </button>
          </div>
          <p id={errorId} className="field-error" role="alert">
            {error ? t.errorEmptyTitle : ''}
          </p>
        </form>
      </li>
    )
  }

  return (
    <li className={`task${task.done ? ' task--done' : ''}${overdue ? ' task--overdue' : ''}`}>
      <label className="task__check">
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} aria-labelledby={titleId} />
      </label>
      <div className="task__body">
        <span id={titleId} className="task__title" dir="auto">
          {task.title}
        </span>
        {(task.due || overdue) && (
          <span className="task__meta">
            {task.due && <span className="task__due">{t.dueText(formatDueDate(lang, task.due))}</span>}
            {overdue && (
              <span className="badge badge--overdue">
                <span aria-hidden="true" className="badge__icon">
                  !
                </span>
                {t.overdue}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="task__actions">
        <button ref={editButtonRef} type="button" className="btn" onClick={startEdit} aria-label={t.editAria(task.title)}>
          {t.edit}
        </button>
        <button type="button" className="btn btn--danger" onClick={() => onDelete(task)} aria-label={t.deleteAria(task.title)}>
          {t.delete}
        </button>
      </div>
    </li>
  )
}

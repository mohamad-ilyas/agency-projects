import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AddTaskForm } from './components/AddTaskForm'
import { FilterBar } from './components/FilterBar'
import { TaskItem } from './components/TaskItem'
import { detectLang, dirFor, formatTasksLeft, messages, type Lang } from './lib/i18n'
import {
  isStorageAvailable,
  loadLang,
  loadTasks,
  loadTheme,
  saveLang,
  saveTasks,
  saveTheme,
  type Theme,
} from './lib/storage'
import { countActive, filterTasks, newId, tasksReducer, todayISO, type DueDate, type Filter, type Task } from './lib/tasks'
import { applyTheme, DARK_QUERY, systemTheme } from './lib/theme'

export default function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, undefined, loadTasks)
  const [filter, setFilter] = useState<Filter>('all')
  const [lang, setLang] = useState<Lang>(() => loadLang() ?? detectLang(globalThis.navigator?.language))
  const [themePref, setThemePref] = useState<Theme | null>(loadTheme)
  const [sysTheme, setSysTheme] = useState<Theme>(systemTheme)
  const [storageOk] = useState(isStorageAvailable)
  const [writeFailed, setWriteFailed] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const listHeadingRef = useRef<HTMLHeadingElement>(null)

  const t = messages[lang]
  const theme: Theme = themePref ?? sysTheme

  // US-9: save on every change.
  useEffect(() => {
    if (!storageOk) return
    // The write result comes from an external system (localStorage), so it can only be known here.
    // oxlint-disable-next-line react/set-state-in-effect
    setWriteFailed(!saveTasks(tasks))
  }, [tasks, storageOk])

  // US-7: <html lang dir> and document title.
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = dirFor(lang)
    document.title = t.appTitle
  }, [lang, t])

  // US-8: follow system changes while the user has no saved preference.
  useEffect(() => {
    const mql = window.matchMedia?.(DARK_QUERY)
    if (!mql) return
    const onChange = (e: MediaQueryListEvent) => setSysTheme(e.matches ? 'dark' : 'light')
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const visible = useMemo(() => filterTasks(tasks, filter), [tasks, filter])
  const remaining = useMemo(() => countActive(tasks), [tasks])
  const today = todayISO()

  const handleAdd = useCallback((title: string, due: DueDate) => {
    dispatch({ type: 'add', id: newId(), title, due, createdAt: Date.now() })
  }, [])
  const handleToggle = useCallback((id: string) => dispatch({ type: 'toggle', id }), [])
  const handleEdit = useCallback((id: string, title: string, due: DueDate) => {
    dispatch({ type: 'edit', id, title, due })
  }, [])
  const handleDelete = useCallback(
    (task: Task) => {
      dispatch({ type: 'delete', id: task.id })
      setAnnouncement(t.deleted(task.title))
      listHeadingRef.current?.focus() // keep focus in a sensible place after the row disappears
    },
    [t],
  )

  function switchLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    saveLang(next)
    setAnnouncement('')
  }

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemePref(next)
    saveTheme(next)
  }

  const otherLang: Lang = lang === 'ar' ? 'en' : 'ar'

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">{t.appTitle}</h1>
        <div className="app__settings" role="group" aria-label={t.settingsLabel}>
          <button type="button" className="btn" onClick={switchLang} lang={otherLang}>
            {messages[lang].otherLanguageName}
          </button>
          <button type="button" className="btn btn--icon" aria-pressed={theme === 'dark'} onClick={toggleTheme}>
            <span aria-hidden="true" className="theme-icon">
              {theme === 'dark' ? '☾' : '☀'}
            </span>
            <span className="theme-label">{t.darkMode}</span>
          </button>
        </div>
      </header>

      {(!storageOk || writeFailed) && (
        <p className="notice" role="status">
          {!storageOk ? t.storageUnavailable : t.storageWriteFailed}
        </p>
      )}

      <main className="app__main">
        <AddTaskForm t={t} onAdd={handleAdd} />

        <section className="list-section" aria-labelledby="list-heading">
          <div className="list-section__head">
            <h2 id="list-heading" ref={listHeadingRef} tabIndex={-1}>
              {t.listHeading}
            </h2>
            <FilterBar t={t} filter={filter} onChange={setFilter} />
          </div>

          {visible.length === 0 ? (
            <p className="empty">{t.empty[filter]}</p>
          ) : (
            <ul className="task-list">
              {visible.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  lang={lang}
                  t={t}
                  today={today}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="app__footer">
        <p className="count" aria-live="polite" aria-atomic="true">
          {formatTasksLeft(lang, remaining)}
        </p>
        <p className="visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </footer>
    </div>
  )
}

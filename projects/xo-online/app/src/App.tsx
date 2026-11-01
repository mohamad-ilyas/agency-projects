import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameScreen } from './components/GameScreen'
import { Lobby } from './components/Lobby'
import { NameForm } from './components/NameForm'
import { StatusPill } from './components/StatusPill'
import { Announcer } from './components/Announcer'
import { EnvContext, I18nContext, useEnv, useI18n, useRoute, type Env } from './context'
import { XoClient } from './lib/client'
import { applyLang, browserLanguages, detectLang, MESSAGES, type Lang } from './lib/i18n'
import { createPrefs } from './lib/prefs'
import { createHashRouter, type Router } from './lib/router'
import type { Transport } from './lib/transport'

export interface AppProps {
  transport: Transport
  /** localStorage namespace; tests use different namespaces to simulate different browsers. */
  prefsNamespace?: string
  /** Same-browser test mode: identity per tab (sessionStorage). */
  perTabIdentity?: boolean
  router?: Router
  notFoundMs?: number
  now?: () => number
}

export default function App({ transport, prefsNamespace, perTabIdentity, router, notFoundMs = 5000, now }: AppProps) {
  // The environment is created once per mounted app.
  const [env] = useState<Env>(() => {
    const prefs = createPrefs(prefsNamespace, { perTab: perTabIdentity })
    return {
      prefs,
      router: router ?? createHashRouter(),
      client: new XoClient(transport, prefs.clientId(), { now }),
      notFoundMs,
    }
  })

  const [lang, setLangState] = useState<Lang>(() => env.prefs.getLang() ?? detectLang(browserLanguages()))
  const setLang = useCallback(
    (l: Lang) => {
      env.prefs.setLang(l)
      setLangState(l)
    },
    [env],
  )
  useEffect(() => applyLang(lang), [lang])
  const i18n = useMemo(() => ({ lang, t: MESSAGES[lang], setLang }), [lang, setLang])

  useEffect(() => {
    env.client.start()
    const bye = () => env.client.goOffline()
    window.addEventListener('pagehide', bye)
    return () => window.removeEventListener('pagehide', bye)
  }, [env])

  useEffect(() => {
    document.title = `${MESSAGES[lang].appTitle}`
  }, [lang])

  return (
    <EnvContext.Provider value={env}>
      <I18nContext.Provider value={i18n}>
        <Announcer>
          <Shell />
        </Announcer>
      </I18nContext.Provider>
    </EnvContext.Provider>
  )
}

function Shell() {
  const { t, lang, setLang } = useI18n()
  const { prefs, router } = useEnv()
  const route = useRoute()
  const [name, setName] = useState(() => prefs.getName())
  const [editingName, setEditingName] = useState(false)

  const screenKey = !name || editingName ? 'name' : route.name === 'game' ? `game-${route.id}` : 'lobby'

  return (
    <div className="app">
      <div className="bg" aria-hidden="true">
        <span className="bg__blob bg__blob--1" />
        <span className="bg__blob bg__blob--2" />
      </div>
      <a className="skip-link" href="#main">
        {t.appTitle}
      </a>
      <header className="topbar">
        <a
          className="brand"
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            setEditingName(false)
            router.navigate('#/')
          }}
        >
          <span className="brand__logo" aria-hidden="true" dir="ltr">
            <span>X</span>
            <span>O</span>
          </span>
          <span className="brand__name">{t.appTitle}</span>
        </a>
        <div className="topbar__end">
          <StatusPill />
          <button
            type="button"
            className="btn btn--chip"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            lang={lang === 'ar' ? 'en' : 'ar'}
            aria-label={`${t.languageLabel}: ${t.otherLanguageName}`}
          >
            {t.otherLanguageName}
          </button>
        </div>
      </header>
      <main id="main" className="main" key={screenKey} tabIndex={-1}>
        {!name || editingName ? (
          <NameForm
            initial={name || prefs.suggestedName()}
            onSave={(n) => {
              prefs.setName(n)
              setName(n)
              setEditingName(false)
            }}
            onCancel={name ? () => setEditingName(false) : undefined}
          />
        ) : route.name === 'game' ? (
          <GameScreen id={route.id} name={name} />
        ) : (
          <Lobby name={name} onChangeName={() => setEditingName(true)} />
        )}
      </main>
      <footer className="footer">
        <p>{t.tagline}</p>
      </footer>
    </div>
  )
}

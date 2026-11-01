import { useEnv, useI18n, useLobbyRooms, useNow, useStatus } from '../context'
import { relativeTime } from '../lib/i18n'
import { newRoomId } from '../lib/ids'
import { createRoom, openGames } from '../lib/room'
import { gameHash } from '../lib/router'

export function Lobby({ name, onChangeName }: { name: string; onChangeName: () => void }) {
  const { t, lang } = useI18n()
  const { client, router } = useEnv()
  const status = useStatus()
  const { rooms, loaded } = useLobbyRooms()
  useNow(15_000) // re-render so stale games drop out and relative times refresh (AC-7.5)
  const now = client.now()
  const games = openGames(rooms, now)
  const offline = status !== 'online'

  function create() {
    if (offline) return
    const id = newRoomId()
    client.commit(createRoom({ id, clientId: client.clientId, name, now: client.now() }))
    router.navigate(gameHash(id))
  }

  const createBtn = (extra = '') => (
    <button type="button" className={`btn btn--primary btn--lg ${extra}`} onClick={create} disabled={offline}>
      <span aria-hidden="true" className="btn__plus">
        +
      </span>
      {t.createGame}
    </button>
  )

  return (
    <div className="lobby">
      <section className="card hero enter" aria-labelledby="lobby-h">
        <div className="hero__text">
          <h1 id="lobby-h" className="hero__title">
            {t.lobbyHeading}
          </h1>
          <p className="muted">{t.lobbyIntro}</p>
          <p className="hero__me">
            <span>
              {t.playingAs}{' '}
              <bdi className="hero__name">{name}</bdi>
            </span>
            <button type="button" className="link-btn" onClick={onChangeName}>
              {t.changeName}
            </button>
          </p>
        </div>
        <div className="hero__actions">{createBtn()}</div>
      </section>

      <section className="card list-card enter enter--2" aria-labelledby="open-h" aria-busy={!loaded}>
        <h2 id="open-h" className="section-title">
          {t.openGames}
          {loaded && games.length > 0 && <span className="count">{games.length}</span>}
        </h2>
        {offline && <p className="notice">{t.offlineNote}</p>}
        {!loaded ? (
          <ul className="games" aria-label={t.lobbyLoading}>
            {[0, 1, 2].map((i) => (
              <li key={i} className="game-item game-item--skeleton" aria-hidden="true">
                <span className="skeleton skeleton--avatar" />
                <span className="skeleton skeleton--text" />
              </li>
            ))}
            <li className="sr-only">{t.lobbyLoading}</li>
          </ul>
        ) : games.length === 0 ? (
          <div className="empty" data-testid="lobby-empty">
            <div className="empty__art" aria-hidden="true">
              <span className="chip chip--x">X</span>
              <span className="chip chip--o">O</span>
            </div>
            <p className="empty__title">{t.lobbyEmpty}</p>
            <p className="muted">{t.lobbyEmptyHint}</p>
            {createBtn()}
          </div>
        ) : (
          <ul className="games" data-testid="lobby-list">
            {games.map((g, i) => {
              const host = g.players[0]!
              const mine = host.clientId === client.clientId
              const s = g.scores
              return (
                <li key={g.id} className="game-item" style={{ ['--i' as string]: Math.min(i, 8) }}>
                  <span className="avatar" aria-hidden="true">
                    {[...host.name][0]?.toUpperCase()}
                  </span>
                  <div className="game-item__info">
                    <p className="game-item__title">
                      <bdi>{t.hostedBy(host.name)}</bdi>
                      {mine && <span className="tag">{t.yourGame}</span>}
                    </p>
                    <p className="game-item__meta">
                      <time dateTime={new Date(g.createdAt).toISOString()}>{t.created(relativeTime(g.createdAt, now, lang))}</time>
                      {s.x + s.o + s.draws > 0 && <span> · {t.lastScore(s.x, s.o, s.draws)}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => router.navigate(gameHash(g.id))}
                    aria-label={mine ? undefined : t.joinAria(host.name)}
                    disabled={offline && !mine}
                  >
                    {mine ? t.openOwn : t.join}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

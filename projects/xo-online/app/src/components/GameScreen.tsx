import { useEffect, useRef, useState } from 'react'
import { useAnnounce, useEnv, useI18n, usePresence, useRoom, useStatus } from '../context'
import type { Mark } from '../lib/game'
import { isExpired, joinRoom, leaveRoom, moveRoom, playerFor, rematchVote, seatOf, type Room } from '../lib/room'
import { Board } from './Board'
import { Confetti } from './Confetti'
import { MarkIcon } from './Marks'
import { MessageScreen } from './MessageScreen'
import { PlayerCard } from './PlayerCard'
import { ShareBox } from './ShareBox'

export function GameScreen({ id, name }: { id: string; name: string }) {
  const { t } = useI18n()
  const { client, notFoundMs } = useEnv()
  const status = useStatus()
  const room = useRoom(id)
  const [timedOutId, setTimedOutId] = useState<string | null>(null)
  const joinAttempted = useRef(false)

  // AC-3.4: no retained state arrives within notFoundMs after connecting → "Game not found".
  useEffect(() => {
    if (room !== undefined || status !== 'online') return
    const timer = setTimeout(() => setTimedOutId(id), notFoundMs)
    return () => clearTimeout(timer)
  }, [room, status, notFoundMs, id])
  const timedOut = timedOutId === id

  // Join once the current state is known: reclaim own seat (AC-3.3/9.3) or take free seat O (AC-3.1).
  useEffect(() => {
    joinAttempted.current = false
  }, [id])
  useEffect(() => {
    if (!room || status !== 'online' || joinAttempted.current) return
    const res = joinRoom(room, { clientId: client.clientId, name, now: client.now() })
    // Only stop retrying once a join succeeded: a locked room can re-open (seat O leaves), and the
    // visitor on the spinner must then take the free seat instead of waiting forever.
    if (!res.ok) return
    joinAttempted.current = true
    if (res.changed) client.commit(res.room)
  }, [room, status, client, name])

  if (room === null || (room && isExpired(room, client.now())) || (room === undefined && timedOut)) {
    return <MessageScreen testId="not-found" icon="?" title={t.notFoundTitle} body={t.notFoundBody} />
  }
  if (room === undefined) {
    return (
      <section className="card loading enter" aria-busy="true" data-testid="game-loading">
        <div className="spinner" aria-hidden="true" />
        <p>{t.loadingGame}</p>
      </section>
    )
  }
  const mySeat = seatOf(room, client.clientId)
  if (!mySeat) {
    const joinable = room.status === 'waiting' && !room.players[1]
    if (!joinable) return <MessageScreen testId="locked" icon="🔒" title={t.lockedTitle} body={t.lockedBody} />
    // Joinable: the join effect takes seat O (or waits for the connection).
    return (
      <section className="card loading enter" aria-busy="true" data-testid="game-loading">
        <div className="spinner" aria-hidden="true" />
        <p>{t.loadingGame}</p>
      </section>
    )
  }
  return <SeatedGame room={room} mySeat={mySeat} />
}

function SeatedGame({ room, mySeat }: { room: Room; mySeat: Mark }) {
  const { t } = useI18n()
  const { client, router } = useEnv()
  const status = useStatus()
  const announce = useAnnounce()
  const opponentSeat: Mark = mySeat === 'X' ? 'O' : 'X'
  const me = playerFor(room, mySeat)!
  const opponent = playerFor(room, opponentSeat)
  const opponentOnline = usePresence(opponent?.clientId)
  const online = status === 'online'

  // Heartbeat while seated (presence, AC-9.1).
  useEffect(() => client.startHeartbeat(room.id), [client, room.id])

  // Live announcements (AC-12.5).
  const prev = useRef<{ key: string; opp: string | null; oppOnline: boolean | null } | null>(null)
  useEffect(() => {
    const key = `${room.status}|${room.round}|${room.turn}|${room.board.join(',')}`
    const p = prev.current
    prev.current = { key, opp: opponent?.clientId ?? null, oppOnline: opponentOnline }
    const msgs: string[] = []
    if (p && p.opp && !opponent) msgs.push(t.opponentLeft)
    if (opponent && (!p || p.opp !== opponent.clientId) && p) msgs.push(t.opponentJoined(opponent.name))
    if (opponent && p && p.opp === opponent.clientId && p.oppOnline !== opponentOnline && p.oppOnline !== null) {
      msgs.push(opponentOnline ? t.opponentBack(opponent.name) : t.opponentOffline(opponent.name))
    }
    if (!p || p.key !== key) {
      if (room.status === 'finished' && room.result) {
        if (room.result.kind === 'draw') msgs.push(t.draw)
        else msgs.push(room.result.mark === mySeat ? t.youWin : t.winnerIs(playerFor(room, room.result.mark)?.name ?? ''))
      } else if (room.status === 'playing' && opponent) {
        msgs.push(room.turn === mySeat ? t.yourTurn : t.theirTurn(opponent.name))
      } else if (room.status === 'waiting') {
        msgs.push(t.waitingTitle)
      }
    }
    if (msgs.length) announce(msgs.join(' '))
  }, [room, opponent, opponentOnline, mySeat, t, announce])

  function move(index: number) {
    if (!online) return
    const res = moveRoom(room, { clientId: client.clientId, index, now: client.now() })
    if (res.ok) client.commit(res.room)
  }

  function playAgain() {
    if (!online) return
    const res = rematchVote(room, { clientId: client.clientId, now: client.now() })
    if (res.ok && res.changed) client.commit(res.room)
  }

  function leave() {
    const res = leaveRoom(room, { clientId: client.clientId, now: client.now() })
    if (res.ok) {
      if (res.room) client.commit(res.room)
      else client.clearRoom(room.id)
    }
    client.clearHeartbeat(room.id)
    router.navigate('#/')
  }

  const myTurn = room.status === 'playing' && room.turn === mySeat
  const canPlay = myTurn && online && !!opponent
  const result = room.result
  const iWon = result?.kind === 'win' && result.mark === mySeat
  const myVote = mySeat === 'X' ? room.rematch.x : room.rematch.o
  const oppVote = mySeat === 'X' ? room.rematch.o : room.rematch.x

  let turnText = ''
  if (room.status === 'playing' && opponent) turnText = myTurn ? t.yourTurn : t.theirTurn(opponent.name)

  return (
    <div className="game enter" data-testid="game" data-seat={mySeat}>
      <div className="players">
        <PlayerCard
          mark="X"
          player={room.players[0]}
          score={room.scores.x}
          isMe={mySeat === 'X'}
          online={mySeat === 'X' ? online : opponentOnline}
          active={room.status === 'playing' && room.turn === 'X'}
        />
        <div className="draws" aria-label={`${t.draws}: ${room.scores.draws}`} data-testid="draws">
          <span className="draws__label" aria-hidden="true">
            {t.draws}
          </span>
          <span className="draws__value" aria-hidden="true">
            <span key={room.scores.draws} className="score-pop">
              {room.scores.draws}
            </span>
          </span>
        </div>
        <PlayerCard
          mark="O"
          player={room.players[1]}
          score={room.scores.o}
          isMe={mySeat === 'O'}
          online={mySeat === 'O' ? online : opponentOnline}
          active={room.status === 'playing' && room.turn === 'O'}
          waitingLabel={t.waitingTitle}
        />
      </div>

      {!online && (
        <p className="notice notice--warn" role="note">
          {t.movesDisabledOffline}
        </p>
      )}

      {room.status === 'waiting' ? (
        <section className="card waiting enter" aria-labelledby="waiting-h" data-testid="waiting">
          <div className="pulse-ring" aria-hidden="true">
            <XmarkMini />
          </div>
          <h1 id="waiting-h">{t.waitingTitle}</h1>
          <p className="muted">{t.waitingBody}</p>
          <ShareBox url={router.gameUrl(room.id)} hostName={me.name} />
        </section>
      ) : (
        <section className="card play" aria-labelledby="turn-h">
          <div className="play__head">
            <span className="round-badge">{t.round(room.round)}</span>
            <h1 id="turn-h" className={`turn ${myTurn ? 'turn--me' : ''}`} data-testid="turn">
              {room.status === 'playing' ? (
                <>
                  <MarkIcon mark={room.turn} className="turn__mark" />
                  <span key={turnText} className="turn__text">
                    {turnText}
                  </span>
                </>
              ) : (
                <span className="turn__text">{t.roundOver}</span>
              )}
            </h1>
          </div>
          <Board board={room.board} winLine={result?.kind === 'win' ? result.line : null} canPlay={canPlay} onMove={move} />
          {room.status === 'finished' && result && (
            <div className={`result ${iWon ? 'result--win' : ''}`} data-testid="result">
              {iWon && <Confetti />}
              <p className="result__title">
                {result.kind === 'draw' ? t.draw : iWon ? t.youWin : t.winnerIs(playerFor(room, result.mark)?.name ?? '')}
              </p>
              {oppVote && !myVote && opponent && <p className="muted">{t.wantsRematch(opponent.name)}</p>}
              {myVote ? (
                <p className="waiting-for" data-testid="waiting-rematch">
                  <span className="dots" aria-hidden="true" />
                  {t.waitingFor(opponent?.name ?? '')}
                </p>
              ) : (
                <button type="button" className="btn btn--primary btn--lg" onClick={playAgain} disabled={!online}>
                  {t.playAgain}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <div className="game__footer">
        {room.status !== 'waiting' && (
          <details className="share-details">
            <summary className="link-btn">{t.linkLabel}</summary>
            <ShareBox url={router.gameUrl(room.id)} hostName={room.players[0]?.name ?? ''} />
          </details>
        )}
        <button type="button" className="btn btn--ghost btn--danger" onClick={leave}>
          {t.leave}
        </button>
      </div>
    </div>
  )
}

function XmarkMini() {
  return <MarkIcon mark="X" />
}

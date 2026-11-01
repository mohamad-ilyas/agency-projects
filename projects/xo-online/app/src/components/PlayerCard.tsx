import { useI18n } from '../context'
import type { Mark } from '../lib/game'
import type { Player } from '../lib/room'
import { MarkIcon } from './Marks'

interface Props {
  mark: Mark
  player: Player | null
  score: number
  isMe: boolean
  /** null = unknown yet */
  online: boolean | null
  active: boolean
  waitingLabel?: string
}

export function PlayerCard({ mark, player, score, isMe, online, active, waitingLabel }: Props) {
  const { t } = useI18n()
  const presence = online === null ? t.presenceUnknown : online ? t.online : t.offline
  const name = player?.name ?? waitingLabel ?? '—'
  return (
    <article
      className={`player player--${mark.toLowerCase()} ${active ? 'player--active' : ''} ${player ? '' : 'player--empty'}`}
      aria-label={player ? t.playerCardAria(name, mark, score, presence) : name}
      data-testid={`player-${mark}`}
    >
      <div className="player__mark" aria-hidden="true">
        <MarkIcon mark={mark} />
      </div>
      <div className="player__info">
        <p className="player__name">
          <bdi>{name}</bdi>
          {isMe && player && <span className="tag">{t.you}</span>}
        </p>
        {player && (
          <p className={`presence presence--${online === null ? 'unknown' : online ? 'on' : 'off'}`} data-testid={`presence-${mark}`}>
            <span className="presence__dot" aria-hidden="true" />
            {presence}
          </p>
        )}
      </div>
      <p className="player__score" aria-hidden="true">
        <span key={score} className="score-pop">
          {score}
        </span>
      </p>
    </article>
  )
}

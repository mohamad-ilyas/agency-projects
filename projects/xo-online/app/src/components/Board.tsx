import { useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../context'
import type { Cell, Line } from '../lib/game'
import { MarkIcon } from './Marks'

interface Props {
  board: readonly Cell[]
  winLine: Line | null
  /** True when the local player may place a mark now. */
  canPlay: boolean
  onMove: (index: number) => void
}

/**
 * 3×3 board as a labelled group of buttons with a roving tabindex and arrow-key navigation (AC-12.3).
 * The board is always laid out left-to-right (dir="ltr") so both players see identical positions,
 * whatever their UI language; labels use row/column numbers in the current language.
 */
export function Board({ board, winLine, canPlay, onMove }: Props) {
  const { t } = useI18n()
  const [focusIdx, setFocusIdx] = useState(4)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function focusCell(i: number) {
    setFocusIdx(i)
    refs.current[i]?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const r = Math.floor(i / 3)
    const c = i % 3
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
        next = r * 3 + Math.min(2, c + 1)
        break
      case 'ArrowLeft':
        next = r * 3 + Math.max(0, c - 1)
        break
      case 'ArrowDown':
        next = Math.min(2, r + 1) * 3 + c
        break
      case 'ArrowUp':
        next = Math.max(0, r - 1) * 3 + c
        break
      case 'Home':
        next = e.ctrlKey ? 0 : r * 3
        break
      case 'End':
        next = e.ctrlKey ? 8 : r * 3 + 2
        break
    }
    if (next !== null) {
      e.preventDefault()
      focusCell(next)
    }
  }

  const winSet = new Set(winLine ?? [])
  const center = (i: number) => ({ x: (i % 3) * 100 + 50, y: Math.floor(i / 3) * 100 + 50 })
  let line: { x1: number; y1: number; x2: number; y2: number } | null = null
  if (winLine) {
    const a = center(winLine[0])
    const b = center(winLine[2])
    const dx = Math.sign(b.x - a.x) * 32
    const dy = Math.sign(b.y - a.y) * 32
    line = { x1: a.x - dx, y1: a.y - dy, x2: b.x + dx, y2: b.y + dy }
  }

  return (
    <div className={`board-wrap ${canPlay ? 'board-wrap--active' : ''}`}>
      <div className="board" role="group" aria-label={t.boardLabel} dir="ltr" data-testid="board">
        {board.map((cell, i) => {
          const playable = canPlay && cell === null
          return (
            <button
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              className={`cell ${cell ? 'cell--filled' : ''} ${playable ? 'cell--playable' : ''} ${winSet.has(i) ? 'cell--win' : ''}`}
              aria-label={t.cellLabel(Math.floor(i / 3) + 1, (i % 3) + 1, cell)}
              aria-disabled={!playable}
              tabIndex={i === focusIdx ? 0 : -1}
              onFocus={() => setFocusIdx(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => {
                if (playable) onMove(i)
              }}
              data-testid={`cell-${i}`}
            >
              {cell && <MarkIcon mark={cell} />}
            </button>
          )
        })}
      </div>
      {line && (
        <svg className="winline" viewBox="0 0 300 300" aria-hidden="true" focusable="false">
          <line {...line} pathLength={1} />
        </svg>
      )}
    </div>
  )
}

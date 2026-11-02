/** Animated SVG marks: X draws as two strokes, O as a circle (stroke-dashoffset; see index.css). */
import type { Mark } from '../lib/game'

export function XMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`mark mark--x ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="mark__stroke mark__stroke--1" d="M26 26 L74 74" pathLength={1} />
      <path className="mark__stroke mark__stroke--2" d="M74 26 L26 74" pathLength={1} />
    </svg>
  )
}

export function OMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`mark mark--o ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className="mark__stroke mark__stroke--1" cx="50" cy="50" r="26" pathLength={1} />
    </svg>
  )
}

export function MarkIcon({ mark, className }: { mark: Mark; className?: string }) {
  return mark === 'X' ? <XMark className={className} /> : <OMark className={className} />
}

/** CSS-only celebration burst. Hidden entirely under prefers-reduced-motion (index.css). */
const PIECES = Array.from({ length: 18 }, (_, i) => i)

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((i) => (
        <span key={i} className="confetti__piece" style={{ ['--i' as string]: i }} />
      ))}
    </div>
  )
}

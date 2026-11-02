import { splitIsolates } from '../lib/bidi'

/** Renders a translated string, turning FSI…PDI-isolated names (lib/bidi `isolate`) into <bdi> elements (F-06). */
export function Isolated({ text }: { text: string }) {
  return (
    <>
      {splitIsolates(text).map((seg, i) => (seg.isolated ? <bdi key={i}>{seg.text}</bdi> : seg.text))}
    </>
  )
}

/**
 * F-06: bidi isolation of user-provided names inside translated sentences.
 * `isolate(name)` wraps a name in FSI…PDI (U+2068 … U+2069), which is correct for plain text (share text, aria).
 * `splitIsolates` lets components render those segments as <bdi> elements instead (see components/Isolated.tsx).
 * Names never contain FSI/PDI themselves: normalizeName strips all bidi controls.
 */
export const FSI = '⁨'
export const PDI = '⁩'

export function isolate(text: string): string {
  return FSI + text + PDI
}

export interface Segment {
  text: string
  isolated: boolean
}

export function splitIsolates(s: string): Segment[] {
  const out: Segment[] = []
  let rest = s
  while (rest) {
    const start = rest.indexOf(FSI)
    const end = start < 0 ? -1 : rest.indexOf(PDI, start + 1)
    if (start < 0 || end < 0) {
      out.push({ text: rest, isolated: false })
      break
    }
    if (start > 0) out.push({ text: rest.slice(0, start), isolated: false })
    out.push({ text: rest.slice(start + 1, end), isolated: true })
    rest = rest.slice(end + 1)
  }
  return out
}

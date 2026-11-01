import { NAME_MAX, nameLength, normalizeName } from './room'

export type NameError = 'empty' | 'tooLong'

/** 1–20 characters after trimming (counted in code points so Arabic/emoji are fair). */
export function validateName(raw: string): { ok: true; name: string } | { ok: false; error: NameError } {
  const name = normalizeName(raw)
  if (nameLength(name) === 0) return { ok: false, error: 'empty' }
  if (nameLength(name) > NAME_MAX) return { ok: false, error: 'tooLong' }
  return { ok: true, name }
}

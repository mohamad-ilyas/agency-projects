/** Random identifiers (not secrets): room ids appear in share links, client ids identify a browser. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function randomId(length: number, alphabet = ALPHABET): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}

export const newRoomId = () => randomId(8)
export const newClientId = () => randomId(16, ALPHABET + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')

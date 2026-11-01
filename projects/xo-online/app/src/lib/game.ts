/** Pure tic-tac-toe rules: board, move validation, outcome, scoring and rematch. No I/O. */

export type Mark = 'X' | 'O'
export type Cell = Mark | null
/** 9 cells, row-major: index = row * 3 + column. */
export type Board = readonly Cell[]
export type Line = readonly [number, number, number]

export const LINES: readonly Line[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export type Outcome = { kind: 'win'; mark: Mark; line: Line } | { kind: 'draw' }

export type MoveError = 'finished' | 'not-started' | 'not-seated' | 'wrong-turn' | 'occupied' | 'out-of-range'

export interface Scores {
  x: number
  o: number
  draws: number
}

export interface RematchVotes {
  x: boolean
  o: boolean
}

export function emptyBoard(): Cell[] {
  return Array<Cell>(9).fill(null)
}

export function other(mark: Mark): Mark {
  return mark === 'X' ? 'O' : 'X'
}

export function findWinner(board: Board): { mark: Mark; line: Line } | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const m = board[a]
    if (m && m === board[b] && m === board[c]) return { mark: m, line }
  }
  return null
}

export function isFull(board: Board): boolean {
  return board.every((c) => c !== null)
}

/** Win takes precedence over a full board (a last move can both fill and win). */
export function outcomeOf(board: Board): Outcome | null {
  const w = findWinner(board)
  if (w) return { kind: 'win', mark: w.mark, line: w.line }
  if (isFull(board)) return { kind: 'draw' }
  return null
}

export interface MoveContext {
  board: Board
  turn: Mark
  /** 'waiting' = no opponent yet; 'finished' = round over. */
  phase: 'waiting' | 'playing' | 'finished'
}

/** Returns why a move is invalid, or null if it is allowed. `mark` is null for non-seated visitors. */
export function validateMove(ctx: MoveContext, mark: Mark | null, index: number): MoveError | null {
  if (ctx.phase === 'finished') return 'finished'
  if (mark === null) return 'not-seated'
  if (ctx.phase === 'waiting') return 'not-started'
  if (!Number.isInteger(index) || index < 0 || index > 8) return 'out-of-range'
  if (ctx.turn !== mark) return 'wrong-turn'
  if (ctx.board[index] !== null) return 'occupied'
  return null
}

export type MoveResult =
  | { ok: true; board: Cell[]; turn: Mark; outcome: Outcome | null }
  | { ok: false; reason: MoveError }

export function applyMove(ctx: MoveContext, mark: Mark | null, index: number): MoveResult {
  const reason = validateMove(ctx, mark, index)
  if (reason || mark === null) return { ok: false, reason: reason ?? 'not-seated' }
  const board = ctx.board.slice()
  board[index] = mark
  return { ok: true, board, turn: other(mark), outcome: outcomeOf(board) }
}

/** Round 1 is started by X, then the starter alternates every round. */
export function starterForRound(round: number): Mark {
  return round % 2 === 1 ? 'X' : 'O'
}

/**
 * Adds the outcome to the score exactly once per round: `scoredRound` remembers the last round counted.
 * Returns the inputs unchanged if this round was already counted.
 */
export function scoreRound(
  scores: Scores,
  outcome: Outcome,
  round: number,
  scoredRound: number,
): { scores: Scores; scoredRound: number } {
  if (scoredRound >= round) return { scores, scoredRound }
  const next = { ...scores }
  if (outcome.kind === 'draw') next.draws += 1
  else if (outcome.mark === 'X') next.x += 1
  else next.o += 1
  return { scores: next, scoredRound: round }
}

/** Records a rematch vote; `start` is true once both players have voted. */
export function voteRematch(votes: RematchVotes, mark: Mark): { votes: RematchVotes; start: boolean } {
  const next = mark === 'X' ? { ...votes, x: true } : { ...votes, o: true }
  return { votes: next, start: next.x && next.o }
}

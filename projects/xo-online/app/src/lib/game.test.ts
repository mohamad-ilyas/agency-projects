import { describe, expect, it } from 'vitest'
import { applyMove, emptyBoard, findWinner, outcomeOf, scoreRound, starterForRound, validateMove, voteRematch, type Cell } from './game'

const b = (s: string): Cell[] => [...s].map((c) => (c === 'X' || c === 'O' ? c : null))

describe('game rules', () => {
  it('detects rows, columns and diagonals with the winning line', () => {
    expect(findWinner(b('XXX......'))).toEqual({ mark: 'X', line: [0, 1, 2] })
    expect(findWinner(b('.O..O..O.'))).toEqual({ mark: 'O', line: [1, 4, 7] })
    expect(findWinner(b('..X.X.X..'))).toEqual({ mark: 'X', line: [2, 4, 6] })
    expect(findWinner(b('XOX......'))).toBeNull()
  })

  it('detects a draw only when full with no line; a winning last move is a win', () => {
    expect(outcomeOf(b('XOXXOOOXX'))).toEqual({ kind: 'draw' })
    expect(outcomeOf(b('XOXOXOOXX'))?.kind).toBe('win')
    expect(outcomeOf(emptyBoard())).toBeNull()
  })

  it('rejects occupied, wrong turn, finished, not seated, not started and out of range', () => {
    const ctx = { board: b('X........'), turn: 'O' as const, phase: 'playing' as const }
    expect(validateMove(ctx, 'O', 0)).toBe('occupied')
    expect(validateMove(ctx, 'X', 1)).toBe('wrong-turn')
    expect(validateMove({ ...ctx, phase: 'finished' }, 'O', 1)).toBe('finished')
    expect(validateMove(ctx, null, 1)).toBe('not-seated')
    expect(validateMove({ ...ctx, phase: 'waiting' }, 'O', 1)).toBe('not-started')
    expect(validateMove(ctx, 'O', 9)).toBe('out-of-range')
    expect(validateMove(ctx, 'O', 1)).toBeNull()
  })

  it('applies a move immutably and passes the turn', () => {
    const board = emptyBoard()
    const res = applyMove({ board, turn: 'X', phase: 'playing' }, 'X', 4)
    expect(res.ok && res.board[4]).toBe('X')
    expect(res.ok && res.turn).toBe('O')
    expect(board[4]).toBeNull()
  })

  it('alternates the starter: round 1 X, round 2 O, round 3 X', () => {
    expect([1, 2, 3, 4].map(starterForRound)).toEqual(['X', 'O', 'X', 'O'])
  })

  it('scores a round exactly once', () => {
    const s0 = { x: 0, o: 0, draws: 0 }
    const once = scoreRound(s0, { kind: 'win', mark: 'O', line: [0, 1, 2] }, 1, 0)
    expect(once.scores).toEqual({ x: 0, o: 1, draws: 0 })
    const twice = scoreRound(once.scores, { kind: 'win', mark: 'O', line: [0, 1, 2] }, 1, once.scoredRound)
    expect(twice.scores).toEqual({ x: 0, o: 1, draws: 0 })
    expect(scoreRound(s0, { kind: 'draw' }, 2, 1).scores.draws).toBe(1)
  })

  it('starts a rematch only after both votes', () => {
    const one = voteRematch({ x: false, o: false }, 'X')
    expect(one.start).toBe(false)
    expect(voteRematch(one.votes, 'X').start).toBe(false)
    expect(voteRematch(one.votes, 'O').start).toBe(true)
  })
})

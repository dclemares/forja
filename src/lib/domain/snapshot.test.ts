import { describe, it, expect } from 'vitest'
import { buildWorkoutFromSession, lastSetsForExercise, cloneSets } from './snapshot'
import type { Exercise, Session, Workout } from '@/lib/types'

const exercises: Exercise[] = [
  { id: 'e1', name: 'Press de pecho', muscleGroup: 'Pecho', createdAt: '2026-01-01' },
  { id: 'e2', name: 'Aperturas', muscleGroup: 'Pecho', createdAt: '2026-01-01' },
]
const session: Session = { id: 's1', name: 'Pecho 1', exerciseIds: ['e1', 'e2'], createdAt: '2026-01-01' }

describe('snapshot', () => {
  it('construye un entreno independiente con snapshot de nombre/grupo', () => {
    let n = 0
    const w = buildWorkoutFromSession({ session, exercises, date: '2026-06-19', id: () => `id${n++}` })
    expect(w.sessionId).toBe('s1')
    expect(w.name).toBe('Pecho 1')
    expect(w.exercises.map((e) => e.name)).toEqual(['Press de pecho', 'Aperturas'])
    expect(w.exercises[0].sets).toEqual([])
    expect(w.exercises[0].exerciseId).toBe('e1')
  })

  it('lastSetsForExercise devuelve la última sesión con datos', () => {
    const history: Workout[] = [
      { id: 'w1', date: '2026-06-09', sessionId: 's1', name: 'Pecho 1', createdAt: '', exercises: [{ id: 'a', exerciseId: 'e1', name: 'Press', muscleGroup: 'Pecho', sets: [{ id: '1', weight: 50, reps: 12 }] }] },
      { id: 'w2', date: '2026-06-16', sessionId: 's1', name: 'Pecho 1', createdAt: '', exercises: [{ id: 'b', exerciseId: 'e1', name: 'Press', muscleGroup: 'Pecho', sets: [{ id: '2', weight: 55, reps: 10 }] }] },
    ]
    expect(lastSetsForExercise('e1', history)).toEqual([{ weight: 55, reps: 10 }])
  })

  it('lastSetsForExercise excluye el entreno actual', () => {
    const history: Workout[] = [
      { id: 'today', date: '2026-06-19', sessionId: 's1', name: 'Pecho 1', createdAt: '', exercises: [{ id: 'b', exerciseId: 'e1', name: 'Press', muscleGroup: 'Pecho', sets: [{ id: '2', weight: 99, reps: 9 }] }] },
      { id: 'w1', date: '2026-06-09', sessionId: 's1', name: 'Pecho 1', createdAt: '', exercises: [{ id: 'a', exerciseId: 'e1', name: 'Press', muscleGroup: 'Pecho', sets: [{ id: '1', weight: 50, reps: 12 }] }] },
    ]
    expect(lastSetsForExercise('e1', history, 'today')).toEqual([{ weight: 50, reps: 12 }])
  })

  it('cloneSets genera ids nuevos manteniendo peso/reps', () => {
    let n = 0
    const cloned = cloneSets([{ weight: 50, reps: 12 }], () => `c${n++}`)
    expect(cloned).toEqual([{ id: 'c0', weight: 50, reps: 12 }])
  })
})

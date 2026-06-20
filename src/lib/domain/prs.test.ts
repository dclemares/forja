import { describe, it, expect } from 'vitest'
import { exerciseHistoryMax, exercisePR, topSetWeight, workoutPRCount } from './prs'
import type { Workout, WorkoutExercise } from '@/lib/types'

const ex = (sets: [number, number][]): WorkoutExercise => ({
  id: 'we' + Math.random(),
  exerciseId: 'e1',
  name: 'Press',
  muscleGroup: 'Pecho',
  sets: sets.map(([weight, reps], i) => ({ id: String(i), weight, reps })),
})

const fw = (id: string, date: string, e: WorkoutExercise): Workout => ({
  id,
  date,
  sessionId: null,
  name: 'n',
  createdAt: date,
  finishedAt: `${date}T10:00:00Z`,
  exercises: [e],
})

describe('prs', () => {
  it('topSetWeight devuelve la serie más pesada', () => {
    expect(topSetWeight(ex([[50, 10], [60, 8], [55, 8]]))).toBe(60)
  })

  it('exerciseHistoryMax ignora el entreno actual y los no finalizados', () => {
    const history = [fw('a', '2026-06-01', ex([[50, 10]])), fw('b', '2026-06-08', ex([[70, 5]]))]
    const max = exerciseHistoryMax('e1', history, 'b')
    expect(max.maxWeight).toBe(50)
  })

  it('exercisePR detecta récord de peso solo si hay histórico', () => {
    const history = [fw('a', '2026-06-01', ex([[50, 10]]))]
    const today = ex([[60, 10]])
    const cur = fw('cur', '2026-06-08', today)
    expect(exercisePR(today, [...history, cur], 'cur')).toEqual({ weight: true, volume: true })
  })

  it('exercisePR no celebra en la primera vez (sin histórico)', () => {
    const today = ex([[60, 10]])
    const cur = fw('cur', '2026-06-08', today)
    expect(exercisePR(today, [cur], 'cur')).toEqual({ weight: false, volume: false })
  })

  it('workoutPRCount suma récords de peso y volumen', () => {
    const history = [fw('a', '2026-06-01', ex([[50, 10]]))] // peso 50, vol 500
    const cur = fw('cur', '2026-06-08', ex([[60, 10]])) // peso 60 (PR), vol 600 (PR)
    expect(workoutPRCount(cur.exercises[0] && cur, [...history, cur])).toBe(2)
  })
})

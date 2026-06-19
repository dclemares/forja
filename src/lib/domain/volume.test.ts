import { describe, it, expect } from 'vitest'
import {
  setVolume,
  exerciseVolume,
  workoutVolume,
  workoutSetCount,
  volumeByMuscleGroup,
  formatSetsSummary,
} from './volume'
import type { Workout } from '@/lib/types'

const ex = (muscleGroup: any, sets: [number, number][]) => ({
  id: 'x',
  exerciseId: 'e',
  name: 'n',
  muscleGroup,
  sets: sets.map(([weight, reps], i) => ({ id: String(i), weight, reps })),
})

describe('volume', () => {
  it('setVolume = peso × reps', () => {
    expect(setVolume({ weight: 50, reps: 12 })).toBe(600)
  })

  it('exerciseVolume suma las series', () => {
    expect(exerciseVolume(ex('Pecho', [[50, 12], [55, 10], [55, 8]]))).toBe(1590)
  })

  it('workoutVolume suma los ejercicios', () => {
    const w = { exercises: [ex('Pecho', [[50, 12]]), ex('Pecho', [[20, 14]])] } as Workout
    expect(workoutVolume(w)).toBe(600 + 280)
  })

  it('workoutSetCount cuenta todas las series', () => {
    const w = { exercises: [ex('Pecho', [[50, 12], [55, 10]]), ex('Bíceps', [[20, 14]])] } as Workout
    expect(workoutSetCount(w)).toBe(3)
  })

  it('volumeByMuscleGroup agrega por grupo', () => {
    const w = { exercises: [ex('Pecho', [[50, 10]]), ex('Bíceps', [[20, 10]]), ex('Pecho', [[10, 10]])] } as Workout
    expect(volumeByMuscleGroup([w])).toEqual({ Pecho: 600, 'Bíceps': 200 })
  })

  it('formatSetsSummary', () => {
    expect(formatSetsSummary([{ weight: 55, reps: 10 }, { weight: 55, reps: 8 }])).toBe('55×10 · 55×8')
  })
})

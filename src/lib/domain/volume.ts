import type { MuscleGroup, Workout, WorkoutExercise, WorkoutSet } from '@/lib/types'

/** Volumen de una serie = peso × repeticiones. */
export const setVolume = (s: Pick<WorkoutSet, 'weight' | 'reps'>): number => s.weight * s.reps

/** Volumen de un ejercicio = suma del volumen de sus series. */
export const exerciseVolume = (ex: Pick<WorkoutExercise, 'sets'>): number =>
  ex.sets.reduce((acc, s) => acc + setVolume(s), 0)

/** Volumen de un entreno = suma del volumen de sus ejercicios. */
export const workoutVolume = (w: Pick<Workout, 'exercises'>): number =>
  w.exercises.reduce((acc, ex) => acc + exerciseVolume(ex), 0)

/** Nº total de series del entreno. */
export const workoutSetCount = (w: Pick<Workout, 'exercises'>): number =>
  w.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)

/** Volumen agregado por grupo muscular. */
export const volumeByMuscleGroup = (
  workouts: Pick<Workout, 'exercises'>[],
): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const w of workouts) {
    for (const ex of w.exercises) {
      out[ex.muscleGroup] = (out[ex.muscleGroup] ?? 0) + exerciseVolume(ex)
    }
  }
  return out
}

/** Resumen "55×10 · 55×8 · 52×8". */
export const formatSetsSummary = (sets: Pick<WorkoutSet, 'weight' | 'reps'>[]): string =>
  sets.map((s) => `${s.weight}×${s.reps}`).join(' · ')

export type { MuscleGroup }

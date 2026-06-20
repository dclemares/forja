import type { Workout, WorkoutExercise } from '@/lib/types'
import { exerciseVolume } from './volume'

/** Peso de la serie más pesada de un ejercicio. */
export const topSetWeight = (ex: Pick<WorkoutExercise, 'sets'>): number =>
  ex.sets.reduce((m, s) => Math.max(m, s.weight), 0)

export interface ExerciseMax {
  maxWeight: number
  maxVolume: number
}

/** Máximos históricos (peso de serie y volumen) de un ejercicio en entrenos finalizados. */
export function exerciseHistoryMax(
  exerciseId: string | null,
  workouts: Workout[],
  excludeWorkoutId?: string,
): ExerciseMax {
  let maxWeight = 0
  let maxVolume = 0
  if (!exerciseId) return { maxWeight, maxVolume }
  for (const w of workouts) {
    if (w.id === excludeWorkoutId || !w.finishedAt) continue
    for (const ex of w.exercises) {
      if (ex.exerciseId === exerciseId && ex.sets.length) {
        maxWeight = Math.max(maxWeight, topSetWeight(ex))
        maxVolume = Math.max(maxVolume, exerciseVolume(ex))
      }
    }
  }
  return { maxWeight, maxVolume }
}

export interface PRFlags {
  weight: boolean
  volume: boolean
}

/** ¿El ejercicio actual supera su récord histórico de peso o de volumen?
 *  Solo cuenta como récord si existe histórico previo (no en la primera vez). */
export function exercisePR(ex: WorkoutExercise, workouts: Workout[], currentWorkoutId: string): PRFlags {
  if (!ex.sets.length) return { weight: false, volume: false }
  const { maxWeight, maxVolume } = exerciseHistoryMax(ex.exerciseId, workouts, currentWorkoutId)
  return {
    weight: maxWeight > 0 && topSetWeight(ex) > maxWeight,
    volume: maxVolume > 0 && exerciseVolume(ex) > maxVolume,
  }
}

/** Nº de récords nuevos (peso o volumen) logrados en un entreno. */
export function workoutPRCount(w: Workout, workouts: Workout[]): number {
  let n = 0
  for (const ex of w.exercises) {
    const pr = exercisePR(ex, workouts, w.id)
    if (pr.weight) n++
    if (pr.volume) n++
  }
  return n
}

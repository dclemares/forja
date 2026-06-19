import type { Exercise, Session, Workout, WorkoutExercise, WorkoutSet } from '@/lib/types'

type IdGen = () => string

/**
 * Crea un entreno como copia independiente de una plantilla (snapshot de
 * nombre/grupo). Las series empiezan vacías; se prerellenan al abrir el ejercicio.
 */
export function buildWorkoutFromSession(opts: {
  session: Session
  exercises: Exercise[]
  date: string
  id: IdGen
}): Workout {
  const byId = new Map(opts.exercises.map((e) => [e.id, e]))
  const exercises: WorkoutExercise[] = opts.session.exerciseIds.map((eid) => {
    const e = byId.get(eid)
    return {
      id: opts.id(),
      exerciseId: eid,
      name: e?.name ?? 'Ejercicio',
      muscleGroup: e?.muscleGroup ?? 'Pecho',
      sets: [],
    }
  })
  return {
    id: opts.id(),
    date: opts.date,
    sessionId: opts.session.id,
    name: opts.session.name,
    exercises,
    createdAt: opts.date,
    finishedAt: null,
  }
}

/** Entreno libre vacío. */
export function buildFreeWorkout(opts: { date: string; id: IdGen }): Workout {
  return {
    id: opts.id(),
    date: opts.date,
    sessionId: null,
    name: 'Entrenamiento libre',
    exercises: [],
    createdAt: opts.date,
    finishedAt: null,
  }
}

/** Series de la última vez que se hizo ese ejercicio (excluyendo un entreno). */
export function lastSetsForExercise(
  exerciseId: string | null,
  workouts: Workout[],
  excludeWorkoutId?: string,
): Pick<WorkoutSet, 'weight' | 'reps'>[] {
  if (!exerciseId) return []
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date))
  for (const w of sorted) {
    if (w.id === excludeWorkoutId) continue
    for (const ex of w.exercises) {
      if (ex.exerciseId === exerciseId && ex.sets.length) {
        return ex.sets.map((s) => ({ weight: s.weight, reps: s.reps }))
      }
    }
  }
  return []
}

/** Clona series (peso/reps) con nuevos ids. */
export function cloneSets(
  sets: Pick<WorkoutSet, 'weight' | 'reps'>[],
  id: IdGen,
): WorkoutSet[] {
  return sets.map((s) => ({ id: id(), weight: s.weight, reps: s.reps }))
}

export const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Bíceps',
  'Tríceps',
  'Hombro',
  'Pierna',
  'Abdomen',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  archived?: boolean
  createdAt: string
}

/** Plantilla / rutina. Orden = orden de inserción (sin reordenado manual). */
export interface Session {
  id: string
  name: string
  exerciseIds: string[]
  createdAt: string
}

/** day_of_week (0=Lun … 6=Dom) → sessionId | null (descanso). */
export type WeeklyPlan = Record<number, string | null>

export interface WorkoutSet {
  id: string
  weight: number
  reps: number
  /** Esfuerzo percibido (RPE 6–10), opcional. */
  rpe?: number
  /** Nota libre de la serie, opcional. */
  note?: string
}

/** Copia independiente del ejercicio dentro de un entreno (con snapshot). */
export interface WorkoutExercise {
  id: string
  exerciseId: string | null
  name: string
  muscleGroup: MuscleGroup
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  date: string // ISO yyyy-mm-dd
  sessionId: string | null
  name: string
  exercises: WorkoutExercise[]
  createdAt: string
  finishedAt?: string | null
}

export interface BodyweightLog {
  id: string
  date: string // ISO yyyy-mm-dd
  weight: number
}

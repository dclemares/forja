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

// ---- Nutrición ----

/** Macros. En `Food.per100` son por 100 g; en `DiaryEntry`/total de `Meal` son absolutos. */
export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** Alimento de la biblioteca (valores por 100 g). */
export interface Food {
  id: string
  name: string
  brand?: string
  per100: Macros
  barcode?: string
  createdAt: string
}

/** Ingrediente de una comida (receta). */
export interface MealComponent {
  foodId: string
  grams: number
}

/** Comida = receta reutilizable, suma de alimentos. */
export interface Meal {
  id: string
  name: string
  components: MealComponent[]
  createdAt: string
}

export type MealSlot = 'desayuno' | 'comida' | 'cena' | 'snack'
export const MEAL_SLOTS: MealSlot[] = ['desayuno', 'comida', 'cena', 'snack']
export type DiarySource = 'food' | 'meal' | 'quick' | 'photo'

/** Entrada del diario: snapshot de lo realmente comido (macros absolutos). */
export interface DiaryEntry {
  id: string
  date: string // ISO yyyy-mm-dd
  slot: MealSlot
  label: string
  grams?: number
  macros: Macros
  source: DiarySource
  refId?: string // foodId o mealId de origen (trazabilidad)
  createdAt: string
}

export interface NutritionGoal {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const DEFAULT_NUTRITION_GOAL: NutritionGoal = { kcal: 2200, protein: 150, carbs: 220, fat: 70 }

import type { AppState } from './store'
import type { DiaryEntry, Exercise, Food, MuscleGroup, Workout, WorkoutExercise } from './types'
import { DEFAULT_NUTRITION_GOAL } from './types'
import { todayISO, uid } from './format'

const mkFood = (id: string, name: string, kcal: number, protein: number, carbs: number, fat: number, brand?: string): Food => ({
  id,
  name,
  brand,
  per100: { kcal, protein, carbs, fat },
  createdAt: '2026-05-01',
})

const SEED_FOODS = {
  pollo: mkFood('food-pollo', 'Pechuga de pollo', 165, 31, 0, 3.6),
  arroz: mkFood('food-arroz', 'Arroz blanco cocido', 130, 2.7, 28, 0.3),
  platano: mkFood('food-platano', 'Plátano', 89, 1.1, 23, 0.3),
  avena: mkFood('food-avena', 'Copos de avena', 380, 13, 60, 7),
  leche: mkFood('food-leche', 'Leche semidesnatada', 47, 3.4, 5, 1.6),
}

const mkEx = (id: string, name: string, muscleGroup: MuscleGroup): Exercise => ({
  id,
  name,
  muscleGroup,
  createdAt: '2026-05-01',
})

const E = {
  pressMaq: mkEx('ex-press-maq', 'Press de pecho en máquina', 'Pecho'),
  pressInc: mkEx('ex-press-inc', 'Press inclinado con mancuernas', 'Pecho'),
  aperturas: mkEx('ex-aperturas', 'Aperturas en polea', 'Pecho'),
  bicepsBanco: mkEx('ex-biceps-banco', 'Bíceps en banco inclinado', 'Bíceps'),
  bicepsPolea: mkEx('ex-biceps-polea', 'Bíceps en polea', 'Bíceps'),
  curlManc: mkEx('ex-curl-manc', 'Curl con mancuernas', 'Bíceps'),
  curlMartillo: mkEx('ex-curl-martillo', 'Curl martillo', 'Bíceps'),
  jalon: mkEx('ex-jalon', 'Jalón al pecho', 'Espalda'),
  remo: mkEx('ex-remo', 'Remo en máquina', 'Espalda'),
  sentadilla: mkEx('ex-sentadilla', 'Sentadilla', 'Pierna'),
  prensa: mkEx('ex-prensa', 'Prensa', 'Pierna'),
  pressMilitar: mkEx('ex-press-militar', 'Press militar', 'Hombro'),
  tricepPolea: mkEx('ex-tricep-polea', 'Extensión de tríceps en polea', 'Tríceps'),
  crunch: mkEx('ex-crunch', 'Crunch abdominal', 'Abdomen'),
}

const we = (e: Exercise, sets: [number, number][]): WorkoutExercise => ({
  id: uid(),
  exerciseId: e.id,
  name: e.name,
  muscleGroup: e.muscleGroup,
  sets: sets.map(([weight, reps]) => ({ id: uid(), weight, reps })),
})

const workout = (date: string, name: string, sessionId: string, exercises: WorkoutExercise[]): Workout => ({
  id: uid(),
  date,
  sessionId,
  name,
  exercises,
  createdAt: date,
  finishedAt: date,
})

export function buildSeed(): AppState {
  return {
    exercises: Object.values(E),
    sessions: [
      { id: 's-pecho1', name: 'Pecho 1', exerciseIds: [E.pressMaq.id, E.pressInc.id, E.aperturas.id, E.bicepsBanco.id], createdAt: '2026-05-01' },
      { id: 's-espalda1', name: 'Espalda 1', exerciseIds: [E.jalon.id, E.remo.id, E.curlManc.id], createdAt: '2026-05-01' },
      { id: 's-pierna1', name: 'Pierna 1', exerciseIds: [E.sentadilla.id, E.prensa.id, E.pressMilitar.id], createdAt: '2026-05-01' },
    ],
    weeklyPlan: { 0: 's-pecho1', 1: 's-espalda1', 2: null, 3: 's-pecho1', 4: 's-pecho1', 5: 's-pierna1', 6: null },
    workouts: [
      workout('2026-06-02', 'Pecho 1', 's-pecho1', [
        we(E.pressMaq, [[50, 12], [55, 10], [55, 8]]),
        we(E.pressInc, [[18, 12], [20, 10]]),
        we(E.aperturas, [[18, 14], [20, 12]]),
        we(E.bicepsBanco, [[10, 12], [12, 10]]),
      ]),
      workout('2026-06-09', 'Pecho 1', 's-pecho1', [
        we(E.pressMaq, [[52, 12], [55, 11], [55, 9]]),
        we(E.pressInc, [[18, 12], [20, 11]]),
        we(E.aperturas, [[20, 14], [22, 12]]),
        we(E.bicepsBanco, [[12, 12], [12, 11]]),
      ]),
      workout('2026-06-11', 'Espalda 1', 's-espalda1', [
        we(E.jalon, [[55, 12], [60, 10], [60, 9]]),
        we(E.remo, [[40, 12], [45, 10]]),
        we(E.curlManc, [[12, 12], [14, 10]]),
      ]),
      workout('2026-06-16', 'Pecho 1', 's-pecho1', [
        we(E.pressMaq, [[55, 12], [57, 10], [57, 9]]),
        we(E.pressInc, [[20, 12], [20, 12]]),
        we(E.aperturas, [[22, 14], [22, 12]]),
        we(E.bicepsBanco, [[12, 12], [14, 10]]),
      ]),
      workout('2026-06-17', 'Espalda 1', 's-espalda1', [
        we(E.jalon, [[57, 12], [62, 10], [62, 9]]),
        we(E.remo, [[42, 12], [45, 11]]),
        we(E.curlManc, [[12, 12], [14, 11]]),
      ]),
    ],
    bodyweight: [
      { id: uid(), date: '2026-05-22', weight: 79.4 },
      { id: uid(), date: '2026-05-29', weight: 79.1 },
      { id: uid(), date: '2026-06-05', weight: 78.9 },
      { id: uid(), date: '2026-06-12', weight: 78.6 },
      { id: uid(), date: '2026-06-18', weight: 78.4 },
    ],
    activeWorkoutId: null,
    foods: Object.values(SEED_FOODS),
    meals: [
      {
        id: 'meal-batido',
        name: 'Batido de avena',
        components: [
          { foodId: SEED_FOODS.avena.id, grams: 50 },
          { foodId: SEED_FOODS.leche.id, grams: 250 },
          { foodId: SEED_FOODS.platano.id, grams: 100 },
        ],
        createdAt: '2026-05-01',
      },
    ],
    diary: [
      diaryEntry('comida', 'Pechuga de pollo', 200, { kcal: 330, protein: 62, carbs: 0, fat: 7.2 }, 'food', SEED_FOODS.pollo.id),
      diaryEntry('comida', 'Arroz blanco cocido', 150, { kcal: 195, protein: 4, carbs: 42, fat: 0.5 }, 'food', SEED_FOODS.arroz.id),
      diaryEntry('snack', 'Plátano', 120, { kcal: 107, protein: 1.3, carbs: 27.6, fat: 0.4 }, 'food', SEED_FOODS.platano.id),
    ],
    nutritionGoal: { kcal: 2400, protein: 165, carbs: 250, fat: 75 },
  }
}

const diaryEntry = (
  slot: DiaryEntry['slot'],
  label: string,
  grams: number,
  macros: DiaryEntry['macros'],
  source: DiaryEntry['source'],
  refId?: string,
): DiaryEntry => ({ id: uid(), date: todayISO(), slot, label, grams, macros, source, refId, createdAt: todayISO() })

/** Estado de arranque para un usuario NUEVO: cuenta completamente vacía. */
export function buildEmpty(): AppState {
  return {
    exercises: [],
    sessions: [],
    weeklyPlan: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    workouts: [],
    bodyweight: [],
    activeWorkoutId: null,
    foods: [],
    meals: [],
    diary: [],
    nutritionGoal: DEFAULT_NUTRITION_GOAL,
  }
}

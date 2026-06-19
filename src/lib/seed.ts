import type { AppState } from './store'
import type { Exercise, MuscleGroup, Workout, WorkoutExercise } from './types'
import { todayISO, uid } from './format'

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
  }
}

/** Estado de arranque para un usuario NUEVO en la nube: biblioteca + sesiones
 *  con ids uuid, sin historial ni peso corporal inventados. */
export function buildStarter(): AppState {
  const mk = (name: string, mg: MuscleGroup): Exercise => ({ id: uid(), name, muscleGroup: mg, createdAt: todayISO() })
  const lib = {
    pressMaq: mk('Press de pecho en máquina', 'Pecho'),
    pressInc: mk('Press inclinado con mancuernas', 'Pecho'),
    aperturas: mk('Aperturas en polea', 'Pecho'),
    bicepsBanco: mk('Bíceps en banco inclinado', 'Bíceps'),
    curlManc: mk('Curl con mancuernas', 'Bíceps'),
    jalon: mk('Jalón al pecho', 'Espalda'),
    remo: mk('Remo en máquina', 'Espalda'),
    sentadilla: mk('Sentadilla', 'Pierna'),
    prensa: mk('Prensa', 'Pierna'),
    pressMilitar: mk('Press militar', 'Hombro'),
    tricepPolea: mk('Extensión de tríceps en polea', 'Tríceps'),
    crunch: mk('Crunch abdominal', 'Abdomen'),
  }
  const pecho = { id: uid(), name: 'Pecho 1', exerciseIds: [lib.pressMaq.id, lib.pressInc.id, lib.aperturas.id, lib.bicepsBanco.id], createdAt: todayISO() }
  const espalda = { id: uid(), name: 'Espalda 1', exerciseIds: [lib.jalon.id, lib.remo.id, lib.curlManc.id], createdAt: todayISO() }
  const pierna = { id: uid(), name: 'Pierna 1', exerciseIds: [lib.sentadilla.id, lib.prensa.id, lib.pressMilitar.id], createdAt: todayISO() }
  return {
    exercises: Object.values(lib),
    sessions: [pecho, espalda, pierna],
    weeklyPlan: { 0: pecho.id, 1: espalda.id, 2: null, 3: pecho.id, 4: espalda.id, 5: pierna.id, 6: null },
    workouts: [],
    bodyweight: [],
    activeWorkoutId: null,
  }
}

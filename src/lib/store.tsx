import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  BodyweightLog,
  Exercise,
  MuscleGroup,
  Session,
  WeeklyPlan,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from './types'
import { todayISO, uid } from './format'
import { buildWorkoutFromSession, buildFreeWorkout, cloneSets, lastSetsForExercise } from './domain/snapshot'
import { saveState } from './backend'

export interface AppState {
  exercises: Exercise[]
  sessions: Session[]
  weeklyPlan: WeeklyPlan
  workouts: Workout[]
  bodyweight: BodyweightLog[]
  activeWorkoutId: string | null
}

const STORAGE_KEY = 'forja-state-v1'

function load(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppState) : null
  } catch {
    return null
  }
}

export interface StoreActions {
  // exercises
  addExercise: (name: string, muscleGroup: MuscleGroup) => Exercise
  updateExercise: (id: string, patch: Partial<Pick<Exercise, 'name' | 'muscleGroup'>>) => void
  deleteExercise: (id: string) => void
  // sessions
  addSession: (name: string) => Session
  renameSession: (id: string, name: string) => void
  deleteSession: (id: string) => void
  addExerciseToSession: (sessionId: string, exerciseId: string) => void
  removeExerciseFromSession: (sessionId: string, exerciseId: string) => void
  // weekly plan
  setDayPlan: (day: number, sessionId: string | null) => void
  // workouts
  startWorkout: (sessionId: string) => string
  startFreeWorkout: () => string
  finishWorkout: (id: string) => void
  deleteWorkout: (id: string) => void
  ensurePrefill: (workoutId: string, weId: string) => void
  addWorkoutExercise: (workoutId: string, ex: Pick<WorkoutExercise, 'exerciseId' | 'name' | 'muscleGroup'>) => void
  removeWorkoutExercise: (workoutId: string, weId: string) => void
  replaceWorkoutExercise: (workoutId: string, weId: string, ex: Pick<WorkoutExercise, 'exerciseId' | 'name' | 'muscleGroup'>) => void
  addSet: (workoutId: string, weId: string) => void
  updateSet: (workoutId: string, weId: string, setId: string, patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'rpe' | 'note'>>) => void
  deleteSet: (workoutId: string, weId: string, setId: string) => void
  // bodyweight
  addBodyweight: (date: string, weight: number) => void
  updateBodyweight: (id: string, patch: Partial<Pick<BodyweightLog, 'date' | 'weight'>>) => void
  deleteBodyweight: (id: string) => void
  // cuenta
  resetAll: () => void
}

interface StoreValue extends StoreActions {
  state: AppState
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children, initial, cloudUserId }: { children: ReactNode; initial: AppState; cloudUserId?: string }) {
  const [state, setState] = useState<AppState>(() => (cloudUserId ? initial : load() ?? initial))
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (cloudUserId) {
      const t = setTimeout(() => void saveState(cloudUserId, state), 500)
      return () => clearTimeout(t)
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state, cloudUserId])

  const mapWorkout = useCallback(
    (workoutId: string, fn: (w: Workout) => Workout) =>
      setState((s) => ({ ...s, workouts: s.workouts.map((w) => (w.id === workoutId ? fn(w) : w)) })),
    [],
  )
  const mapWorkoutExercise = useCallback(
    (workoutId: string, weId: string, fn: (we: WorkoutExercise) => WorkoutExercise) =>
      mapWorkout(workoutId, (w) => ({ ...w, exercises: w.exercises.map((e) => (e.id === weId ? fn(e) : e)) })),
    [mapWorkout],
  )

  const actions = useMemo<StoreActions>(
    () => ({
      addExercise(name, muscleGroup) {
        const ex: Exercise = { id: uid(), name: name.trim(), muscleGroup, createdAt: todayISO() }
        setState((s) => ({ ...s, exercises: [...s.exercises, ex] }))
        return ex
      },
      updateExercise(id, patch) {
        setState((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
      },
      deleteExercise(id) {
        setState((s) => {
          const usedInHistory = s.workouts.some((w) => w.exercises.some((e) => e.exerciseId === id))
          return {
            ...s,
            exercises: usedInHistory
              ? s.exercises.map((e) => (e.id === id ? { ...e, archived: true } : e))
              : s.exercises.filter((e) => e.id !== id),
            sessions: s.sessions.map((se) => ({ ...se, exerciseIds: se.exerciseIds.filter((x) => x !== id) })),
          }
        })
      },
      addSession(name) {
        const session: Session = { id: uid(), name: name.trim(), exerciseIds: [], createdAt: todayISO() }
        setState((s) => ({ ...s, sessions: [...s.sessions, session] }))
        return session
      },
      renameSession(id, name) {
        setState((s) => ({ ...s, sessions: s.sessions.map((se) => (se.id === id ? { ...se, name: name.trim() } : se)) }))
      },
      deleteSession(id) {
        setState((s) => ({
          ...s,
          sessions: s.sessions.filter((se) => se.id !== id),
          weeklyPlan: Object.fromEntries(
            Object.entries(s.weeklyPlan).map(([d, sid]) => [d, sid === id ? null : sid]),
          ) as WeeklyPlan,
        }))
      },
      addExerciseToSession(sessionId, exerciseId) {
        setState((s) => ({
          ...s,
          sessions: s.sessions.map((se) =>
            se.id === sessionId && !se.exerciseIds.includes(exerciseId)
              ? { ...se, exerciseIds: [...se.exerciseIds, exerciseId] }
              : se,
          ),
        }))
      },
      removeExerciseFromSession(sessionId, exerciseId) {
        setState((s) => ({
          ...s,
          sessions: s.sessions.map((se) =>
            se.id === sessionId ? { ...se, exerciseIds: se.exerciseIds.filter((x) => x !== exerciseId) } : se,
          ),
        }))
      },
      setDayPlan(day, sessionId) {
        setState((s) => ({ ...s, weeklyPlan: { ...s.weeklyPlan, [day]: sessionId } }))
      },
      startWorkout(sessionId) {
        const s = stateRef.current
        const session = s.sessions.find((x) => x.id === sessionId)
        if (!session) return ''
        const w = buildWorkoutFromSession({ session, exercises: s.exercises, date: todayISO(), id: uid })
        setState((prev) => ({ ...prev, workouts: [...prev.workouts, w], activeWorkoutId: w.id }))
        return w.id
      },
      startFreeWorkout() {
        const w = buildFreeWorkout({ date: todayISO(), id: uid })
        setState((prev) => ({ ...prev, workouts: [...prev.workouts, w], activeWorkoutId: w.id }))
        return w.id
      },
      finishWorkout(id) {
        setState((s) => ({
          ...s,
          activeWorkoutId: s.activeWorkoutId === id ? null : s.activeWorkoutId,
          workouts: s.workouts.map((w) => (w.id === id ? { ...w, finishedAt: new Date().toISOString() } : w)),
        }))
      },
      deleteWorkout(id) {
        setState((s) => ({
          ...s,
          workouts: s.workouts.filter((w) => w.id !== id),
          activeWorkoutId: s.activeWorkoutId === id ? null : s.activeWorkoutId,
        }))
      },
      ensurePrefill(workoutId, weId) {
        const w = stateRef.current.workouts.find((x) => x.id === workoutId)
        const we = w?.exercises.find((e) => e.id === weId)
        if (!we || we.sets.length > 0) return
        const last = lastSetsForExercise(we.exerciseId, stateRef.current.workouts, workoutId)
        if (last.length === 0) return
        mapWorkoutExercise(workoutId, weId, (e) => ({ ...e, sets: cloneSets(last, uid) }))
      },
      addWorkoutExercise(workoutId, ex) {
        const we: WorkoutExercise = { id: uid(), exerciseId: ex.exerciseId, name: ex.name, muscleGroup: ex.muscleGroup, sets: [] }
        mapWorkout(workoutId, (w) => ({ ...w, exercises: [...w.exercises, we] }))
      },
      removeWorkoutExercise(workoutId, weId) {
        mapWorkout(workoutId, (w) => ({ ...w, exercises: w.exercises.filter((e) => e.id !== weId) }))
      },
      replaceWorkoutExercise(workoutId, weId, ex) {
        mapWorkout(workoutId, (w) => ({
          ...w,
          exercises: w.exercises.map((e) =>
            e.id === weId ? { id: uid(), exerciseId: ex.exerciseId, name: ex.name, muscleGroup: ex.muscleGroup, sets: [] } : e,
          ),
        }))
      },
      addSet(workoutId, weId) {
        mapWorkoutExercise(workoutId, weId, (e) => {
          const last = e.sets[e.sets.length - 1]
          const next = last ? { weight: last.weight, reps: last.reps } : { weight: 20, reps: 10 }
          return { ...e, sets: [...e.sets, { id: uid(), ...next }] }
        })
      },
      updateSet(workoutId, weId, setId, patch) {
        mapWorkoutExercise(workoutId, weId, (e) => ({
          ...e,
          sets: e.sets.map((st) => (st.id === setId ? { ...st, ...patch } : st)),
        }))
      },
      deleteSet(workoutId, weId, setId) {
        mapWorkoutExercise(workoutId, weId, (e) => ({ ...e, sets: e.sets.filter((st) => st.id !== setId) }))
      },
      addBodyweight(date, weight) {
        setState((s) => ({ ...s, bodyweight: [...s.bodyweight, { id: uid(), date, weight }] }))
      },
      updateBodyweight(id, patch) {
        setState((s) => ({ ...s, bodyweight: s.bodyweight.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))
      },
      deleteBodyweight(id) {
        setState((s) => ({ ...s, bodyweight: s.bodyweight.filter((b) => b.id !== id) }))
      },
      resetAll() {
        setState({
          exercises: [],
          sessions: [],
          weeklyPlan: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
          workouts: [],
          bodyweight: [],
          activeWorkoutId: null,
        })
      },
    }),
    [mapWorkout, mapWorkoutExercise],
  )

  const value = useMemo<StoreValue>(() => ({ state, ...actions }), [state, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

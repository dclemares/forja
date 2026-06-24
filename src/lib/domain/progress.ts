import type { BodyweightLog, DiaryEntry, Workout } from '@/lib/types'
import { shiftISO } from '@/lib/format'
import { workoutVolume } from './volume'
import { dailyTotals } from './nutrition'

/** Métricas que se pueden seguir en el tiempo. */
export type MetricKey = 'volumen' | 'peso' | 'kcal' | 'protein' | 'carbs' | 'fat'
/** Periodos del filtro temporal. `days: null` = desde la primera entrada. */
export type PeriodKey = 'semana' | '1m' | '2m' | '3m' | '6m' | '1a' | 'todo'

export interface MetricDef {
  key: MetricKey
  label: string
  unit: string
  /** Cómo se resume el periodo: 'sum' (acumulado, p. ej. volumen) o 'avg' (media diaria). */
  agg: 'sum' | 'avg'
  source: 'workout' | 'bodyweight' | 'diary'
  /** Si la escala del eje Y arranca en 0 (true) o se ajusta a los datos (false, p. ej. peso). */
  zeroBased: boolean
}

export const METRICS: MetricDef[] = [
  { key: 'volumen', label: 'Volumen', unit: 'kg', agg: 'sum', source: 'workout', zeroBased: true },
  { key: 'peso', label: 'Peso', unit: 'kg', agg: 'avg', source: 'bodyweight', zeroBased: false },
  { key: 'kcal', label: 'Calorías', unit: 'kcal', agg: 'avg', source: 'diary', zeroBased: true },
  { key: 'protein', label: 'Proteína', unit: 'g', agg: 'avg', source: 'diary', zeroBased: true },
  { key: 'carbs', label: 'Carbos', unit: 'g', agg: 'avg', source: 'diary', zeroBased: true },
  { key: 'fat', label: 'Grasa', unit: 'g', agg: 'avg', source: 'diary', zeroBased: true },
]

export const metricDef = (key: MetricKey): MetricDef => METRICS.find((m) => m.key === key)!

export const PERIODS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: 'semana', label: 'Semana', days: 7 },
  { key: '1m', label: '1 mes', days: 30 },
  { key: '2m', label: '2 meses', days: 60 },
  { key: '3m', label: '3 meses', days: 90 },
  { key: '6m', label: '6 meses', days: 180 },
  { key: '1a', label: '1 año', days: 365 },
  { key: 'todo', label: 'Todo', days: null },
]

export const periodDays = (key: PeriodKey): number | null => PERIODS.find((p) => p.key === key)!.days

export interface DayPoint {
  date: string // ISO yyyy-mm-dd
  value: number
}

export interface NutritionData {
  workouts: Workout[]
  bodyweight: BodyweightLog[]
  diary: DiaryEntry[]
}

const round1 = (n: number): number => Math.round(n * 10) / 10

const diaryValue = (m: MetricKey, e: { kcal: number; protein: number; carbs: number; fat: number }): number =>
  m === 'kcal' ? e.kcal : m === 'protein' ? e.protein : m === 'carbs' ? e.carbs : e.fat

/** Serie diaria (un punto por día con datos), ordenada cronológicamente.
 *  - volumen: suma del volumen de los entrenos finalizados de ese día.
 *  - peso: media de los registros de ese día.
 *  - kcal/macros: total del diario de ese día. */
export function dailyPoints(metric: MetricKey, data: NutritionData): DayPoint[] {
  const def = metricDef(metric)
  const out: DayPoint[] = []

  if (def.source === 'workout') {
    const map = new Map<string, number>()
    for (const w of data.workouts) {
      if (!w.finishedAt) continue
      map.set(w.date, (map.get(w.date) ?? 0) + workoutVolume(w))
    }
    for (const [date, v] of map) out.push({ date, value: Math.round(v) })
  } else if (def.source === 'bodyweight') {
    const map = new Map<string, { sum: number; n: number }>()
    for (const b of data.bodyweight) {
      const cur = map.get(b.date) ?? { sum: 0, n: 0 }
      cur.sum += b.weight
      cur.n += 1
      map.set(b.date, cur)
    }
    for (const [date, { sum, n }] of map) out.push({ date, value: round1(sum / n) })
  } else {
    const dates = new Set(data.diary.map((e) => e.date))
    for (const date of dates) {
      out.push({ date, value: round1(diaryValue(metric, dailyTotals(data.diary, date))) })
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}

/** Filtra los puntos al periodo (ventana de `days` días hasta hoy; `todo` = todos). */
export function filterPeriod(points: DayPoint[], period: PeriodKey, todayIso: string): DayPoint[] {
  const days = periodDays(period)
  if (days == null) return points.filter((p) => p.date <= todayIso)
  const cutoff = shiftISO(todayIso, -(days - 1))
  return points.filter((p) => p.date >= cutoff && p.date <= todayIso)
}

export interface Summary {
  count: number
  total: number
  avg: number
  min: number | null
  max: number | null
  first: number | null
  last: number | null
}

/** Estadísticos del conjunto de puntos (ya filtrado). */
export function summary(points: DayPoint[]): Summary {
  const n = points.length
  if (n === 0) return { count: 0, total: 0, avg: 0, min: null, max: null, first: null, last: null }
  const values = points.map((p) => p.value)
  const total = values.reduce((a, v) => a + v, 0)
  return {
    count: n,
    total,
    avg: total / n,
    min: Math.min(...values),
    max: Math.max(...values),
    first: values[0],
    last: values[n - 1],
  }
}

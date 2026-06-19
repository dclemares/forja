import type { BodyweightLog, Workout } from '@/lib/types'
import { workoutVolume } from './volume'

/** Número de semana ISO + año. */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    )
  return { year: d.getUTCFullYear(), week }
}

export function isoWeekKey(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  const { year, week } = isoWeek(new Date(y, (m ?? 1) - 1, day ?? 1))
  return `${year}-W${String(week).padStart(2, '0')}`
}

export interface WeekPoint {
  key: string
  label: string
  volume: number
}

/** Volumen total por semana, ordenado cronológicamente. */
export function weeklyVolume(workouts: Workout[]): WeekPoint[] {
  const map = new Map<string, number>()
  for (const w of workouts) {
    const key = isoWeekKey(w.date)
    map.set(key, (map.get(key) ?? 0) + workoutVolume(w))
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, volume]) => ({ key, volume, label: 'S' + key.split('W')[1] }))
}

/** Media móvil de ventana `window`. */
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

export interface BodyPoint {
  date: string
  weight: number
  avg: number
}

/** Serie de peso corporal ordenada + media móvil de 7 registros (tendencia). */
export function bodyweightTrend(logs: BodyweightLog[]): BodyPoint[] {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const avgs = movingAverage(sorted.map((l) => l.weight), 7)
  return sorted.map((l, i) => ({ date: l.date, weight: l.weight, avg: avgs[i] }))
}

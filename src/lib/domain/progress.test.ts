import { describe, expect, it } from 'vitest'
import { bucketPoints, dailyPoints, filterPeriod, granularityForSpan, summary, type DayPoint, type NutritionData } from './progress'
import type { BodyweightLog, DiaryEntry, Macros, Workout } from '@/lib/types'

const macros = (kcal: number, protein = 0, carbs = 0, fat = 0): Macros => ({ kcal, protein, carbs, fat })

const diaryEntry = (date: string, m: Macros): DiaryEntry => ({
  id: date + Math.random(),
  date,
  slot: 'comida',
  label: 'x',
  macros: m,
  source: 'quick',
  createdAt: date,
})

const workout = (date: string, weight: number, reps: number, finished = true): Workout => ({
  id: date,
  date,
  sessionId: null,
  name: 'W',
  exercises: [{ id: 'e', exerciseId: null, name: 'x', muscleGroup: 'Pecho', sets: [{ id: 's', weight, reps }] }],
  createdAt: date,
  finishedAt: finished ? date + 'T10:00:00Z' : null,
})

const bw = (date: string, weight: number): BodyweightLog => ({ id: date, date, weight })

const data = (over: Partial<NutritionData>): NutritionData => ({ workouts: [], bodyweight: [], diary: [], ...over })

describe('dailyPoints', () => {
  it('suma el volumen de los entrenos por día (solo finalizados)', () => {
    const d = data({ workouts: [workout('2026-01-01', 100, 5), workout('2026-01-01', 50, 2), workout('2026-01-02', 10, 1, false)] })
    expect(dailyPoints('volumen', d)).toEqual([{ date: '2026-01-01', value: 600 }])
  })

  it('promedia el peso por día y ordena cronológicamente', () => {
    const d = data({ bodyweight: [bw('2026-01-02', 80), bw('2026-01-01', 70), bw('2026-01-01', 72)] })
    expect(dailyPoints('peso', d)).toEqual([
      { date: '2026-01-01', value: 71 },
      { date: '2026-01-02', value: 80 },
    ])
  })

  it('totaliza kcal y macros del diario por día', () => {
    const d = data({ diary: [diaryEntry('2026-01-01', macros(500, 30, 50, 10)), diaryEntry('2026-01-01', macros(300, 20, 10, 5))] })
    expect(dailyPoints('kcal', d)).toEqual([{ date: '2026-01-01', value: 800 }])
    expect(dailyPoints('protein', d)).toEqual([{ date: '2026-01-01', value: 50 }])
    expect(dailyPoints('fat', d)).toEqual([{ date: '2026-01-01', value: 15 }])
  })
})

describe('filterPeriod', () => {
  const points = [
    { date: '2026-01-01', value: 1 },
    { date: '2026-01-05', value: 2 },
    { date: '2026-01-10', value: 3 },
  ]

  it('semana = últimos 7 días hasta hoy', () => {
    expect(filterPeriod(points, 'semana', '2026-01-10')).toEqual([
      { date: '2026-01-05', value: 2 },
      { date: '2026-01-10', value: 3 },
    ])
  })

  it('todo devuelve todos los puntos', () => {
    expect(filterPeriod(points, 'todo', '2026-01-10')).toHaveLength(3)
  })

  it('excluye fechas futuras', () => {
    expect(filterPeriod(points, 'todo', '2026-01-06').map((p) => p.date)).toEqual(['2026-01-01', '2026-01-05'])
  })
})

describe('summary', () => {
  it('calcula total, media, min/max y primero/último', () => {
    const s = summary([
      { date: '2026-01-01', value: 10 },
      { date: '2026-01-02', value: 20 },
      { date: '2026-01-03', value: 30 },
    ])
    expect(s).toEqual({ count: 3, total: 60, avg: 20, min: 10, max: 30, first: 10, last: 30 })
  })

  it('vacío devuelve ceros y nulos', () => {
    expect(summary([])).toEqual({ count: 0, total: 0, avg: 0, min: null, max: null, first: null, last: null })
  })
})

describe('granularityForSpan', () => {
  const p = (date: string): DayPoint => ({ date, value: 1 })
  it('≤16 días → diario, ≤100 → semanal, si no mensual', () => {
    expect(granularityForSpan([p('2026-01-01'), p('2026-01-10')])).toBe('day')
    expect(granularityForSpan([p('2026-01-01'), p('2026-02-20')])).toBe('week')
    expect(granularityForSpan([p('2026-01-01'), p('2026-09-01')])).toBe('month')
    expect(granularityForSpan([p('2026-01-01')])).toBe('day')
  })
})

describe('bucketPoints', () => {
  it('diario: un punto por día con etiqueta de fecha', () => {
    const out = bucketPoints([{ date: '2026-01-01', value: 10 }, { date: '2026-01-02', value: 20 }], 'day', 'avg')
    expect(out.map((b) => b.value)).toEqual([10, 20])
    expect(out).toHaveLength(2)
  })

  it('semanal: suma agrupa por semana (lunes)', () => {
    // 2026-01-05 (lun) … 2026-01-08 misma semana; 2026-01-12 (lun) otra
    const pts = [
      { date: '2026-01-05', value: 100 },
      { date: '2026-01-08', value: 50 },
      { date: '2026-01-12', value: 30 },
    ]
    const out = bucketPoints(pts, 'week', 'sum')
    expect(out.map((b) => b.value)).toEqual([150, 30])
  })

  it('mensual: promedia agrupando por mes', () => {
    const pts = [
      { date: '2026-01-10', value: 200 },
      { date: '2026-01-20', value: 100 },
      { date: '2026-02-05', value: 90 },
    ]
    const out = bucketPoints(pts, 'month', 'avg')
    expect(out.map((b) => b.value)).toEqual([150, 90])
  })
})

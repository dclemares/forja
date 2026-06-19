import { describe, it, expect } from 'vitest'
import { isoWeekKey, movingAverage, weeklyVolume, bodyweightTrend } from './trends'
import type { Workout } from '@/lib/types'

const w = (date: string, vol: number): Workout => ({
  id: date,
  date,
  sessionId: null,
  name: 'n',
  createdAt: date,
  exercises: [{ id: 'a', exerciseId: 'e', name: 'n', muscleGroup: 'Pecho', sets: [{ id: '1', weight: vol, reps: 1 }] }],
})

describe('trends', () => {
  it('isoWeekKey agrupa por semana ISO', () => {
    expect(isoWeekKey('2026-06-19')).toBe(isoWeekKey('2026-06-15'))
    expect(isoWeekKey('2026-06-19')).not.toBe(isoWeekKey('2026-06-08'))
  })

  it('movingAverage ventana 2', () => {
    expect(movingAverage([2, 4, 6], 2)).toEqual([2, 3, 5])
  })

  it('weeklyVolume agrega y ordena', () => {
    const points = weeklyVolume([w('2026-06-16', 100), w('2026-06-18', 50), w('2026-06-08', 200)])
    expect(points).toHaveLength(2)
    expect(points[0].volume).toBe(200)
    expect(points[1].volume).toBe(150)
  })

  it('bodyweightTrend ordena y calcula media', () => {
    const pts = bodyweightTrend([
      { id: '2', date: '2026-06-02', weight: 80 },
      { id: '1', date: '2026-06-01', weight: 78 },
    ])
    expect(pts.map((p) => p.weight)).toEqual([78, 80])
    expect(pts[1].avg).toBe(79)
  })
})

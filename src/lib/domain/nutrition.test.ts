import { describe, it, expect } from 'vitest'
import { dailyTotals, foodEntryMacros, macroSplit, mealMacros, remaining, scaleMacros, sumMacros } from './nutrition'
import type { DiaryEntry, Food, Macros, Meal, NutritionGoal } from '@/lib/types'

const m = (kcal: number, protein: number, carbs: number, fat: number): Macros => ({ kcal, protein, carbs, fat })
const food = (id: string, per100: Macros): Food => ({ id, name: id, per100, createdAt: '2026-06-01' })
const entry = (date: string, macros: Macros): DiaryEntry => ({ id: date + Math.random(), date, slot: 'comida', label: 'x', macros, source: 'quick', createdAt: date })

describe('nutrition', () => {
  it('scaleMacros escala por 100 g', () => {
    expect(scaleMacros(m(200, 20, 10, 5), 50)).toEqual(m(100, 10, 5, 2.5))
    expect(foodEntryMacros(food('a', m(100, 10, 0, 0)), 250)).toEqual(m(250, 25, 0, 0))
  })

  it('sumMacros suma una lista', () => {
    expect(sumMacros([m(100, 10, 5, 2), m(50, 5, 0, 1)])).toEqual(m(150, 15, 5, 3))
    expect(sumMacros([])).toEqual(m(0, 0, 0, 0))
  })

  it('mealMacros suma los ingredientes por gramos', () => {
    const foods = new Map([
      ['oats', food('oats', m(380, 13, 60, 7))],
      ['milk', food('milk', m(50, 3.4, 5, 1.7))],
    ])
    const meal: Pick<Meal, 'components'> = { components: [{ foodId: 'oats', grams: 50 }, { foodId: 'milk', grams: 200 }] }
    const total = mealMacros(meal, foods)
    // oats 50g: 190/6.5/30/3.5 ; milk 200g: 100/6.8/10/3.4
    expect(total.kcal).toBeCloseTo(290)
    expect(total.protein).toBeCloseTo(13.3)
  })

  it('mealMacros ignora ingredientes cuyo alimento no existe', () => {
    const meal: Pick<Meal, 'components'> = { components: [{ foodId: 'ghost', grams: 100 }] }
    expect(mealMacros(meal, new Map())).toEqual(m(0, 0, 0, 0))
  })

  it('dailyTotals filtra por fecha', () => {
    const diary = [entry('2026-06-20', m(500, 30, 50, 15)), entry('2026-06-20', m(300, 20, 20, 10)), entry('2026-06-19', m(999, 0, 0, 0))]
    expect(dailyTotals(diary, '2026-06-20')).toEqual(m(800, 50, 70, 25))
    expect(dailyTotals(diary, '2026-06-21')).toEqual(m(0, 0, 0, 0))
  })

  it('remaining puede ser negativo si te pasas', () => {
    const goal: NutritionGoal = { kcal: 2000, protein: 150, carbs: 200, fat: 70 }
    expect(remaining(goal, m(2200, 160, 180, 70))).toEqual(m(-200, -10, 20, 0))
  })

  it('macroSplit reparte kcal (4/4/9) y suma 1', () => {
    const s = macroSplit(m(0, 25, 25, 0)) // 100 kcal prot, 100 kcal carb, 0 fat
    expect(s.protein).toBeCloseTo(0.5)
    expect(s.carbs).toBeCloseTo(0.5)
    expect(s.fat).toBe(0)
    expect(macroSplit(m(0, 0, 0, 0))).toEqual({ protein: 0, carbs: 0, fat: 0 })
  })
})

import type { DiaryEntry, Food, Macros, Meal, NutritionGoal } from '@/lib/types'

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

/** Escala macros por 100 g a la cantidad real en gramos. */
export const scaleMacros = (per100: Macros, grams: number): Macros => {
  const f = grams / 100
  return { kcal: per100.kcal * f, protein: per100.protein * f, carbs: per100.carbs * f, fat: per100.fat * f }
}

/** Macros absolutos de una ración de un alimento. */
export const foodEntryMacros = (food: Pick<Food, 'per100'>, grams: number): Macros => scaleMacros(food.per100, grams)

/** Suma una lista de macros. */
export const sumMacros = (list: Macros[]): Macros =>
  list.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { ...ZERO_MACROS },
  )

/** Macros totales de una comida (receta), sumando sus ingredientes. */
export const mealMacros = (meal: Pick<Meal, 'components'>, foodsById: Map<string, Pick<Food, 'per100'>>): Macros =>
  sumMacros(
    meal.components.map((c) => {
      const food = foodsById.get(c.foodId)
      return food ? foodEntryMacros(food, c.grams) : ZERO_MACROS
    }),
  )

/** Gramos totales de una comida. */
export const mealGrams = (meal: Pick<Meal, 'components'>): number => meal.components.reduce((a, c) => a + c.grams, 0)

/** Totales del diario para una fecha concreta. */
export const dailyTotals = (diary: DiaryEntry[], date: string): Macros =>
  sumMacros(diary.filter((e) => e.date === date).map((e) => e.macros))

/** Macros restantes respecto al objetivo (puede ser negativo si te pasas). */
export const remaining = (goal: NutritionGoal, totals: Macros): Macros => ({
  kcal: goal.kcal - totals.kcal,
  protein: goal.protein - totals.protein,
  carbs: goal.carbs - totals.carbs,
  fat: goal.fat - totals.fat,
})

/** Reparto de kcal por macro (proteína y carbos 4 kcal/g, grasa 9 kcal/g) para el anillo.
 *  Devuelve fracciones que suman 1 (o todo 0 si no hay datos). */
export const macroSplit = (m: Macros): { protein: number; carbs: number; fat: number } => {
  const p = m.protein * 4
  const c = m.carbs * 4
  const f = m.fat * 9
  const total = p + c + f
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return { protein: p / total, carbs: c / total, fat: f / total }
}

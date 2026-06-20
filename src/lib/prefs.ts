/** Preferencias locales del usuario (paso de peso, descanso). Persisten en localStorage. */

const read = (k: string, def: string): string => {
  try {
    return localStorage.getItem(k) ?? def
  } catch {
    return def
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore quota errors */
  }
}

// ---- Paso de incremento de peso ----
const WSTEP_KEY = 'forja-wstep'
export const WEIGHT_STEPS = [1, 1.25, 2.5, 5] as const

let weightStep = ((): number => {
  const n = parseFloat(read(WSTEP_KEY, '2.5'))
  return (WEIGHT_STEPS as readonly number[]).includes(n) ? n : 2.5
})()

export const getWeightStep = (): number => weightStep
export const setWeightStep = (n: number) => {
  weightStep = n
  write(WSTEP_KEY, String(n))
}

// ---- Descanso entre series (segundos; 0 = desactivado) ----
const REST_KEY = 'forja-rest'
export const REST_PRESETS = [0, 60, 90, 120] as const

let restDuration = ((): number => {
  const n = parseInt(read(REST_KEY, '0'), 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
})()

export const getRestDuration = (): number => restDuration
export const setRestDuration = (n: number) => {
  restDuration = n
  write(REST_KEY, String(n))
}

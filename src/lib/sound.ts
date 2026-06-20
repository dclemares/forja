/** Sonidos de UI sintetizados con Web Audio (sin archivos). Sutiles, estilo juego. */

let ctx: AudioContext | null = null
function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

const KEY = 'forja-sound'
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
})()

export const isSoundEnabled = () => enabled
export function setSoundEnabled(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const c = getCtx()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  o.connect(g)
  g.connect(c.destination)
  const t = c.currentTime + start
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t)
  o.stop(t + dur + 0.03)
}

/** Click suave de botón. */
export function playClick() {
  if (!enabled) return
  tone(540, 0, 0.06, 'triangle', 0.06)
}

/** Pop al añadir algo. */
export function playPop() {
  if (!enabled) return
  const c = getCtx()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.connect(g)
  g.connect(c.destination)
  const t = c.currentTime
  o.frequency.setValueAtTime(360, t)
  o.frequency.exponentialRampToValueAtTime(720, t + 0.08)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.09, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
  o.start(t)
  o.stop(t + 0.15)
}

/** Fanfarria corta al completar un entreno. */
export function playSuccess() {
  if (!enabled) return
  ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.22, 'triangle', 0.09))
}

/** Campana suave: fin del descanso. */
export function playRestDone() {
  if (!enabled) return
  ;[784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.32, 'sine', 0.1))
}

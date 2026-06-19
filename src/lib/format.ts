const nf = new Intl.NumberFormat('es-ES')

/** Volumen / cifras grandes con separador de miles español. */
export const formatNumber = (n: number): string => nf.format(Math.round(n))

/** Peso editable: entero sin decimales, si no 1 decimal. */
export const formatWeight = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(1)

const dmf = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
const wdmf = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const longf = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export const formatDayMonth = (iso: string): string => dmf.format(parse(iso))
export const formatShortDate = (iso: string): string => wdmf.format(parse(iso))
export const formatLongDate = (iso: string): string => longf.format(parse(iso))

/** Fecha de hoy en ISO local yyyy-mm-dd. */
export const todayISO = (): string => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

import { formatDayMonth } from '@/lib/format'

const ACCENT = '#C8861F'
const TREND = '#6E4423'
const LABEL = 'rgba(60,38,16,.6)'
const AXIS = 'rgba(60,38,16,.78)'
const VALUE = '#5A3A18'
const GRID = 'rgba(120,80,30,.15)'
const AREA = 'rgba(200,134,31,.14)'

export interface TrendPoint {
  date: string
  value: number
}

const shortNum = (n: number): string =>
  Math.abs(n) >= 1000 ? (Math.round(n / 100) / 10).toString().replace('.', ',') + 'k' : String(Math.round(n))

/** Paso "redondo" para una escala legible (1/2/5 · 10^n). */
function niceStep(range: number, ticks: number): number {
  const raw = range / Math.max(1, ticks)
  if (raw <= 0) return 1
  const exp = Math.floor(Math.log10(raw))
  const base = Math.pow(10, exp)
  const f = raw / base
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nice * base
}

/** Gráfica de evolución con ejes etiquetados (X = fecha, Y = unidad) y escala. */
export function TrendChart({
  points,
  unit,
  zeroBased = true,
  height = 188,
}: {
  points: TrendPoint[]
  unit: string
  zeroBased?: boolean
  height?: number
}) {
  const W = 320
  const padL = 44
  const padR = 12
  const padT = 14
  const padB = 38

  if (points.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
        Sin datos en este periodo
      </div>
    )
  }

  const values = points.map((p) => p.value)
  const dataMax = Math.max(...values)
  const dataMin = zeroBased ? 0 : Math.min(...values)
  const rawRange = dataMax - dataMin || Math.abs(dataMax) || 1
  const step = niceStep(rawRange, 4)
  const niceMin = zeroBased ? 0 : Math.floor(dataMin / step) * step
  const niceMax = Math.ceil((dataMax + (zeroBased ? 0 : step * 0.0001)) / step) * step || step
  const span = niceMax - niceMin || 1

  const innerW = W - padL - padR
  const innerH = height - padT - padB
  const x = (i: number) => (points.length === 1 ? padL + innerW / 2 : padL + (i / (points.length - 1)) * innerW)
  const y = (v: number) => padT + (1 - (v - niceMin) / span) * innerH

  // Ticks del eje Y (líneas de la escala).
  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + 1e-6; v += step) ticks.push(v)

  // Etiquetas del eje X: hasta 5, repartidas.
  const n = points.length
  const xCount = Math.min(5, n)
  const xIdx = n === 1 ? [0] : Array.from({ length: xCount }, (_, k) => Math.round((k / (xCount - 1)) * (n - 1)))
  const xLabels = [...new Set(xIdx)]

  const linePts = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const areaPts = `${x(0).toFixed(1)},${y(niceMin).toFixed(1)} ${linePts} ${x(n - 1).toFixed(1)},${y(niceMin).toFixed(1)}`
  const showDots = n <= 16
  const showVals = n <= 8
  const baseY = y(niceMin)
  const clampY = (v: number) => Math.max(padT, Math.min(baseY, y(v)))
  // Recta de tendencia (regresión lineal por mínimos cuadrados sobre el índice).
  const trend = (() => {
    if (n < 2) return null
    let sx = 0, sy = 0, sxy = 0, sxx = 0
    for (let i = 0; i < n; i++) { sx += i; sy += values[i]; sxy += i * values[i]; sxx += i * i }
    const denom = n * sxx - sx * sx
    const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom
    const intercept = (sy - slope * sx) / n
    return { y0: intercept, y1: intercept + slope * (n - 1) }
  })()

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="Gráfica de evolución">
      {/* Escala / rejilla del eje Y */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize={9.5} fill={LABEL}>{shortNum(t)}</text>
        </g>
      ))}

      {/* Título del eje Y (qué mide) */}
      <text transform={`translate(11 ${padT + innerH / 2}) rotate(-90)`} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={AXIS}>{unit}</text>

      {/* Área + línea */}
      {n > 1 && <polygon points={areaPts} fill={AREA} stroke="none" />}
      {n === 1 && <line x1={padL} y1={y(values[0])} x2={W - padR} y2={y(values[0])} stroke="rgba(200,134,31,.35)" strokeWidth={1.5} strokeDasharray="4 4" />}
      {n > 1 && <polyline className="chart-line" points={linePts} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

      {/* Puntos + valores */}
      {points.map((p, i) => (
        <g key={i}>
          {(showDots || i === n - 1) && <circle cx={x(i)} cy={y(p.value)} r={i === n - 1 ? 4 : 3} fill={ACCENT} />}
          {showVals && <text x={x(i)} y={y(p.value) - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill={VALUE}>{shortNum(p.value)}</text>}
        </g>
      ))}

      {/* Recta de tendencia */}
      {trend && (
        <>
          <line x1={x(0)} y1={clampY(trend.y0)} x2={x(n - 1)} y2={clampY(trend.y1)} stroke={TREND} strokeWidth={2} strokeDasharray="6 4" opacity={0.85} />
          <text x={W - padR} y={Math.min(baseY - 3, Math.max(padT + 9, clampY(trend.y1) - 5))} textAnchor="end" fontSize={9.5} fontWeight={700} fill={TREND}>tendencia</text>
        </>
      )}

      {/* Eje X: línea base + fechas */}
      <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} stroke="rgba(120,80,30,.35)" strokeWidth={1} />
      {xLabels.map((i) => (
        <text key={i} x={x(i)} y={height - 18} textAnchor="middle" fontSize={9.5} fill={LABEL}>{formatDayMonth(points[i].date)}</text>
      ))}

      {/* Título del eje X */}
      <text x={padL + innerW / 2} y={height - 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={AXIS}>Fecha</text>
    </svg>
  )
}

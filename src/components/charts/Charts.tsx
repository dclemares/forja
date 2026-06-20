import { formatNumber } from '@/lib/format'

export interface Point {
  label: string
  value: number
}

const ACCENT = '#C8861F'
const LABEL = 'rgba(60,38,16,.6)'
const VALUE = '#5A3A18'

/** Abrevia cifras grandes: 1590 -> "1,6k". */
const shortNum = (n: number): string =>
  n >= 1000 ? (Math.round(n / 100) / 10).toString().replace('.', ',') + 'k' : String(Math.round(n))

/** Línea (volumen total por sesión, etc.) con el valor sobre cada punto. */
export function LineChart({ data, height = 138 }: { data: Point[]; height?: number }) {
  const W = 300
  const padX = 22
  const padTop = 22
  const padBottom = 24
  if (data.length === 0) return <EmptyChart height={height} />

  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const innerW = W - padX * 2
  const innerH = height - padTop - padBottom

  const x = (i: number) => (data.length === 1 ? W / 2 : padX + (i / (data.length - 1)) * innerW)
  const y = (v: number) => padTop + (1 - (v - min) / span) * innerH

  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const showValues = data.length <= 8

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="Gráfica de evolución">
      {data.length > 1 && (
        <polyline className="chart-line" points={pts} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {data.map((d, i) => (
        <g key={i}>
          <circle className="chart-dot" cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4.5 : 3.5} fill={ACCENT} />
          {showValues && (
            <text x={x(i)} y={y(d.value) - 9} textAnchor="middle" fontSize={11} fontWeight={700} fill={VALUE}>
              {shortNum(d.value)}
            </text>
          )}
          <text x={x(i)} y={height - 7} textAnchor="middle" fontSize={10} fill={LABEL}>
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** Barras verticales (volumen semanal) con valor encima. La última destacada. */
export function VBars({ data, height = 132 }: { data: Point[]; height?: number }) {
  if (data.length === 0) return <EmptyChart height={height} />
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height }}>
      {data.map((d, i) => {
        const last = i === data.length - 1
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: VALUE }}>{shortNum(d.value)}</span>
            <div
              className="chart-bar"
              style={{
                width: '100%',
                height: `${Math.max(4, (d.value / max) * (height - 42))}px`,
                borderRadius: '6px 6px 0 0',
                background: last ? ACCENT : 'rgba(200,134,31,.32)',
                animationDelay: `${i * 60}ms`,
              }}
            />
            <span style={{ fontSize: 10, color: LABEL }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Barras horizontales (volumen por grupo muscular). */
export function HBars({ data }: { data: Point[] }) {
  if (data.length === 0) return <EmptyChart height={60} />
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {data.map((d) => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
            <span>{d.label}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatNumber(d.value)}</span>
          </div>
          <div style={{ height: 9, background: 'rgba(120,80,30,.16)', borderRadius: 6, overflow: 'hidden' }}>
            <div className="chart-bar" style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: ACCENT, borderRadius: 6, transformOrigin: 'left' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Línea de peso corporal con media (tendencia) y el último valor marcado. */
export function BodyChart({ data, height = 130 }: { data: { date: string; weight: number; avg: number }[]; height?: number }) {
  const W = 300
  const padX = 16
  const padY = 18
  if (data.length === 0) return <EmptyChart height={height} />
  const all = [...data.map((d) => d.weight), ...data.map((d) => d.avg)]
  const max = Math.max(...all)
  const min = Math.min(...all)
  const span = max - min || 1
  const innerW = W - padX * 2
  const innerH = height - padY * 2
  const x = (i: number) => (data.length === 1 ? W / 2 : padX + (i / (data.length - 1)) * innerW)
  const y = (v: number) => padY + (1 - (v - min) / span) * innerH
  const line = (key: 'weight' | 'avg') => data.map((d, i) => `${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ')
  const lastIdx = data.length - 1
  const lastWeight = data[lastIdx].weight

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="Peso corporal">
      <polyline points={line('weight')} fill="none" stroke="rgba(200,134,31,.4)" strokeWidth={2} strokeLinejoin="round" />
      {data.length > 1 && (
        <polyline className="chart-line" points={line('avg')} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      <circle cx={x(lastIdx)} cy={y(lastWeight)} r={4} fill={ACCENT} />
      <text x={Math.min(x(lastIdx), W - 28)} y={Math.max(y(lastWeight) - 9, 12)} textAnchor="middle" fontSize={11} fontWeight={700} fill={VALUE}>
        {lastWeight.toFixed(1).replace('.', ',')}
      </text>
    </svg>
  )
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
      Sin datos todavía
    </div>
  )
}

import { formatNumber } from '@/lib/format'

export interface Point {
  label: string
  value: number
}

const ACCENT = '#4661F2'

/** Línea (volumen total por sesión, etc.). Animada al montar. */
export function LineChart({ data, height = 130 }: { data: Point[]; height?: number }) {
  const W = 300
  const padX = 18
  const padTop = 16
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

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="Gráfica de evolución">
      {data.length > 1 && (
        <polyline className="chart-line" points={pts} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {data.map((d, i) => (
        <g key={i}>
          <circle className="chart-dot" cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4.5 : 3.5} fill={ACCENT} />
          <text x={x(i)} y={height - 7} textAnchor="middle" fontSize={10} fill="rgba(20,22,26,.45)">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** Barras verticales (volumen semanal). La última destacada. */
export function VBars({ data, height = 120 }: { data: Point[]; height?: number }) {
  if (data.length === 0) return <EmptyChart height={height} />
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height }}>
      {data.map((d, i) => {
        const last = i === data.length - 1
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
            <div
              className="chart-bar"
              title={formatNumber(d.value)}
              style={{
                width: '100%',
                height: `${Math.max(4, (d.value / max) * (height - 22))}px`,
                borderRadius: '6px 6px 0 0',
                background: last ? ACCENT : 'rgba(70,97,242,.28)',
                animationDelay: `${i * 60}ms`,
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{d.label}</span>
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
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatNumber(d.value)}</span>
          </div>
          <div style={{ height: 9, background: 'rgba(20,22,26,.07)', borderRadius: 6, overflow: 'hidden' }}>
            <div className="chart-bar" style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: ACCENT, borderRadius: 6, transformOrigin: 'left' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Línea de peso corporal con media (tendencia). */
export function BodyChart({ data, height = 130 }: { data: { date: string; weight: number; avg: number }[]; height?: number }) {
  const W = 300
  const padX = 14
  const padY = 14
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

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="Peso corporal">
      <polyline points={line('weight')} fill="none" stroke="rgba(70,97,242,.35)" strokeWidth={2} strokeLinejoin="round" />
      {data.length > 1 && (
        <polyline className="chart-line" points={line('avg')} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
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

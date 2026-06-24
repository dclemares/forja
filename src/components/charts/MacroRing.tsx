import { formatNumber } from '@/lib/format'

/** Anillo de progreso de calorías (consumido vs objetivo), estilo cartoon. */
export function MacroRing({ value, goal, size = 150 }: { value: number; goal: number; size?: number }) {
  const stroke = 14
  const r = (size - stroke) / 2
  const cx = size / 2
  const c = 2 * Math.PI * r
  const frac = goal > 0 ? Math.min(value / goal, 1) : 0
  const over = value > goal && goal > 0
  const arc = over ? '#C5403F' : '#E8A21E'
  const left = Math.max(0, Math.round(goal - value))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Calorías del día">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(120,80,30,.18)" strokeWidth={stroke} />
      {frac > 0 && (
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${frac * c} ${c}`}
          transform={`rotate(-90 ${cx} ${cx})`}
          className="chart-line"
          style={{ strokeDasharray: `${frac * c} ${c}`, strokeDashoffset: 0, animation: 'none' }}
        />
      )}
      <text x={cx} y={cx - 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="#3A2410">{formatNumber(value)}</text>
      <text x={cx} y={cx + 14} textAnchor="middle" fontSize={12} fill="rgba(48,28,10,.7)">de {formatNumber(goal)} kcal</text>
      <text x={cx} y={cx + 32} textAnchor="middle" fontSize={12} fontWeight={700} fill={over ? '#C5403F' : '#3E8E2E'}>
        {over ? `+${formatNumber(value - goal)}` : `${formatNumber(left)} restantes`}
      </text>
    </svg>
  )
}

const MACRO_COLORS = { protein: '#3E63DD', carbs: '#C2620B', fat: '#8E4EC6' } as const

/** Barra de un macro: consumido vs objetivo. */
export function MacroBar({ label, value, goal, kind }: { label: string; value: number; goal: number; kind: keyof typeof MACRO_COLORS }) {
  const frac = goal > 0 ? Math.min(value / goal, 1) : 0
  const color = MACRO_COLORS[kind]
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, color }}>{label}</span>
        <span style={{ color: 'var(--ink-soft)' }}><b style={{ color: 'var(--ink)' }}>{Math.round(value)}</b>/{Math.round(goal)}g</span>
      </div>
      <div style={{ height: 8, background: 'rgba(120,80,30,.16)', borderRadius: 6, overflow: 'hidden' }}>
        <div className="chart-bar" style={{ height: '100%', width: `${frac * 100}%`, background: color, borderRadius: 6, transformOrigin: 'left' }} />
      </div>
    </div>
  )
}

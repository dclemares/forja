import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { METRICS, PERIODS, dailyPoints, filterPeriod, metricDef, summary, type MetricKey, type PeriodKey } from '@/lib/domain/progress'
import { formatNumber, todayISO } from '@/lib/format'

/** Selector de métrica + periodo con resumen (total/promedio) y gráfica con ejes.
 *  Reutilizable: en Progreso (todas las métricas) y en Nutrición (solo nutrición). */
export function MetricProgress({ metrics, defaultMetric }: { metrics?: MetricKey[]; defaultMetric?: MetricKey }) {
  const { state } = useStore()
  const keys = metrics ?? METRICS.map((m) => m.key)
  const [metric, setMetric] = useState<MetricKey>(defaultMetric ?? keys[0])
  const [period, setPeriod] = useState<PeriodKey>('1m')

  const def = metricDef(metric)
  const all = useMemo(
    () => dailyPoints(metric, { workouts: state.workouts, bodyweight: state.bodyweight, diary: state.diary }),
    [metric, state.workouts, state.bodyweight, state.diary],
  )
  const points = filterPeriod(all, period, todayISO())
  const s = summary(points)
  const periodLabel = PERIODS.find((p) => p.key === period)!.label

  const withUnit = (v: number | null) => (v == null ? '—' : `${formatNumber(v)} ${def.unit}`)
  const isSum = def.agg === 'sum'
  const headline = isSum
    ? { label: 'Total acumulado', value: s.total }
    : { label: def.source === 'diary' ? 'Promedio diario' : 'Promedio', value: Math.round(s.avg) }
  const stats: { label: string; text: string }[] = isSum
    ? [
        { label: 'Media', text: withUnit(Math.round(s.avg)) },
        { label: 'Máximo', text: withUnit(s.max) },
        { label: 'Registros', text: String(s.count) },
      ]
    : [
        { label: 'Mínimo', text: withUnit(s.min) },
        { label: 'Máximo', text: withUnit(s.max) },
        { label: 'Días', text: String(s.count) },
      ]

  return (
    <div>
      <div style={scrollRow}>
        {METRICS.filter((m) => keys.includes(m.key)).map((m) => (
          <button key={m.key} style={chip(m.key === metric)} onClick={() => setMetric(m.key)}>{m.label}</button>
        ))}
      </div>
      <div style={scrollRow}>
        {PERIODS.map((p) => (
          <button key={p.key} style={chip(p.key === period, true)} onClick={() => setPeriod(p.key)}>{p.label}</button>
        ))}
      </div>

      <GlassCard style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{headline.label} · {periodLabel}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.5px', lineHeight: 1.15 }}>
          {s.count === 0 ? '—' : withUnit(headline.value)}
        </div>
        <div style={{ display: 'flex', marginTop: 12, gap: 6 }}>
          {stats.map((st, i) => (
            <div key={st.label} style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={vsep} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{s.count === 0 ? '—' : st.text}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 1 }}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '14px 8px 8px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 8px 4px' }}>{def.label} · evolución ({def.unit})</div>
        <TrendChart points={points} unit={def.unit} zeroBased={def.zeroBased} avg={s.count ? s.avg : undefined} />
      </GlassCard>
    </div>
  )
}

const scrollRow: React.CSSProperties = { display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }
const vsep: React.CSSProperties = { width: 1, alignSelf: 'stretch', background: 'var(--hairline)', flex: 'none' }
const chip = (active: boolean, small = false): React.CSSProperties => ({
  flex: 'none',
  border: '2px solid #9A6A3A',
  borderRadius: 999,
  padding: small ? '5px 11px' : '6px 13px',
  fontSize: small ? 12.5 : 13,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  color: active ? '#4A2E10' : '#6E4423',
  background: active ? 'linear-gradient(180deg,#FFD75C,#EDA31E)' : 'linear-gradient(180deg,#F3E3BE,#E6CF9E)',
  boxShadow: active ? 'inset 0 1px 0 rgba(255,240,200,.7)' : 'inset 0 1px 0 rgba(255,255,255,.5)',
})

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <Dropdown label="Métrica" value={metric} onChange={(v) => setMetric(v as MetricKey)} options={METRICS.filter((m) => keys.includes(m.key)).map((m) => ({ value: m.key, label: m.label }))} />
        <Dropdown label="Periodo" value={period} onChange={(v) => setPeriod(v as PeriodKey)} options={PERIODS.map((p) => ({ value: p.key, label: p.label }))} />
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
        <TrendChart points={points} unit={def.unit} zeroBased={def.zeroBased} avg={s.count ? s.avg : undefined} decimals={def.key === 'peso' ? 1 : 0} />
      </GlassCard>
    </div>
  )
}

function Dropdown({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'block', marginBottom: 4, marginLeft: 2, fontWeight: 600 }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={sel}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6E4423' }} />
      </div>
    </label>
  )
}

const vsep: React.CSSProperties = { width: 1, alignSelf: 'stretch', background: 'var(--hairline)', flex: 'none' }
const sel: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  width: '100%',
  background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)',
  border: '2px solid #9A6A3A',
  borderRadius: 12,
  padding: '10px 30px 10px 12px',
  color: 'var(--ink)',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: 'inherit',
  outline: 'none',
  boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)',
  cursor: 'pointer',
}

import { useState } from 'react'
import { LineChart as LineIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { AppBar } from '@/components/ui/AppBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { HBars } from '@/components/charts/Charts'
import { volumeByMuscleGroup, workoutVolume } from '@/lib/domain/volume'
import { isoWeekKey, weeklyStreak } from '@/lib/domain/trends'
import { formatNumber, todayISO } from '@/lib/format'
import { HistoryList } from '@/features/history/HistoryList'
import { MetricProgress } from './MetricProgress'

type View = 'metricas' | 'grupos' | 'historial'

export function ProgressScreen() {
  const { state } = useStore()
  const [view, setView] = useState<View>('metricas')
  const finished = state.workouts.filter((w) => w.finishedAt)

  const curWeek = isoWeekKey(todayISO())
  const byMuscle = volumeByMuscleGroup(finished.filter((w) => isoWeekKey(w.date) === curWeek))
  const hbars = Object.entries(byMuscle).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  const totalVolume = finished.reduce((a, w) => a + workoutVolume(w), 0)
  const streak = weeklyStreak(finished, todayISO())

  if (finished.length === 0 && state.bodyweight.length === 0 && state.diary.length === 0) {
    return (
      <div className="anim-rise">
        <AppBar title="Progreso" large />
        <EmptyState icon={<LineIcon size={40} />} title="Aún sin progreso" hint="Completa tu primer entreno o registra comidas y aquí verás tu evolución." />
      </div>
    )
  }

  return (
    <div className="anim-rise">
      <AppBar title="Progreso" large />

      <div style={statStrip}>
        <Stat label="entrenos" value={String(finished.length)} />
        <span style={vsep} />
        <Stat label="kg totales" value={formatNumber(totalVolume)} />
        <span style={vsep} />
        <Stat label="racha (sem.)" value={String(streak)} />
      </div>

      <div style={seg}>
        <SegBtn active={view === 'metricas'} onClick={() => setView('metricas')}>Métricas</SegBtn>
        <SegBtn active={view === 'grupos'} onClick={() => setView('grupos')}>Grupos</SegBtn>
        <SegBtn active={view === 'historial'} onClick={() => setView('historial')}>Historial</SegBtn>
      </div>

      {view === 'metricas' && <MetricProgress defaultMetric="volumen" />}

      {view === 'grupos' && (
        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>Volumen por grupo muscular (kg) · esta semana</div>
          <HBars data={hbars} />
        </GlassCard>
      )}

      {view === 'historial' && <HistoryList />}
    </div>
  )
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: 8, borderRadius: 10, border: active ? '2px solid #7A4A12' : '2px solid transparent', background: active ? 'linear-gradient(180deg,#FFD75C,#EDA31E)' : 'transparent', color: active ? '#4A2E10' : '#6E4423', fontWeight: 700, boxShadow: active ? 'inset 0 1px 0 rgba(255,240,200,.7)' : 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{label}</div>
    </div>
  )
}

const seg: React.CSSProperties = { display: 'flex', background: 'rgba(120,80,30,.16)', border: '2px solid #9A6A3A', borderRadius: 13, padding: 3, marginBottom: 12, boxShadow: 'inset 0 2px 4px rgba(80,50,20,.25)' }
const statStrip: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg,#F4E3BE,#E7D0A0)', border: '2.5px solid #8A5A2A', borderRadius: 14, padding: '12px 8px', marginBottom: 12, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), 0 3px 0 #6E4423' }
const vsep: React.CSSProperties = { width: 1, alignSelf: 'stretch', background: 'var(--hairline)', flex: 'none' }

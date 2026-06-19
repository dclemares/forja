import { useNavigate } from 'react-router-dom'
import { ChevronRight, History } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { AppBar } from '@/components/ui/AppBar'
import { workoutSetCount, workoutVolume } from '@/lib/domain/volume'
import { formatNumber, formatShortDate } from '@/lib/format'

export function HistoryScreen() {
  const { state } = useStore()
  const navigate = useNavigate()
  const workouts = state.workouts.filter((w) => w.finishedAt).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="anim-rise">
      <AppBar title="Historial" large />
      {workouts.map((w) => (
        <GlassCard key={w.id} style={{ padding: 15, marginBottom: 11, cursor: 'pointer' }} onClick={() => navigate(`/history/${w.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={pill}>{formatShortDate(w.date)}</span>
              <div style={{ fontWeight: 600, marginTop: 7 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{w.exercises.length} ejercicios · {workoutSetCount(w)} series</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatNumber(workoutVolume(w))}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>kg</div>
              </div>
              <ChevronRight size={18} color="var(--ink-faint)" />
            </div>
          </div>
        </GlassCard>
      ))}
      {workouts.length === 0 && <EmptyState icon={<History size={40} />} title="Aún no hay entrenamientos" hint="Tus entrenos completados aparecerán aquí" />}
    </div>
  )
}

const pill: React.CSSProperties = { display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '3px 11px', borderRadius: 999, background: 'rgba(120,80,30,.14)', border: '1.5px solid rgba(120,80,30,.35)', color: '#7A4A12' }

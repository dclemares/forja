import { useState } from 'react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { AppBar } from '@/components/ui/AppBar'
import { VBars, HBars, BodyChart } from '@/components/charts/Charts'
import { volumeByMuscleGroup } from '@/lib/domain/volume'
import { bodyweightTrend, isoWeekKey, weeklyVolume } from '@/lib/domain/trends'
import { todayISO } from '@/lib/format'

type View = 'volumen' | 'grupos' | 'peso'

export function ProgressScreen() {
  const { state } = useStore()
  const [view, setView] = useState<View>('volumen')
  const finished = state.workouts.filter((w) => w.finishedAt)

  const weekly = weeklyVolume(finished).slice(-6).map((p) => ({ label: p.label, value: p.volume }))
  const curWeek = isoWeekKey(todayISO())
  const byMuscle = volumeByMuscleGroup(finished.filter((w) => isoWeekKey(w.date) === curWeek))
  const hbars = Object.entries(byMuscle).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  const body = bodyweightTrend(state.bodyweight)
  const lastBody = body[body.length - 1]

  return (
    <div className="anim-rise">
      <AppBar title="Progreso" large />

      <div style={seg}>
        <SegBtn active={view === 'volumen'} onClick={() => setView('volumen')}>Volumen</SegBtn>
        <SegBtn active={view === 'grupos'} onClick={() => setView('grupos')}>Grupos</SegBtn>
        <SegBtn active={view === 'peso'} onClick={() => setView('peso')}>Peso</SegBtn>
      </div>

      {view === 'volumen' && (
        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4 }}>Volumen semanal (kg) · comparación</div>
          <VBars data={weekly} />
        </GlassCard>
      )}

      {view === 'grupos' && (
        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>Volumen por grupo muscular · esta semana</div>
          <HBars data={hbars} />
        </GlassCard>
      )}

      {view === 'peso' && (
        <GlassCard style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Peso corporal · tendencia</div>
            {lastBody && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>media: <b style={{ color: 'var(--accent)' }}>{lastBody.avg.toFixed(1).replace('.', ',')} kg</b></div>}
          </div>
          <BodyChart data={body} />
        </GlassCard>
      )}
    </div>
  )
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: 8, borderRadius: 10, border: active ? '2px solid #7A4A12' : '2px solid transparent', background: active ? 'linear-gradient(180deg,#E6C06A,#B07E22)' : 'transparent', color: active ? '#4A2E10' : '#6E4423', fontWeight: 700, boxShadow: active ? 'inset 0 1px 0 rgba(255,240,200,.7)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
      {children}
    </button>
  )
}

const seg: React.CSSProperties = { display: 'flex', background: 'rgba(120,80,30,.16)', border: '2px solid #9A6A3A', borderRadius: 13, padding: 3, marginBottom: 12, boxShadow: 'inset 0 2px 4px rgba(80,50,20,.25)' }

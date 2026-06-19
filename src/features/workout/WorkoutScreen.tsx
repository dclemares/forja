import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronRight, CircleCheck, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { MuscleIconBadge } from '@/components/ui/MuscleIcon'
import { ExercisePicker } from './ExercisePicker'
import { WorkoutCelebration } from './WorkoutCelebration'
import { exerciseVolume, formatSetsSummary, workoutSetCount, workoutVolume } from '@/lib/domain/volume'
import { formatNumber } from '@/lib/format'

export function WorkoutScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, addWorkoutExercise, finishWorkout } = useStore()
  const workout = state.workouts.find((w) => w.id === id)
  const [addOpen, setAddOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!workout) {
    return (
      <div style={{ padding: 24 }}>
        <p>Entrenamiento no encontrado.</p>
        <PillButton onClick={() => navigate('/')}>Volver</PillButton>
      </div>
    )
  }

  const finish = () => {
    finishWorkout(workout.id)
    setDone(true)
  }

  return (
    <div className="anim-fade">
      <AppBar
        back
        onBack={() => navigate('/')}
        title={workout.name}
        subtitle={<span style={{ color: 'var(--accent)', fontFamily: 'ui-monospace, monospace' }}>{fmtTime(elapsed)}</span>}
        right={<PillButton icon={<Check size={16} />} onClick={finish}>Finalizar</PillButton>}
      />

      <GlassCard style={{ ...summary }}>
        <div>
          <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--accent)' }}>{formatNumber(workoutVolume(workout))}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>volumen · kg</div>
        </div>
        <Metric value={workout.exercises.length} label="ejercicios" />
        <Metric value={workoutSetCount(workout)} label="series" />
      </GlassCard>

      {workout.exercises.map((we) => {
        const hasSets = we.sets.length > 0
        return (
          <GlassCard key={we.id} style={{ padding: 14, marginBottom: 11, cursor: 'pointer' }} onClick={() => navigate(`/workout/${workout.id}/ex/${we.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MuscleIconBadge group={we.muscleGroup} size={42} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{we.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {we.muscleGroup}{hasSets ? ` · ${formatSetsSummary(we.sets)}` : ' · sin registrar'}
                </div>
              </div>
              {hasSets ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14 }}>{formatNumber(exerciseVolume(we))}</div>
                  <CircleCheck size={16} color="var(--accent)" style={{ marginTop: 2 }} />
                </div>
              ) : (
                <ChevronRight size={20} color="var(--ink-faint)" />
              )}
            </div>
          </GlassCard>
        )
      })}

      <PillButton full variant="dashed" icon={<Plus size={18} />} onClick={() => setAddOpen(true)} style={{ marginTop: 2 }}>
        Añadir ejercicio
      </PillButton>

      <ExercisePicker
        open={addOpen}
        onClose={() => setAddOpen(false)}
        excludeIds={workout.exercises.map((e) => e.exerciseId).filter(Boolean) as string[]}
        onPick={(ex) => addWorkoutExercise(workout.id, { exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup })}
      />

      {done && (
        <WorkoutCelebration
          volume={workoutVolume(workout)}
          exercises={workout.exercises.length}
          series={workoutSetCount(workout)}
          onClose={() => navigate('/')}
        />
      )}
    </div>
  )
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div>
    </div>
  )
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

const summary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 20, padding: '14px 18px', marginBottom: 14, background: 'var(--accent-tint)',
}

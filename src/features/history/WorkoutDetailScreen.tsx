import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoreVertical, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar, iconBtn } from '@/components/ui/AppBar'
import { Tag } from '@/components/ui/Chip'
import { Stepper } from '@/components/ui/Stepper'
import { Sheet } from '@/components/ui/Sheet'
import { exerciseVolume, workoutVolume } from '@/lib/domain/volume'
import { formatLongDate, formatNumber } from '@/lib/format'
import { getWeightStep } from '@/lib/prefs'

export function WorkoutDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, updateSet, addSet, deleteSet, removeWorkoutExercise, deleteWorkout } = useStore()
  const workout = state.workouts.find((w) => w.id === id)
  const [menuOpen, setMenuOpen] = useState(false)

  if (!workout) return <div style={{ padding: 24 }}><PillButton onClick={() => navigate('/history')}>Volver</PillButton></div>

  return (
    <div className="anim-fade">
      <AppBar
        back
        onBack={() => navigate('/history')}
        title={workout.name}
        subtitle={formatLongDate(workout.date)}
        right={<button aria-label="Opciones" style={iconBtn} onClick={() => setMenuOpen(true)}><MoreVertical size={20} /></button>}
      />

      <GlassCard style={{ padding: '14px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Volumen total</span>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>{formatNumber(workoutVolume(workout))} kg</span>
      </GlassCard>

      {workout.exercises.map((we) => (
        <GlassCard key={we.id} style={{ padding: 14, marginBottom: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div><span style={{ fontWeight: 600 }}>{we.name}</span> <Tag>{we.muscleGroup}</Tag></div>
            <button aria-label="Quitar ejercicio" style={delBtn} onClick={() => removeWorkoutExercise(workout.id, we.id)}><Trash2 size={16} /></button>
          </div>
          <div style={gridHead}><span /><span style={{ textAlign: 'center' }}>Peso (kg)</span><span style={{ textAlign: 'center' }}>Reps</span><span /></div>
          {we.sets.map((s, i) => (
            <div key={s.id} style={{ marginTop: 9 }}>
              <div style={row}>
                <span style={sn}>{i + 1}</span>
                <Stepper kind="weight" step={getWeightStep()} value={s.weight} ariaLabel="peso" onChange={(v) => updateSet(workout.id, we.id, s.id, { weight: v })} />
                <Stepper kind="reps" step={1} value={s.reps} ariaLabel="reps" onChange={(v) => updateSet(workout.id, we.id, s.id, { reps: v })} />
                <button aria-label="Borrar serie" style={delBtn} onClick={() => deleteSet(workout.id, we.id, s.id)}><X size={16} /></button>
              </div>
              {(s.rpe != null || s.note) && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 2px 0 24px', fontSize: 12 }}>
                  {s.rpe != null && <span style={{ background: 'var(--accent-tint)', color: 'var(--accent)', fontWeight: 800, fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>RPE {s.rpe}</span>}
                  {s.note ? <span style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.note}</span> : null}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
            <PillButton variant="tonal" icon={<Plus size={15} />} onClick={() => addSet(workout.id, we.id)}>Añadir serie</PillButton>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{formatNumber(exerciseVolume(we))} kg</span>
          </div>
        </GlassCard>
      ))}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Entrenamiento">
        <div style={{ paddingBottom: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--danger)', textAlign: 'left' }} onClick={() => { if (window.confirm('¿Eliminar este entrenamiento del historial?')) { deleteWorkout(workout.id); navigate('/history') } }}>
            <Trash2 size={19} /> Eliminar entrenamiento
          </button>
        </div>
      </Sheet>
    </div>
  )
}

const gridHead: React.CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr 40px', gap: 8, fontSize: 11, color: 'var(--ink-soft)', marginTop: 8, padding: '0 2px' }
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr 40px', gap: 8, alignItems: 'center' }
const sn: React.CSSProperties = { textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 500 }
const delBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar, iconBtn } from '@/components/ui/AppBar'
import { Tag, Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { LineChart } from '@/components/charts/Charts'
import { exerciseVolume, formatSetsSummary } from '@/lib/domain/volume'
import { formatDayMonth, formatNumber } from '@/lib/format'
import { MUSCLE_GROUPS } from '@/lib/types'
import type { MuscleGroup } from '@/lib/types'

export function ExerciseProgressScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, updateExercise, deleteExercise } = useStore()
  const exercise = state.exercises.find((e) => e.id === id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(exercise?.name ?? '')
  const [group, setGroup] = useState<MuscleGroup>(exercise?.muscleGroup ?? 'Pecho')

  if (!exercise) return <div style={{ padding: 24 }}><PillButton onClick={() => navigate('/exercises')}>Volver</PillButton></div>

  const history = state.workouts
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseId === id && e.sets.length)
      return ex ? { date: w.date, sets: ex.sets, volume: exerciseVolume(ex) } : null
    })
    .filter((x): x is { date: string; sets: any[]; volume: number } => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const chartData = history.map((h) => ({ label: formatDayMonth(h.date), value: h.volume }))

  return (
    <div className="anim-fade">
      <AppBar
        back
        onBack={() => navigate('/exercises')}
        title={exercise.name}
        subtitle={<Tag>{exercise.muscleGroup}</Tag>}
        right={<button aria-label="Opciones" style={iconBtn} onClick={() => setMenuOpen(true)}><MoreVertical size={20} /></button>}
      />

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', margin: '4px 2px 8px' }}>Evolución del volumen</div>
      <GlassCard style={{ padding: 15, marginBottom: 14 }}>
        <LineChart data={chartData} />
      </GlassCard>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', margin: '0 2px 8px' }}>Histórico completo</div>
      <GlassCard style={{ padding: 15 }}>
        {history.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              <tr style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                <td style={td}>Fecha</td><td style={td}>Peso y reps</td><td style={{ ...td, textAlign: 'right' }}>Volumen</td>
              </tr>
              {[...history].reverse().map((h, i) => (
                <tr key={i}>
                  <td style={{ ...td, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{formatDayMonth(h.date)}</td>
                  <td style={td}>{formatSetsSummary(h.sets)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatNumber(h.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--ink-faint)', fontSize: 14 }}>Todavía no has registrado este ejercicio.</div>
        )}
      </GlassCard>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Ejercicio">
        <div style={{ paddingBottom: 8 }}>
          <button style={menuItem} onClick={() => { setMenuOpen(false); setName(exercise.name); setGroup(exercise.muscleGroup); setEditOpen(true) }}>
            <Pencil size={19} color="var(--accent)" /> Editar
          </button>
          <button style={{ ...menuItem, color: 'var(--danger)' }} onClick={() => { deleteExercise(exercise.id); navigate('/exercises') }}>
            <Trash2 size={19} /> Eliminar
          </button>
        </div>
      </Sheet>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Editar ejercicio">
        <div style={{ padding: '4px 2px 12px' }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '14px 0 8px' }}>Grupo muscular</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {MUSCLE_GROUPS.map((g) => <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{g}</Chip>)}
          </div>
          <PillButton full size="lg" onClick={() => { updateExercise(exercise.id, { name, muscleGroup: group }); setEditOpen(false) }}>Guardar</PillButton>
        </div>
      </Sheet>
    </div>
  )
}

const td: React.CSSProperties = { padding: '8px 0', borderBottom: '1px solid rgba(20,22,26,.07)' }
const menuItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(120,80,30,.1)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftRight, ChartLine, ClipboardList, History as HistoryIcon, MoreVertical, Plus, Table, Trash2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar, iconBtn } from '@/components/ui/AppBar'
import { Tag } from '@/components/ui/Chip'
import { Stepper } from '@/components/ui/Stepper'
import { Sheet } from '@/components/ui/Sheet'
import { ExercisePicker } from './ExercisePicker'
import { LineChart } from '@/components/charts/Charts'
import { exerciseVolume, formatSetsSummary } from '@/lib/domain/volume'
import { formatDayMonth, formatNumber } from '@/lib/format'

export function ExerciseDetailScreen() {
  const { id = '', weId = '' } = useParams()
  const navigate = useNavigate()
  const { state, ensurePrefill, addSet, updateSet, deleteSet, removeWorkoutExercise, replaceWorkoutExercise } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const workout = state.workouts.find((w) => w.id === id)
  const we = workout?.exercises.find((e) => e.id === weId)

  useEffect(() => {
    if (we) ensurePrefill(id, weId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, weId])

  if (!workout || !we) {
    return (
      <div style={{ padding: 24 }}>
        <PillButton onClick={() => navigate(`/workout/${id}`)}>Volver</PillButton>
      </div>
    )
  }

  const history = state.workouts
    .filter((w) => w.id !== workout.id)
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseId === we.exerciseId && e.sets.length)
      return ex ? { date: w.date, sets: ex.sets, volume: exerciseVolume(ex) } : null
    })
    .filter((x): x is { date: string; sets: typeof we.sets; volume: number } => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const chartData = [
    ...history.map((h) => ({ label: formatDayMonth(h.date), value: h.volume })),
    { label: 'hoy', value: exerciseVolume(we) },
  ]

  return (
    <div className="anim-fade">
      <AppBar
        back
        onBack={() => navigate(`/workout/${id}`)}
        title={we.name}
        subtitle={<Tag>{we.muscleGroup}</Tag>}
        right={<button aria-label="Opciones" style={iconBtn} onClick={() => setMenuOpen(true)}><MoreVertical size={20} /></button>}
      />

      <SectionTitle icon={<ClipboardList size={16} />}>Series de hoy</SectionTitle>
      <GlassCard style={{ padding: 15, marginBottom: 4 }}>
        <span style={hint}><HistoryIcon size={13} /> Prerellenado con tu última vez</span>
        <div style={{ ...gridHead }}>
          <span />
          <span style={{ textAlign: 'center' }}>Peso (kg)</span>
          <span style={{ textAlign: 'center' }}>Reps</span>
          <span />
        </div>
        {we.sets.map((s, i) => (
          <div key={s.id} className="anim-pop" style={row}>
            <span style={sn}>{i + 1}</span>
            <Stepper kind="weight" step={2.5} value={s.weight} ariaLabel="peso" onChange={(v) => updateSet(id, weId, s.id, { weight: v })} />
            <Stepper kind="reps" step={1} value={s.reps} ariaLabel="reps" onChange={(v) => updateSet(id, weId, s.id, { reps: v })} />
            <button aria-label="Borrar serie" style={delBtn} onClick={() => deleteSet(id, weId, s.id)}><X size={16} /></button>
          </div>
        ))}
        {we.sets.length === 0 && <div style={{ color: 'var(--ink-faint)', fontSize: 14, padding: '10px 2px' }}>Aún no hay series. Añade la primera.</div>}
        <PillButton full variant="tonal" icon={<Plus size={16} />} style={{ marginTop: 12 }} onClick={() => addSet(id, weId)}>
          Añadir serie
        </PillButton>
        <div style={volRow}>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Volumen de hoy</span>
          <span><b style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>{formatNumber(exerciseVolume(we))}</b> <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>kg</span></span>
        </div>
      </GlassCard>

      <SectionTitle icon={<Table size={16} />}>Histórico de semanas anteriores</SectionTitle>
      <GlassCard style={{ padding: 15, marginBottom: 4 }}>
        {history.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              <tr style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                <td style={td}>Fecha</td><td style={td}>Series</td><td style={{ ...td, textAlign: 'right' }}>Volumen</td>
              </tr>
              {[...history].reverse().map((h, i) => (
                <tr key={i}>
                  <td style={{ ...td, color: 'var(--ink-soft)' }}>{formatDayMonth(h.date)}</td>
                  <td style={td}>{formatSetsSummary(h.sets)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatNumber(h.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--ink-faint)', fontSize: 14 }}>Primera vez que haces este ejercicio.</div>
        )}
      </GlassCard>

      <SectionTitle icon={<ChartLine size={16} />}>Volumen total del ejercicio</SectionTitle>
      <GlassCard style={{ padding: 15 }}>
        <LineChart data={chartData} />
      </GlassCard>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones del ejercicio">
        <div style={{ paddingBottom: 8 }}>
          <button style={menuItem} onClick={() => { setMenuOpen(false); setPickerOpen(true) }}>
            <ArrowLeftRight size={19} color="var(--accent)" /> Quitar y sustituir por otro
          </button>
          <button style={{ ...menuItem, color: 'var(--danger)' }} onClick={() => { removeWorkoutExercise(id, weId); navigate(`/workout/${id}`) }}>
            <Trash2 size={19} /> Quitar ejercicio
          </button>
        </div>
      </Sheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        relatedMuscle={we.muscleGroup}
        title="Cambiar ejercicio"
        excludeIds={workout.exercises.map((e) => e.exerciseId).filter(Boolean) as string[]}
        onPick={(ex) => { replaceWorkoutExercise(id, weId, { exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup }); navigate(`/workout/${id}`) }}
      />
    </div>
  )
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', margin: '16px 2px 8px' }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      {children}
    </div>
  )
}

const hint: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 11, padding: '5px 11px', borderRadius: 13, marginBottom: 4 }
const gridHead: React.CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr 34px', gap: 8, fontSize: 11, color: 'var(--ink-soft)', marginTop: 11, padding: '0 2px' }
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr 34px', gap: 8, alignItems: 'center', marginTop: 9 }
const sn: React.CSSProperties = { textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 500 }
const delBtn: React.CSSProperties = { width: 34, height: 34, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const volRow: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 13, paddingTop: 12, borderTop: '1px solid rgba(20,22,26,.1)' }
const td: React.CSSProperties = { padding: '8px 0', borderBottom: '1px solid rgba(20,22,26,.07)' }
const menuItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoreVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar, iconBtn } from '@/components/ui/AppBar'
import { Sheet } from '@/components/ui/Sheet'
import { MuscleIconBadge } from '@/components/ui/MuscleIcon'
import { ExercisePicker } from '@/features/workout/ExercisePicker'
import type { Exercise } from '@/lib/types'

export function SessionDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, renameSession, deleteSession, addExerciseToSession, removeExerciseFromSession } = useStore()
  const session = state.sessions.find((s) => s.id === id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)
  const [name, setName] = useState(session?.name ?? '')

  if (!session) {
    return <div style={{ padding: 24 }}><PillButton onClick={() => navigate('/sessions')}>Volver</PillButton></div>
  }

  const exercises = session.exerciseIds
    .map((eid) => state.exercises.find((e) => e.id === eid))
    .filter(Boolean) as Exercise[]

  return (
    <div className="anim-fade">
      <AppBar
        back
        onBack={() => navigate('/sessions')}
        title={session.name}
        right={<button aria-label="Opciones" style={iconBtn} onClick={() => setMenuOpen(true)}><MoreVertical size={20} /></button>}
      />

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', margin: '4px 2px 8px' }}>Ejercicios</div>
      {exercises.map((e) => (
        <GlassCard key={e.id} style={{ padding: 13, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MuscleIconBadge group={e.muscleGroup} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{e.muscleGroup}</div>
            </div>
            <button aria-label="Quitar" style={delBtn} onClick={() => removeExerciseFromSession(session.id, e.id)}><X size={18} /></button>
          </div>
        </GlassCard>
      ))}
      {exercises.length === 0 && <div style={{ color: 'var(--ink-faint)', fontSize: 14, padding: '8px 2px 14px' }}>Sin ejercicios todavía.</div>}

      <PillButton full variant="dashed" icon={<Plus size={18} />} onClick={() => setPickOpen(true)} style={{ marginTop: 2 }}>
        Añadir ejercicio
      </PillButton>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Sesión">
        <div style={{ paddingBottom: 8 }}>
          <button style={menuItem} onClick={() => { setMenuOpen(false); setName(session.name); setRenameOpen(true) }}>
            <Pencil size={19} color="var(--accent)" /> Cambiar nombre
          </button>
          <button style={{ ...menuItem, color: 'var(--danger)' }} onClick={() => { deleteSession(session.id); navigate('/sessions') }}>
            <Trash2 size={19} /> Eliminar sesión
          </button>
        </div>
      </Sheet>

      <Sheet open={renameOpen} onClose={() => setRenameOpen(false)} title="Cambiar nombre">
        <div style={{ padding: '4px 2px 12px' }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <PillButton full size="lg" style={{ marginTop: 12 }} onClick={() => { renameSession(session.id, name); setRenameOpen(false) }}>Guardar</PillButton>
        </div>
      </Sheet>

      <ExercisePicker
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        excludeIds={session.exerciseIds}
        onPick={(ex) => addExerciseToSession(session.id, ex.id)}
      />
    </div>
  )
}

const delBtn: React.CSSProperties = { width: 34, height: 34, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const menuItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }
const inputStyle: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

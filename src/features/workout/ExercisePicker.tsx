import { useState } from 'react'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { PillButton } from '@/components/ui/PillButton'
import { Chip } from '@/components/ui/Chip'
import { MuscleIconBadge } from '@/components/ui/MuscleIcon'
import { useStore } from '@/lib/store'
import { MUSCLE_GROUPS } from '@/lib/types'
import type { Exercise, MuscleGroup } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  relatedMuscle?: MuscleGroup | null
  onPick: (exercise: Exercise) => void
  title?: string
  excludeIds?: string[]
}

export function ExercisePicker({ open, onClose, relatedMuscle, onPick, title = 'Añadir ejercicio', excludeIds = [] }: Props) {
  const { state, addExercise } = useStore()
  const [showAll, setShowAll] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<MuscleGroup | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<MuscleGroup>('Pecho')

  const lib = state.exercises.filter((e) => !e.archived && !excludeIds.includes(e.id))
  const related = relatedMuscle ? lib.filter((e) => e.muscleGroup === relatedMuscle) : []
  const filtered = lib.filter(
    (e) => (!filter || e.muscleGroup === filter) && e.name.toLowerCase().includes(q.trim().toLowerCase()),
  )

  const reset = () => { setShowAll(false); setQ(''); setFilter(null); setCreating(false); setName('') }
  const close = () => { reset(); onClose() }
  const pick = (ex: Exercise) => { onPick(ex); close() }
  const create = () => {
    if (!name.trim()) return
    pick(addExercise(name, group))
  }

  const showList = showAll || !relatedMuscle

  return (
    <Sheet open={open} onClose={close} title={creating ? 'Crear ejercicio' : title}>
      {creating ? (
        <div style={{ padding: '4px 2px 12px' }}>
          <input autoFocus placeholder="Nombre del ejercicio" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '14px 0 8px' }}>Grupo muscular</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {MUSCLE_GROUPS.map((g) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{g}</Chip>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <PillButton variant="ghost" style={{ flex: 1 }} onClick={() => setCreating(false)}>Cancelar</PillButton>
            <PillButton style={{ flex: 1 }} onClick={create}>Crear y añadir</PillButton>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: 8 }}>
          {!showList && (
            <>
              <SectionLabel>Relacionados · {relatedMuscle}</SectionLabel>
              {related.length ? related.map((e) => <Row key={e.id} ex={e} onClick={() => pick(e)} />) : (
                <div style={empty}>No hay otros ejercicios de {relatedMuscle}</div>
              )}
              <PillButton full variant="ghost" style={{ marginTop: 12 }} icon={<Search size={16} />} onClick={() => setShowAll(true)}>
                Ver todos los ejercicios
              </PillButton>
            </>
          )}

          {showList && (
            <>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ink-faint)' }} />
                <input placeholder="Buscar ejercicio..." value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
              <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
                <Chip active={!filter} onClick={() => setFilter(null)}>Todos</Chip>
                {MUSCLE_GROUPS.map((g) => (
                  <Chip key={g} active={filter === g} onClick={() => setFilter(g)}>{g}</Chip>
                ))}
              </div>
              {filtered.length ? filtered.map((e) => <Row key={e.id} ex={e} onClick={() => pick(e)} />) : (
                <div style={empty}>Sin resultados</div>
              )}
            </>
          )}

          <PillButton full variant="tonal" style={{ marginTop: 12 }} icon={<Plus size={16} />} onClick={() => setCreating(true)}>
            Crear nuevo ejercicio
          </PillButton>
        </div>
      )}
    </Sheet>
  )
}

function Row({ ex, onClick }: { ex: Exercise; onClick: () => void }) {
  return (
    <button style={rowBtn} onClick={onClick}>
      <MuscleIconBadge group={ex.muscleGroup} size={38} />
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{ex.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{ex.muscleGroup}</div>
      </div>
      <ChevronRight size={18} color="var(--ink-faint)" style={{ marginLeft: 'auto' }} />
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '2px 2px 8px' }}>{children}</div>
}

const rowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 6px',
  background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.06)', cursor: 'pointer', fontFamily: 'inherit',
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A',
  borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
  boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)',
}
const empty: React.CSSProperties = { padding: '14px 6px', color: 'var(--ink-faint)', fontSize: 14 }

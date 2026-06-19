import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChartLine, Dumbbell, Plus, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { Chip } from '@/components/ui/Chip'
import { MuscleIconBadge } from '@/components/ui/MuscleIcon'
import { Sheet } from '@/components/ui/Sheet'
import { MUSCLE_GROUPS } from '@/lib/types'
import type { MuscleGroup } from '@/lib/types'

export function ExercisesScreen() {
  const { state, addExercise } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<MuscleGroup | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<MuscleGroup>('Pecho')

  const list = state.exercises
    .filter((e) => !e.archived)
    .filter((e) => (!filter || e.muscleGroup === filter) && e.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const create = () => {
    if (!name.trim()) return
    addExercise(name, group)
    setName('')
    setCreateOpen(false)
  }

  return (
    <div className="anim-rise">
      <AppBar title="Ejercicios" large right={<PillButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)} aria-label="Crear ejercicio" />} />

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ink-faint)' }} />
        <input placeholder="Buscar ejercicio..." value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 10 }}>
        <Chip active={!filter} onClick={() => setFilter(null)}>Todos</Chip>
        {MUSCLE_GROUPS.map((g) => <Chip key={g} active={filter === g} onClick={() => setFilter(g)}>{g}</Chip>)}
      </div>

      {list.map((e) => (
        <GlassCard key={e.id} style={{ padding: 13, marginBottom: 10, cursor: 'pointer' }} onClick={() => navigate(`/exercises/${e.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MuscleIconBadge group={e.muscleGroup} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{e.muscleGroup}</div>
            </div>
            <ChartLine size={18} color="var(--accent)" />
          </div>
        </GlassCard>
      ))}
      {list.length === 0 && <EmptyState icon={<Dumbbell size={40} />} title="Aún no tienes ejercicios" hint="Pulsa + para crear el primero" />}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Crear ejercicio">
        <div style={{ padding: '4px 2px 12px' }}>
          <input autoFocus placeholder="Nombre del ejercicio" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '14px 0 8px' }}>Grupo muscular</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {MUSCLE_GROUPS.map((g) => <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{g}</Chip>)}
          </div>
          <PillButton full size="lg" onClick={create}>Crear ejercicio</PillButton>
        </div>
      </Sheet>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(120,80,30,.1)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

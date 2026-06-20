import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { Sheet } from '@/components/ui/Sheet'
import { DAY_LABELS } from '@/lib/format'
import { sessionColor } from '@/lib/sessionColor'

export function SessionsScreen() {
  const { state, addSession, setDayPlan } = useStore()
  const navigate = useNavigate()
  const [newOpen, setNewOpen] = useState(false)
  const [name, setName] = useState('')
  const [dayEdit, setDayEdit] = useState<number | null>(null)

  const create = () => {
    if (!name.trim()) return
    const s = addSession(name)
    setName('')
    setNewOpen(false)
    navigate(`/sessions/${s.id}`)
  }

  const plannedDays = DAY_LABELS.filter((_, i) => state.weeklyPlan[i]).length

  return (
    <div className="anim-rise">
      <AppBar title="Sesiones" large right={<PillButton icon={<Plus size={16} />} onClick={() => setNewOpen(true)}>Nueva</PillButton>} />

      <GlassCard style={{ padding: 15, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Planificación semanal</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {DAY_LABELS.map((d, i) => {
            const s = state.sessions.find((x) => x.id === state.weeklyPlan[i])
            const col = s ? sessionColor(s.id) : null
            return (
              <button key={i} title={s ? s.name : 'Descanso'} style={{ ...dayCell, ...(col ? { borderColor: col, background: `${col}1A` } : {}) }} onClick={() => setDayEdit(i)}>
                <span style={{ color: 'var(--ink-soft)', fontWeight: 700 }}>{d[0]}</span>
                <b style={{ fontSize: 10, fontWeight: 800, color: col ?? 'var(--ink-faint)', marginTop: 3 }}>
                  {s ? abbrev(s.name) : 'Desc'}
                </b>
              </button>
            )
          })}
        </div>
        {state.sessions.length > 0 && (
          <div style={summaryStrip}>
            <span><b style={{ color: 'var(--ink)' }}>{state.sessions.length}</b> {state.sessions.length === 1 ? 'sesión' : 'sesiones'}</span>
            <span style={dot} />
            <span><b style={{ color: 'var(--ink)' }}>{plannedDays}</b> de entreno</span>
            <span style={dot} />
            <span><b style={{ color: 'var(--ink)' }}>{7 - plannedDays}</b> descanso</span>
          </div>
        )}
      </GlassCard>

      {state.sessions.map((s) => (
        <GlassCard key={s.id} style={{ padding: 15, marginBottom: 11, cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: sessionColor(s.id), border: '2px solid rgba(40,20,5,.2)', flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{s.exerciseIds.length} ejercicios</div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--ink-faint)" />
          </div>
        </GlassCard>
      ))}
      {state.sessions.length === 0 && <EmptyState icon={<ClipboardList size={40} />} title="Sin sesiones todavía" hint="Crea tu primera rutina con +" />}

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="Nueva sesión">
        <div style={{ padding: '4px 2px 12px' }}>
          <input autoFocus placeholder="Nombre (p. ej. Pecho 1)" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <PillButton full size="lg" style={{ marginTop: 12 }} onClick={create}>Crear sesión</PillButton>
        </div>
      </Sheet>

      <Sheet open={dayEdit !== null} onClose={() => setDayEdit(null)} title={dayEdit !== null ? `Plan del ${fullDay(dayEdit)}` : ''}>
        <div style={{ paddingBottom: 8 }}>
          <button style={rowBtn} onClick={() => { if (dayEdit !== null) setDayPlan(dayEdit, null); setDayEdit(null) }}>Descanso</button>
          {state.sessions.map((s) => (
            <button key={s.id} style={rowBtn} onClick={() => { if (dayEdit !== null) setDayPlan(dayEdit, s.id); setDayEdit(null) }}>
              {s.name}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

const abbrev = (n: string) => {
  const num = n.match(/(\d+)\s*$/)?.[1] ?? ''
  const word = n.replace(/\s*\d+\s*$/, '').trim() || n
  return (word.slice(0, 3) + num).toUpperCase()
}
const fullDay = (i: number) => ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][i]

const dayCell: React.CSSProperties = { flex: 1, textAlign: 'center', background: 'linear-gradient(180deg,#F3E3BE,#E6CF9E)', border: '2px solid #9A6A3A', borderRadius: 11, padding: '8px 1px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)' }
const summaryStrip: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--hairline)', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }
const dot: React.CSSProperties = { width: 3, height: 3, borderRadius: 999, background: 'var(--ink-faint)', flex: 'none' }
const inputStyle: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const rowBtn: React.CSSProperties = { display: 'block', width: '100%', padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }

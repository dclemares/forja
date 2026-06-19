import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { Sheet } from '@/components/ui/Sheet'
import { DAY_LABELS } from '@/lib/format'

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

  return (
    <div className="anim-rise">
      <AppBar title="Sesiones" large right={<PillButton icon={<Plus size={16} />} onClick={() => setNewOpen(true)}>Nueva</PillButton>} />

      <GlassCard style={{ padding: 15, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Planificación semanal</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {DAY_LABELS.map((d, i) => {
            const s = state.sessions.find((x) => x.id === state.weeklyPlan[i])
            return (
              <button key={i} style={dayCell} onClick={() => setDayEdit(i)}>
                <span style={{ color: 'var(--ink-soft)' }}>{d[0]}</span>
                <b style={{ fontSize: 10, fontWeight: 600, color: s ? 'var(--accent)' : 'var(--ink-faint)', marginTop: 3 }}>
                  {s ? abbrev(s.name) : 'Desc'}
                </b>
              </button>
            )
          })}
        </div>
      </GlassCard>

      {state.sessions.map((s) => (
        <GlassCard key={s.id} style={{ padding: 15, marginBottom: 11, cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{s.exerciseIds.length} ejercicios</div>
            </div>
            <ChevronRight size={18} color="var(--ink-faint)" />
          </div>
        </GlassCard>
      ))}
      {state.sessions.length === 0 && <Empty>Crea tu primera sesión.</Empty>}

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

const abbrev = (n: string) => (n.length > 7 ? n.slice(0, 6) + '…' : n)
const fullDay = (i: number) => ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][i]

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14, padding: '24px 0' }}>{children}</div>
}

const dayCell: React.CSSProperties = { flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.5)', border: '1px solid rgba(20,22,26,.08)', borderRadius: 11, padding: '8px 1px', fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(20,22,26,.12)', borderRadius: 14, padding: '12px', color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }
const rowBtn: React.CSSProperties = { display: 'block', width: '100%', padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }

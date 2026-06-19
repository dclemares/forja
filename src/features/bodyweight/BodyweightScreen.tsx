import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { Sheet } from '@/components/ui/Sheet'
import { BodyChart } from '@/components/charts/Charts'
import { bodyweightTrend } from '@/lib/domain/trends'
import { formatShortDate, todayISO } from '@/lib/format'

export function BodyweightScreen() {
  const { state, addBodyweight, updateBodyweight, deleteBodyweight } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('78,4')

  const body = bodyweightTrend(state.bodyweight)
  const lastBody = body[body.length - 1]
  const sorted = [...state.bodyweight].sort((a, b) => b.date.localeCompare(a.date))

  const openNew = () => { setEditId(null); setDate(todayISO()); setWeight(lastBody ? lastBody.weight.toFixed(1).replace('.', ',') : '78,0'); setOpen(true) }
  const openEdit = (id: string, d: string, w: number) => { setEditId(id); setDate(d); setWeight(w.toFixed(1).replace('.', ',')); setOpen(true) }
  const save = () => {
    const n = parseFloat(weight.replace(',', '.'))
    if (!Number.isFinite(n)) return
    if (editId) updateBodyweight(editId, { date, weight: n })
    else addBodyweight(date, n)
    setOpen(false)
  }

  return (
    <div className="anim-fade">
      <AppBar back onBack={() => navigate('/')} title="Peso corporal" right={<PillButton icon={<Plus size={16} />} onClick={openNew}>Registrar</PillButton>} />

      <GlassCard style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {lastBody ? lastBody.weight.toFixed(1).replace('.', ',') : '—'}<span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 400 }}> kg</span>
          </div>
          {lastBody && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>media 7d: <b style={{ color: 'var(--accent)' }}>{lastBody.avg.toFixed(1).replace('.', ',')}</b></div>}
        </div>
        <BodyChart data={body} />
      </GlassCard>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', margin: '0 2px 8px' }}>Historial</div>
      {sorted.map((b) => (
        <GlassCard key={b.id} style={{ padding: '12px 15px', marginBottom: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => openEdit(b.id, b.date, b.weight)}>
              <span style={{ fontWeight: 600 }}>{b.weight.toFixed(1).replace('.', ',')} kg</span>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 10 }}>{formatShortDate(b.date)}</span>
            </div>
            <button aria-label="Eliminar" style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer' }} onClick={() => deleteBodyweight(b.id)}><Trash2 size={16} /></button>
          </div>
        </GlassCard>
      ))}
      {sorted.length === 0 && <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14, padding: '20px 0' }}>Sin registros.</div>}

      <Sheet open={open} onClose={() => setOpen(false)} title={editId ? 'Editar registro' : 'Nuevo registro'}>
        <div style={{ padding: '4px 2px 12px' }}>
          <label style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, margin: '6px 0 12px' }} />
          <label style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Peso (kg)</label>
          <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ ...inputStyle, margin: '6px 0 14px', textAlign: 'center', fontSize: 22, fontWeight: 600 }} />
          <PillButton full size="lg" onClick={save}>Guardar</PillButton>
        </div>
      </Sheet>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(120,80,30,.1)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

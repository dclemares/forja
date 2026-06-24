import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Apple, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Sheet'
import type { Food } from '@/lib/types'
import { FoodForm } from './sheets/FoodForm'

export function FoodsScreen() {
  const { state, addFood, updateFood, deleteFood } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Food | null>(null)

  const list = state.foods
    .filter((f) => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="anim-fade">
      <AppBar back onBack={() => navigate('/nutrition')} title="Alimentos" right={<PillButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)} aria-label="Crear alimento" />} />

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" placeholder="Buscar alimento…" value={q} onChange={(e) => setQ(e.target.value)} style={inp} />
      </div>

      {list.map((f) => (
        <GlassCard key={f.id} style={{ padding: 13, marginBottom: 10, cursor: 'pointer' }} onClick={() => setEditing(f)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{f.name}{f.brand ? <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}> · {f.brand}</span> : null}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{Math.round(f.per100.kcal)} kcal · P{Math.round(f.per100.protein)} C{Math.round(f.per100.carbs)} G{Math.round(f.per100.fat)} /100g</div>
            </div>
            <button aria-label="Borrar" style={delBtn} onClick={(e) => { e.stopPropagation(); if (window.confirm(`¿Borrar "${f.name}"?`)) deleteFood(f.id) }}><Trash2 size={16} /></button>
          </div>
        </GlassCard>
      ))}
      {list.length === 0 && <EmptyState icon={<Apple size={40} />} title="Sin alimentos todavía" hint="Pulsa + para crear el primero" />}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Crear alimento">
        <FoodForm submitLabel="Crear" onSave={(input) => { addFood(input); setCreateOpen(false) }} />
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Editar alimento">
        {editing && <FoodForm initial={editing} submitLabel="Guardar" onSave={(input) => { updateFood(editing.id, input); setEditing(null) }} />}
      </Sheet>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const delBtn: React.CSSProperties = { width: 40, height: 40, flex: 'none', borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

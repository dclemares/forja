import { useEffect, useState } from 'react'
import { ChevronRight, Plus, X } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { PillButton } from '@/components/ui/PillButton'
import { Stepper } from '@/components/ui/Stepper'
import { useStore } from '@/lib/store'
import { foodEntryMacros, sumMacros } from '@/lib/domain/nutrition'
import { formatNumber } from '@/lib/format'
import type { Meal, MealComponent } from '@/lib/types'

export function MealBuilder({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial?: Meal | null; onSave: (name: string, components: MealComponent[]) => void }) {
  const { state } = useStore()
  const foodsById = new Map(state.foods.map((f) => [f.id, f]))
  const [view, setView] = useState<'edit' | 'add'>('edit')
  const [name, setName] = useState('')
  const [components, setComponents] = useState<MealComponent[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setComponents(initial?.components ?? [])
      setView('edit')
      setQ('')
    }
  }, [open, initial])

  const total = sumMacros(components.map((c) => { const f = foodsById.get(c.foodId); return f ? foodEntryMacros(f, c.grams) : { kcal: 0, protein: 0, carbs: 0, fat: 0 } }))
  const addList = state.foods.filter((f) => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'Editar comida' : 'Nueva comida'}>
      {view === 'edit' ? (
        <div style={{ padding: '4px 2px 12px' }}>
          <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" autoFocus={!initial} placeholder="Nombre (p. ej. Batido post-entreno)" value={name} onChange={(e) => setName(e.target.value)} style={inp} />
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '14px 0 6px' }}>Ingredientes</div>
          {components.map((c, i) => {
            const f = foodsById.get(c.foodId)
            return (
              <div key={c.foodId + i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f?.name ?? 'Alimento'}</span>
                <div style={{ width: 118, flex: 'none' }}><Stepper kind="weight" step={10} value={c.grams} ariaLabel="gramos" onChange={(v) => setComponents((cs) => cs.map((x, j) => (j === i ? { ...x, grams: v } : x)))} /></div>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)', flex: 'none' }}>g</span>
                <button aria-label="Quitar" style={delBtn} onClick={() => setComponents((cs) => cs.filter((_, j) => j !== i))}><X size={15} /></button>
              </div>
            )
          })}
          {components.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-faint)', padding: '4px 2px' }}>Añade alimentos a la comida.</div>}
          <PillButton full variant="dashed" icon={<Plus size={16} />} style={{ marginTop: 6 }} onClick={() => setView('add')}>Añadir ingrediente</PillButton>

          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--accent-tint)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--ink-soft)', marginTop: 14 }}>
            <span><b style={{ color: 'var(--accent)', fontSize: 18 }}>{formatNumber(total.kcal)}</b> kcal</span>
            <span>P {Math.round(total.protein)}</span>
            <span>C {Math.round(total.carbs)}</span>
            <span>G {Math.round(total.fat)}</span>
          </div>
          <PillButton full size="lg" style={{ marginTop: 14 }} onClick={() => { if (name.trim() && components.length) { onSave(name.trim(), components); onClose() } }}>
            {initial ? 'Guardar' : 'Crear comida'}
          </PillButton>
        </div>
      ) : (
        <div style={{ paddingBottom: 8 }}>
          <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" autoFocus placeholder="Buscar alimento…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inp, marginBottom: 6 }} />
          {addList.map((f) => (
            <button key={f.id} style={rowBtn} onClick={() => { setComponents((cs) => [...cs, { foodId: f.id, grams: 100 }]); setView('edit'); setQ('') }}>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{f.name}{f.brand ? <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}> · {f.brand}</span> : null}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)' }}>{Math.round(f.per100.kcal)} kcal /100g</span>
              </span>
              <ChevronRight size={18} color="var(--ink-faint)" />
            </button>
          ))}
          {addList.length === 0 && <div style={{ color: 'var(--ink-faint)', fontSize: 14, padding: '12px 4px' }}>No hay alimentos. Créalos primero en “Alimentos”.</div>}
        </div>
      )}
    </Sheet>
  )
}

const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const rowBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }
const delBtn: React.CSSProperties = { width: 32, height: 32, flex: 'none', borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

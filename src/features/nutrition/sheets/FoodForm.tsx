import { useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import type { Food } from '@/lib/types'

type FoodInput = Omit<Food, 'id' | 'createdAt'>

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/** Formulario de alta/edición de alimento (valores por 100 g). Reutilizable. */
export function FoodForm({ initial, submitLabel = 'Guardar', onSave }: { initial?: Partial<Food>; submitLabel?: string; onSave: (food: FoodInput) => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [kcal, setKcal] = useState(initial?.per100 ? String(initial.per100.kcal) : '')
  const [protein, setProtein] = useState(initial?.per100 ? String(initial.per100.protein) : '')
  const [carbs, setCarbs] = useState(initial?.per100 ? String(initial.per100.carbs) : '')
  const [fat, setFat] = useState(initial?.per100 ? String(initial.per100.fat) : '')
  const [serving, setServing] = useState(initial?.serving ? String(initial.serving) : '')

  const save = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: initial?.barcode,
      per100: { kcal: num(kcal), protein: num(protein), carbs: num(carbs), fat: num(fat) },
      serving: num(serving) || undefined,
      servingLabel: initial?.servingLabel,
    })
  }

  return (
    <div style={{ padding: '4px 2px 12px' }}>
      <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" autoFocus placeholder="Nombre del alimento" value={name} onChange={(e) => setName(e.target.value)} style={inp} />
      <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" placeholder="Marca (opcional)" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ ...inp, marginTop: 10 }} />
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '14px 0 8px' }}>Por 100 g</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Calorías (kcal)" value={kcal} onChange={setKcal} />
        <Field label="Proteína (g)" value={protein} onChange={setProtein} />
        <Field label="Carbohidratos (g)" value={carbs} onChange={setCarbs} />
        <Field label="Grasa (g)" value={fat} onChange={setFat} />
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="Ración (g) · opcional, p. ej. 30 = 1 rebanada" value={serving} onChange={setServing} />
      </div>
      <PillButton full size="lg" style={{ marginTop: 16 }} onClick={save}>{submitLabel}</PillButton>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
      {label}
      <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, marginTop: 4 }} />
    </label>
  )
}

const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

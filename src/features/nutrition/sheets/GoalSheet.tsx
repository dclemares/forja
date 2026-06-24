import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { PillButton } from '@/components/ui/PillButton'
import { useStore } from '@/lib/store'

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function GoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setNutritionGoal } = useStore()
  const g = state.nutritionGoal
  const [kcal, setKcal] = useState(String(g.kcal))
  const [protein, setProtein] = useState(String(g.protein))
  const [carbs, setCarbs] = useState(String(g.carbs))
  const [fat, setFat] = useState(String(g.fat))

  const save = () => {
    setNutritionGoal({ kcal: num(kcal), protein: num(protein), carbs: num(carbs), fat: num(fat) })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Objetivo diario">
      <div style={{ padding: '4px 2px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Calorías (kcal)" value={kcal} onChange={setKcal} />
          <Field label="Proteína (g)" value={protein} onChange={setProtein} />
          <Field label="Carbohidratos (g)" value={carbs} onChange={setCarbs} />
          <Field label="Grasa (g)" value={fat} onChange={setFat} />
        </div>
        <PillButton full size="lg" style={{ marginTop: 16 }} onClick={save}>Guardar objetivo</PillButton>
      </div>
    </Sheet>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
      {label}
      <input autoComplete="off" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, marginTop: 4 }} />
    </label>
  )
}

const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

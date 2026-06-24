import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar } from '@/components/ui/AppBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Sheet'
import { mealGrams, mealMacros } from '@/lib/domain/nutrition'
import { formatNumber, todayISO } from '@/lib/format'
import { MEAL_SLOTS, type Meal, type MealSlot } from '@/lib/types'
import { MealBuilder } from './sheets/MealBuilder'

const slotLabel: Record<MealSlot, string> = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }

export function MealsScreen() {
  const { state, addMeal, updateMeal, deleteMeal, addDiaryEntry } = useStore()
  const navigate = useNavigate()
  const foodsById = new Map(state.foods.map((f) => [f.id, f]))
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Meal | null>(null)
  const [logMeal, setLogMeal] = useState<Meal | null>(null)

  const openEdit = (m: Meal) => { setEditing(m); setBuilderOpen(true) }
  const openCreate = () => { setEditing(null); setBuilderOpen(true) }

  const log = (meal: Meal, slot: MealSlot) => {
    addDiaryEntry({ date: todayISO(), slot, label: meal.name, grams: mealGrams(meal), macros: mealMacros(meal, foodsById), source: 'meal', refId: meal.id })
    setLogMeal(null)
    navigate('/nutrition')
  }

  return (
    <div className="anim-fade">
      <AppBar back onBack={() => navigate('/nutrition')} title="Comidas" right={<PillButton icon={<Plus size={16} />} onClick={openCreate} aria-label="Crear comida" />} />

      {state.meals.map((m) => {
        const total = mealMacros(m, foodsById)
        return (
          <GlassCard key={m.id} style={{ padding: 14, marginBottom: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{m.components.length} ingredientes · {formatNumber(total.kcal)} kcal · P{Math.round(total.protein)} C{Math.round(total.carbs)} G{Math.round(total.fat)}</div>
              </div>
              <button aria-label="Editar" style={iconRound} onClick={() => openEdit(m)}><Pencil size={16} /></button>
              <button aria-label="Borrar" style={iconRound} onClick={() => { if (window.confirm(`¿Borrar la comida "${m.name}"?`)) deleteMeal(m.id) }}><Trash2 size={16} /></button>
            </div>
            <PillButton full variant="tonal" icon={<CalendarPlus size={16} />} style={{ marginTop: 12 }} onClick={() => setLogMeal(m)}>Registrar en el diario</PillButton>
          </GlassCard>
        )
      })}
      {state.meals.length === 0 && <EmptyState icon={<UtensilsCrossed size={40} />} title="Sin comidas todavía" hint="Crea una receta sumando alimentos con +" />}

      <MealBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        initial={editing}
        onSave={(name, components) => { if (editing) updateMeal(editing.id, { name, components }); else addMeal(name, components) }}
      />

      <Sheet open={logMeal !== null} onClose={() => setLogMeal(null)} title={logMeal ? `Registrar “${logMeal.name}”` : ''}>
        <div style={{ paddingBottom: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', padding: '2px 4px 8px' }}>¿En qué comida de hoy?</div>
          {MEAL_SLOTS.map((slot) => (
            <button key={slot} style={rowBtn} onClick={() => logMeal && log(logMeal, slot)}>{slotLabel[slot]}</button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

const iconRound: React.CSSProperties = { width: 38, height: 38, flex: 'none', borderRadius: 999, border: '2px solid #9A6A3A', background: 'linear-gradient(180deg,#F3E3BE,#E6CF9E)', color: '#6E4423', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const rowBtn: React.CSSProperties = { display: 'block', width: '100%', padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)', textAlign: 'left' }

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Dumbbell, Plus, Settings2, TrendingUp, UtensilsCrossed, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar, iconBtn } from '@/components/ui/AppBar'
import { MacroRing, MacroBar } from '@/components/charts/MacroRing'
import { dailyTotals } from '@/lib/domain/nutrition'
import { formatLongDate, formatNumber, todayISO } from '@/lib/format'
import { MEAL_SLOTS, type MealSlot } from '@/lib/types'
import { AddEntrySheet } from './sheets/AddEntrySheet'
import { GoalSheet } from './sheets/GoalSheet'

const slotLabel: Record<MealSlot, string> = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }

const shiftISO = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function NutritionScreen() {
  const { state, deleteDiaryEntry } = useStore()
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [addSlot, setAddSlot] = useState<MealSlot | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)

  const goal = state.nutritionGoal
  const totals = dailyTotals(state.diary, date)
  const dayEntries = state.diary.filter((e) => e.date === date)
  const isToday = date === todayISO()

  return (
    <div className="anim-rise">
      <AppBar title="Nutrición" large right={
        <div style={{ display: 'flex', gap: 2 }}>
          <button aria-label="Progreso nutricional" style={iconBtn} onClick={() => navigate('/nutrition/progress')}><TrendingUp size={20} /></button>
          <button aria-label="Objetivo" style={iconBtn} onClick={() => setGoalOpen(true)}><Settings2 size={20} /></button>
        </div>
      } />

      <div style={dateRow}>
        <button aria-label="Día anterior" style={navBtn} onClick={() => setDate((d) => shiftISO(d, -1))}><ChevronLeft size={20} /></button>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{isToday ? 'Hoy' : formatLongDate(date)}</div>
        <button aria-label="Día siguiente" style={navBtn} disabled={isToday} onClick={() => setDate((d) => shiftISO(d, 1))}><ChevronRight size={20} color={isToday ? 'var(--ink-faint)' : undefined} /></button>
      </div>

      <GlassCard style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 'none' }}><MacroRing value={totals.kcal} goal={goal.kcal} size={132} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
          <MacroBar label="Proteína" kind="protein" value={totals.protein} goal={goal.protein} />
          <MacroBar label="Carbos" kind="carbs" value={totals.carbs} goal={goal.carbs} />
          <MacroBar label="Grasa" kind="fat" value={totals.fat} goal={goal.fat} />
        </div>
      </GlassCard>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <PillButton variant="ghost" style={{ flex: 1 }} icon={<Dumbbell size={15} />} onClick={() => navigate('/nutrition/foods')}>Alimentos</PillButton>
        <PillButton variant="ghost" style={{ flex: 1 }} icon={<UtensilsCrossed size={15} />} onClick={() => navigate('/nutrition/meals')}>Comidas</PillButton>
      </div>

      {MEAL_SLOTS.map((slot) => {
        const entries = dayEntries.filter((e) => e.slot === slot)
        const kcal = entries.reduce((a, e) => a + e.macros.kcal, 0)
        return (
          <GlassCard flat key={slot} style={{ padding: 14, marginBottom: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: entries.length ? 10 : 0, paddingBottom: 8, borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontWeight: 700 }}>{slotLabel[slot]}{kcal > 0 && <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 13 }}> · {formatNumber(kcal)} kcal</span>}</span>
              <button aria-label={`Añadir a ${slotLabel[slot]}`} className="gold-shine" style={addBtn} onClick={() => setAddSlot(slot)}><Plus size={16} /></button>
            </div>
            {entries.map((e) => (
              <div key={e.id} style={entryRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{e.grams ? `${Math.round(e.grams)} g · ` : ''}P {Math.round(e.macros.protein)} · C {Math.round(e.macros.carbs)} · G {Math.round(e.macros.fat)}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14, flex: 'none' }}>{formatNumber(e.macros.kcal)}</div>
                <button aria-label="Borrar" style={delBtn} onClick={() => deleteDiaryEntry(e.id)}><X size={15} /></button>
              </div>
            ))}
            {entries.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-faint)', paddingTop: 8 }}>Nada todavía.</div>}
          </GlassCard>
        )
      })}

      <AddEntrySheet open={addSlot !== null} onClose={() => setAddSlot(null)} slot={addSlot ?? 'comida'} date={date} />
      <GoalSheet open={goalOpen} onClose={() => setGoalOpen(false)} />
    </div>
  )
}

const dateRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', marginBottom: 12 }
const navBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
const addBtn: React.CSSProperties = { width: 30, height: 30, flex: 'none', borderRadius: 999, border: '2px solid #7A4A12', background: 'linear-gradient(180deg,#FFD75C,#EDA31E)', color: '#4A2E10', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,245,210,.7), 0 2px 0 #A66A18' }
const entryRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }
const delBtn: React.CSSProperties = { width: 32, height: 32, flex: 'none', borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

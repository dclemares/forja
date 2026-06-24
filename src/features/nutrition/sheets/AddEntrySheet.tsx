import { useEffect, useRef, useState } from 'react'
import { Camera, ChevronRight, Globe, Plus, ScanBarcode, Search, Zap } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { PillButton } from '@/components/ui/PillButton'
import { Stepper } from '@/components/ui/Stepper'
import { BarcodeScanner } from '@/components/ui/BarcodeScanner'
import { useStore } from '@/lib/store'
import { foodEntryMacros } from '@/lib/domain/nutrition'
import { formatNumber } from '@/lib/format'
import { barcodeScanSupported, lookupBarcode, searchFoods, type OffFood } from '@/lib/offClient'
import { aiPhotoEnabled } from '@/lib/aiEstimate'
import type { Food, MealSlot } from '@/lib/types'
import { FoodForm } from './FoodForm'
import { PhotoEstimate } from './PhotoEstimate'

type View = 'menu' | 'quick' | 'pickFood' | 'createFood' | 'grams' | 'search' | 'scan' | 'notFound' | 'photo'

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const slotLabel: Record<MealSlot, string> = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }

export function AddEntrySheet({ open, onClose, slot, date }: { open: boolean; onClose: () => void; slot: MealSlot; date: string }) {
  const { state, addFood, addDiaryEntry } = useStore()
  const [view, setView] = useState<View>('menu')
  const [food, setFood] = useState<Food | null>(null)
  const [scanCode, setScanCode] = useState<string | undefined>(undefined)
  const canScan = barcodeScanSupported()

  useEffect(() => {
    if (open) {
      setView('menu')
      setFood(null)
      setScanCode(undefined)
    }
  }, [open])

  const pick = (f: Food) => { setFood(f); setView('grams') }

  /** Reutiliza el alimento si ya existe por barcode; si no, lo guarda en la biblioteca. */
  const ensureFood = (off: OffFood): Food => {
    const existing = off.code ? state.foods.find((f) => f.barcode === off.code) : undefined
    return existing ?? addFood({ name: off.name, brand: off.brand, per100: off.per100, barcode: off.code })
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Añadir · ${slotLabel[slot]}`}>
      {view === 'menu' && (
        <div style={{ paddingBottom: 8 }}>
          <MenuRow icon={<Zap size={19} />} title="Ración rápida" subtitle="Solo calorías (y macros opcionales)" onClick={() => setView('quick')} />
          {aiPhotoEnabled() && <MenuRow icon={<Camera size={19} />} title="Foto (IA)" subtitle="Estima por foto cuando comes fuera" onClick={() => setView('photo')} />}
          {canScan && <MenuRow icon={<ScanBarcode size={19} />} title="Escanear código" subtitle="Lee el código de barras del producto" onClick={() => setView('scan')} />}
          <MenuRow icon={<Globe size={19} />} title="Buscar online" subtitle="Base de datos Open Food Facts" onClick={() => setView('search')} />
          <MenuRow icon={<Search size={19} />} title="Mis alimentos" subtitle={`${state.foods.length} guardados`} onClick={() => setView('pickFood')} />
          <MenuRow icon={<Plus size={19} />} title="Crear alimento" subtitle="Alta manual por 100 g" onClick={() => setView('createFood')} />
        </div>
      )}

      {view === 'quick' && (
        <QuickForm
          onSave={(label, macros) => { addDiaryEntry({ date, slot, label, macros, source: 'quick' }); onClose() }}
        />
      )}

      {view === 'search' && (
        <OnlineSearch onPick={(off) => pick(ensureFood(off))} />
      )}

      {view === 'photo' && (
        <PhotoEstimate onSave={(label, macros) => { addDiaryEntry({ date, slot, label, macros, source: 'photo' }); onClose() }} />
      )}

      {view === 'scan' && (
        <BarcodeScanner
          onClose={() => setView('menu')}
          onDetect={async (code) => {
            const off = await lookupBarcode(code)
            if (off) pick(ensureFood(off))
            else { setScanCode(code); setView('notFound') }
          }}
        />
      )}

      {view === 'notFound' && (
        <div style={{ padding: '8px 2px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, color: 'var(--ink-soft)' }}>No encontramos el código <b style={{ color: 'var(--ink)' }}>{scanCode}</b> en la base de datos.</div>
          <PillButton full size="lg" icon={<Plus size={16} />} style={{ marginTop: 16 }} onClick={() => setView('createFood')}>Crear el alimento a mano</PillButton>
        </div>
      )}

      {view === 'pickFood' && (
        <FoodPicker foods={state.foods} onPick={pick} onCreate={() => setView('createFood')} />
      )}

      {view === 'createFood' && (
        <FoodForm initial={scanCode ? { barcode: scanCode } : undefined} submitLabel="Crear y usar" onSave={(input) => { const f = addFood(input); pick(f) }} />
      )}

      {view === 'grams' && food && (
        <GramsStep food={food} onAdd={(grams) => {
          addDiaryEntry({ date, slot, label: food.brand ? `${food.name} · ${food.brand}` : food.name, grams, macros: foodEntryMacros(food, grams), source: 'food', refId: food.id })
          onClose()
        }} />
      )}
    </Sheet>
  )
}

function OnlineSearch({ onPick }: { onPick: (off: OffFood) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<OffFood[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const r = await searchFoods(q)
      setResults(r)
      setLoading(false)
    }, 450)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [q])

  return (
    <div style={{ paddingBottom: 8 }}>
      <input autoFocus placeholder="Buscar producto (p. ej. yogur griego)…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inp, marginBottom: 6 }} />
      {loading && <div style={{ color: 'var(--ink-faint)', fontSize: 14, padding: '12px 4px' }}>Buscando…</div>}
      {!loading && results.map((f, i) => (
        <button key={(f.code ?? '') + i} style={rowBtn} onClick={() => onPick(f)}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}{f.brand ? <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}> · {f.brand}</span> : null}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)' }}>{Math.round(f.per100.kcal)} kcal · P{Math.round(f.per100.protein)} C{Math.round(f.per100.carbs)} G{Math.round(f.per100.fat)} /100g</span>
          </span>
          <ChevronRight size={18} color="var(--ink-faint)" />
        </button>
      ))}
      {!loading && q.trim().length >= 2 && results.length === 0 && <div style={{ color: 'var(--ink-faint)', fontSize: 14, padding: '12px 4px' }}>Sin resultados.</div>}
    </div>
  )
}

function MenuRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button style={rowBtn} onClick={onClick}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontWeight: 700 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)' }}>{subtitle}</span>
      </span>
      <ChevronRight size={18} color="var(--ink-faint)" />
    </button>
  )
}

function QuickForm({ onSave }: { onSave: (label: string, macros: { kcal: number; protein: number; carbs: number; fat: number }) => void }) {
  const [label, setLabel] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  return (
    <div style={{ padding: '4px 2px 12px' }}>
      <input autoFocus placeholder="Qué comiste (p. ej. menú del día)" value={label} onChange={(e) => setLabel(e.target.value)} style={inp} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <Field label="Calorías (kcal)" value={kcal} onChange={setKcal} />
        <Field label="Proteína (g) · opc." value={protein} onChange={setProtein} />
        <Field label="Carbos (g) · opc." value={carbs} onChange={setCarbs} />
        <Field label="Grasa (g) · opc." value={fat} onChange={setFat} />
      </div>
      <PillButton full size="lg" style={{ marginTop: 16 }} onClick={() => { if (!label.trim() && !num(kcal)) return; onSave(label.trim() || 'Estimación rápida', { kcal: num(kcal), protein: num(protein), carbs: num(carbs), fat: num(fat) }) }}>
        Añadir
      </PillButton>
    </div>
  )
}

function FoodPicker({ foods, onPick, onCreate }: { foods: Food[]; onPick: (f: Food) => void; onCreate: () => void }) {
  const [q, setQ] = useState('')
  const list = foods.filter((f) => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div style={{ paddingBottom: 8 }}>
      <input autoFocus placeholder="Buscar en tus alimentos…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inp, marginBottom: 6 }} />
      {list.map((f) => (
        <button key={f.id} style={rowBtn} onClick={() => onPick(f)}>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontWeight: 600 }}>{f.name}{f.brand ? <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}> · {f.brand}</span> : null}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)' }}>{Math.round(f.per100.kcal)} kcal · P{Math.round(f.per100.protein)} C{Math.round(f.per100.carbs)} G{Math.round(f.per100.fat)} /100g</span>
          </span>
          <ChevronRight size={18} color="var(--ink-faint)" />
        </button>
      ))}
      {list.length === 0 && <div style={{ color: 'var(--ink-faint)', fontSize: 14, padding: '12px 4px' }}>Sin resultados.</div>}
      <PillButton full variant="dashed" icon={<Plus size={16} />} style={{ marginTop: 8 }} onClick={onCreate}>Crear alimento nuevo</PillButton>
    </div>
  )
}

function GramsStep({ food, onAdd }: { food: Food; onAdd: (grams: number) => void }) {
  const [grams, setGrams] = useState(100)
  const macros = foodEntryMacros(food, grams)
  return (
    <div style={{ padding: '4px 2px 12px' }}>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{food.name}</div>
      {food.brand && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{food.brand}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)', flex: 'none' }}>Cantidad (g)</span>
        <div style={{ flex: 1 }}><Stepper kind="weight" step={10} value={grams} ariaLabel="gramos" onChange={(v) => setGrams(v)} /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--accent-tint)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--ink-soft)' }}>
        <span><b style={{ color: 'var(--accent)', fontSize: 18 }}>{formatNumber(macros.kcal)}</b> kcal</span>
        <span>P {Math.round(macros.protein)}</span>
        <span>C {Math.round(macros.carbs)}</span>
        <span>G {Math.round(macros.fat)}</span>
      </div>
      <PillButton full size="lg" icon={<Plus size={18} />} style={{ marginTop: 16 }} onClick={() => onAdd(grams)}>Añadir al diario</PillButton>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
      {label}
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, marginTop: 4 }} />
    </label>
  )
}

const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const rowBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }

import { useRef, useState } from 'react'
import { Camera, Plus, Sparkles } from 'lucide-react'
import { PillButton } from '@/components/ui/PillButton'
import { estimateMeal, fileToScaledBase64, type MealEstimate, type MealItem } from '@/lib/aiEstimate'
import type { Macros } from '@/lib/types'

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const providerLabel = (p: string): string => (p === 'groq' ? 'Groq' : p === 'gemini' ? 'Gemini' : p)

type Phase = 'input' | 'loading' | 'result' | 'error'

export function PhotoEstimate({ onSave }: { onSave: (label: string, macros: Macros, grams: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('input')
  const [preview, setPreview] = useState('')
  const [payload, setPayload] = useState<{ data: string; mediaType: string } | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [items, setItems] = useState<MealItem[]>([])
  const [gramsEd, setGramsEd] = useState<string[]>([]) // gramos editables por ingrediente
  const [est, setEst] = useState<{ provider: string; description: string; reasoning: string; label: string; grams: string; kcal: string; protein: string; carbs: string; fat: string; confidence: string }>({ provider: '', description: '', reasoning: '', label: '', grams: '', kcal: '', protein: '', carbs: '', fat: '', confidence: '' })

  // Macros de un ingrediente escaladas a los gramos editados (regla de tres sobre lo estimado).
  const itemFactor = (i: number): number => {
    const base = items[i]?.grams || 0
    return base > 0 ? num(gramsEd[i] ?? '') / base : 0
  }
  const itemMacro = (i: number, key: 'kcal' | 'protein' | 'carbs' | 'fat'): number => (items[i]?.[key] ?? 0) * itemFactor(i)
  const totals = items.reduce(
    (acc, _it, i) => ({
      grams: acc.grams + num(gramsEd[i] ?? ''),
      kcal: acc.kcal + itemMacro(i, 'kcal'),
      protein: acc.protein + itemMacro(i, 'protein'),
      carbs: acc.carbs + itemMacro(i, 'carbs'),
      fat: acc.fat + itemMacro(i, 'fat'),
    }),
    { grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const setGramAt = (i: number, v: string) => setGramsEd((arr) => arr.map((g, j) => (j === i ? v : g)))

  const onFile = async (file: File) => {
    const scaled = await fileToScaledBase64(file)
    setPreview(scaled.previewUrl)
    setPayload({ data: scaled.data, mediaType: scaled.mediaType })
  }

  const run = async () => {
    if (!payload) return
    setPhase('loading')
    try {
      const r: MealEstimate = await estimateMeal({ imageBase64: payload.data, mediaType: payload.mediaType, note })
      setItems(r.items ?? [])
      setGramsEd((r.items ?? []).map((it) => String(Math.round(it.grams))))
      setEst({ provider: r.provider, description: r.description, reasoning: r.reasoning, label: r.label, grams: String(Math.round(r.grams)), kcal: String(Math.round(r.kcal)), protein: String(Math.round(r.protein)), carbs: String(Math.round(r.carbs)), fat: String(Math.round(r.fat)), confidence: r.confidence })
      setPhase('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo estimar')
      setPhase('error')
    }
  }

  return (
    <div style={{ padding: '4px 2px 12px' }}>
      <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />

      {(phase === 'input' || phase === 'error') && (
        <>
          <button type="button" onClick={() => fileRef.current?.click()} style={dropZone}>
            {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-soft)' }}><Camera size={30} /> Toca para hacer/elegir una foto</span>}
          </button>
          <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" placeholder="¿Qué lleva? Y si hay algo de referencia (moneda, mando…), dilo" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inp, marginTop: 10 }} />
          {phase === 'error' && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <PillButton full size="lg" icon={<Sparkles size={18} />} style={{ marginTop: 14, opacity: payload ? 1 : 0.5 }} disabled={!payload} onClick={run}>Estimar con IA</PillButton>
        </>
      )}

      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--ink-soft)' }}>
          {preview && <img src={preview} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, marginBottom: 14 }} />}
          <div style={{ fontWeight: 700 }}>Analizando la foto…</div>
        </div>
      )}

      {phase === 'result' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {preview && <img src={preview} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, flex: 'none' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" value={est.label} onChange={(e) => setEst((s) => ({ ...s, label: e.target.value }))} style={{ ...inp, fontWeight: 700 }} />
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>Estimación IA{est.provider ? ` · vía ${providerLabel(est.provider)}` : ''} · confianza {est.confidence || '—'}</div>
            </div>
          </div>
          {est.description && (
            <div style={reasoningBox}>
              <div style={reasoningTitle}>👀 Lo que ve</div>
              {est.description}
            </div>
          )}
          {est.reasoning && (
            <div style={reasoningBox}>
              <div style={reasoningTitle}>⚖️ Cómo calcula los pesos</div>
              {est.reasoning}
            </div>
          )}
          {items.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <div style={reasoningTitle}>Ingredientes · edita los gramos de cada uno</div>
              {items.map((it, i) => (
                <div key={i} style={itemRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" inputMode="decimal" value={gramsEd[i] ?? ''} onChange={(e) => setGramAt(i, e.target.value)} style={gramsInput} />
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)', flex: 'none' }}>g</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14, flex: 'none', minWidth: 56, textAlign: 'right' }}>{Math.round(itemMacro(i, 'kcal'))} kcal</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>P{Math.round(itemMacro(i, 'protein'))} · C{Math.round(itemMacro(i, 'carbs'))} · G{Math.round(itemMacro(i, 'fat'))}</div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '10px 2px 0' }}>
                <span style={{ flex: 1, fontWeight: 800 }}>Total</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>{Math.round(totals.grams)} g</span>
                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16, minWidth: 64, textAlign: 'right' }}>{Math.round(totals.kcal)} kcal</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'right', marginTop: 2 }}>P{Math.round(totals.protein)} · C{Math.round(totals.carbs)} · G{Math.round(totals.fat)}</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <Field label="Cantidad total estimada (g)" value={est.grams} onChange={(v) => setEst((s) => ({ ...s, grams: v }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Calorías (kcal)" value={est.kcal} onChange={(v) => setEst((s) => ({ ...s, kcal: v }))} />
                <Field label="Proteína (g)" value={est.protein} onChange={(v) => setEst((s) => ({ ...s, protein: v }))} />
                <Field label="Carbohidratos (g)" value={est.carbs} onChange={(v) => setEst((s) => ({ ...s, carbs: v }))} />
                <Field label="Grasa (g)" value={est.fat} onChange={(v) => setEst((s) => ({ ...s, fat: v }))} />
              </div>
            </>
          )}
          <PillButton full size="lg" icon={<Plus size={18} />} style={{ marginTop: 16 }} onClick={() => {
            const label = est.label.trim() || 'Comida (foto)'
            if (items.length > 0) onSave(label, { kcal: Math.round(totals.kcal), protein: Math.round(totals.protein), carbs: Math.round(totals.carbs), fat: Math.round(totals.fat) }, Math.round(totals.grams))
            else onSave(label, { kcal: num(est.kcal), protein: num(est.protein), carbs: num(est.carbs), fat: num(est.fat) }, num(est.grams))
          }}>Añadir al diario</PillButton>
        </>
      )}
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

const reasoningBox: React.CSSProperties = { background: 'var(--accent-tint)', border: '1.5px solid rgba(120,80,30,.2)', borderRadius: 12, padding: '10px 13px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.45, marginBottom: 12 }
const reasoningTitle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: 'var(--accent)', marginBottom: 4, letterSpacing: '.02em' }
const itemRow: React.CSSProperties = { padding: '8px 2px', borderBottom: '1px solid var(--hairline)' }
const gramsInput: React.CSSProperties = { width: 66, flex: 'none', textAlign: 'center', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 9, padding: '6px 4px', color: 'var(--ink)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 1px 3px rgba(80,50,20,.2)' }
const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const dropZone: React.CSSProperties = { width: '100%', height: 180, borderRadius: 14, border: '2px dashed #9A6A3A', background: 'rgba(120,80,30,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: 14, overflow: 'hidden', padding: 0 }

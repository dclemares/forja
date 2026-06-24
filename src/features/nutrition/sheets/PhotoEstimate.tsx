import { useRef, useState } from 'react'
import { Camera, Plus, Sparkles } from 'lucide-react'
import { PillButton } from '@/components/ui/PillButton'
import { estimateMeal, fileToScaledBase64, type MealEstimate } from '@/lib/aiEstimate'
import type { Macros } from '@/lib/types'

const num = (s: string): number => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

type Phase = 'input' | 'loading' | 'result' | 'error'

export function PhotoEstimate({ onSave }: { onSave: (label: string, macros: Macros) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('input')
  const [preview, setPreview] = useState('')
  const [payload, setPayload] = useState<{ data: string; mediaType: string } | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [est, setEst] = useState<{ label: string; kcal: string; protein: string; carbs: string; fat: string; confidence: string }>({ label: '', kcal: '', protein: '', carbs: '', fat: '', confidence: '' })

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
      setEst({ label: r.label, kcal: String(Math.round(r.kcal)), protein: String(Math.round(r.protein)), carbs: String(Math.round(r.carbs)), fat: String(Math.round(r.fat)), confidence: r.confidence })
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
          <input autoComplete="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true" placeholder="¿Qué lleva? (p. ej. paella grande, ración generosa)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inp, marginTop: 10 }} />
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
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>Estimación IA · confianza {est.confidence || '—'} · ajústala si hace falta</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Calorías (kcal)" value={est.kcal} onChange={(v) => setEst((s) => ({ ...s, kcal: v }))} />
            <Field label="Proteína (g)" value={est.protein} onChange={(v) => setEst((s) => ({ ...s, protein: v }))} />
            <Field label="Carbohidratos (g)" value={est.carbs} onChange={(v) => setEst((s) => ({ ...s, carbs: v }))} />
            <Field label="Grasa (g)" value={est.fat} onChange={(v) => setEst((s) => ({ ...s, fat: v }))} />
          </div>
          <PillButton full size="lg" icon={<Plus size={18} />} style={{ marginTop: 16 }} onClick={() => onSave(est.label.trim() || 'Comida (foto)', { kcal: num(est.kcal), protein: num(est.protein), carbs: num(est.carbs), fat: num(est.fat) })}>Añadir al diario</PillButton>
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

const inp: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '11px 12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const dropZone: React.CSSProperties = { width: '100%', height: 180, borderRadius: 14, border: '2px dashed #9A6A3A', background: 'rgba(120,80,30,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: 14, overflow: 'hidden', padding: 0 }

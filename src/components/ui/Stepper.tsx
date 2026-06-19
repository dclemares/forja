import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatWeight } from '@/lib/format'

interface StepperProps {
  value: number
  onChange: (n: number) => void
  step?: number
  kind?: 'weight' | 'reps'
  ariaLabel?: string
}

/** Número editable (toca y escribe) + botones +/−. Pensado para registro rápido. */
export function Stepper({ value, onChange, step = 1, kind = 'reps', ariaLabel }: StepperProps) {
  const display = kind === 'weight' ? formatWeight(value) : String(value)
  const [text, setText] = useState(display)

  useEffect(() => {
    setText(kind === 'weight' ? formatWeight(value) : String(value))
  }, [value, kind])

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'))
    onChange(Number.isFinite(n) && n >= 0 ? n : 0)
  }

  const bump = (delta: number) => {
    const n = Math.max(0, Math.round((value + delta) * 100) / 100)
    onChange(n)
  }

  return (
    <div style={wrap}>
      <button type="button" style={btn} aria-label="restar" onClick={() => bump(-step)}>
        <Minus size={17} strokeWidth={2.5} />
      </button>
      <input
        style={input}
        inputMode="decimal"
        value={text}
        aria-label={ariaLabel}
        onChange={(e) => {
          setText(e.target.value)
          commit(e.target.value)
        }}
        onBlur={() => setText(kind === 'weight' ? formatWeight(value) : String(value))}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button type="button" style={btn} aria-label="sumar" onClick={() => bump(step)}>
        <Plus size={17} strokeWidth={2.5} />
      </button>
    </div>
  )
}

const wrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  background: 'rgba(255,255,255,.6)',
  border: '1px solid rgba(20,22,26,.1)',
  borderRadius: 16,
  padding: 4,
}
const btn: React.CSSProperties = {
  width: 34,
  height: 34,
  flex: 'none',
  borderRadius: 12,
  border: 'none',
  background: '#fff',
  color: 'var(--accent)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,.12)',
}
const input: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  width: '100%',
  textAlign: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: 17,
  fontWeight: 600,
  fontFamily: 'inherit',
  padding: 0,
  outline: 'none',
}

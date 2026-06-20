import { useEffect, useRef, useState } from 'react'
import { Timer, X } from 'lucide-react'
import { getRestDuration, setRestDuration, REST_PRESETS } from '@/lib/prefs'
import { playRestDone, playClick } from '@/lib/sound'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Cronómetro de descanso opcional. Auto-arranca al cambiar `trigger` (p.ej. al añadir serie). */
export function RestTimer({ trigger }: { trigger?: number }) {
  const [dur, setDur] = useState(getRestDuration())
  const [left, setLeft] = useState(0)
  const running = left > 0
  const prevTrigger = useRef(trigger)
  const prevLeft = useRef(0)

  // Auto-arranque al añadir una serie (solo si hay descanso configurado).
  useEffect(() => {
    if (trigger !== undefined && trigger !== prevTrigger.current) {
      prevTrigger.current = trigger
      if (dur > 0) setLeft(dur)
    }
  }, [trigger, dur])

  // Cuenta atrás.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  // Aviso al llegar a 0.
  useEffect(() => {
    if (prevLeft.current > 0 && left === 0) {
      playRestDone()
      try {
        navigator.vibrate?.([120, 60, 120])
      } catch {
        /* ignore */
      }
    }
    prevLeft.current = left
  }, [left])

  const pick = (s: number) => {
    setDur(s)
    setRestDuration(s)
    playClick()
    if (s === 0) setLeft(0)
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Timer size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>Descanso</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {REST_PRESETS.map((s) => (
            <button key={s} type="button" onClick={() => pick(s)} style={chip(dur === s)}>
              {s === 0 ? 'Off' : fmt(s)}
            </button>
          ))}
        </div>
      </div>
      {dur > 0 && (
        <div style={{ marginTop: 10 }}>
          {running ? (
            <button type="button" onClick={() => { setLeft(0); playClick() }} style={runBtn}>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 800, letterSpacing: '0.5px' }}>{fmt(left)}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700 }}>
                <X size={15} /> Saltar
              </span>
              <span style={{ position: 'absolute', left: 0, bottom: 0, height: 4, background: 'rgba(74,46,22,.5)', width: `${(left / dur) * 100}%`, transition: 'width 1s linear', borderRadius: '0 3px 0 0' }} />
            </button>
          ) : (
            <button type="button" onClick={() => { setLeft(dur); playClick() }} style={startBtn}>
              Descansar {fmt(dur)}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'linear-gradient(180deg,#F4E3BE,#E7D0A0)',
  border: '2.5px solid #8A5A2A',
  borderRadius: 14,
  padding: 13,
  marginBottom: 14,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), 0 3px 0 #6E4423',
}
const chip = (active: boolean): React.CSSProperties => ({
  border: '2px solid #7A4A12',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 800,
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: active ? '#4A2E10' : '#6E4423',
  background: active ? 'linear-gradient(180deg,#FFD75C,#EDA31E)' : 'linear-gradient(180deg,#F0E2C0,#E3CE9E)',
  boxShadow: active ? 'inset 0 1px 0 rgba(255,245,210,.7)' : 'none',
})
const startBtn: React.CSSProperties = {
  width: '100%',
  border: '2px solid #7A4A12',
  borderRadius: 12,
  padding: '11px',
  fontSize: 15,
  fontWeight: 800,
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: '#4A2E10',
  background: 'linear-gradient(180deg, rgba(255,255,255,.42), rgba(255,255,255,0) 48%), linear-gradient(180deg,#FFD75C,#EDA31E)',
  boxShadow: 'inset 0 1px 0 rgba(255,245,210,.7), 0 3px 0 #A66A18',
}
const runBtn: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  border: '2px solid #7A4A12',
  borderRadius: 12,
  padding: '9px 14px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: '#4A2E10',
  background: 'linear-gradient(180deg,#F7E8C6,#EAD3A2)',
  boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

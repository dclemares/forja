import { useRegisterSW } from 'virtual:pwa-register/react'

/** Aviso discreto cuando hay una versión nueva del PWA en caché. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div style={toast} role="status" className="anim-pop">
      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--cream)' }}>Nueva versión disponible</span>
      <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
        <button type="button" onClick={() => setNeedRefresh(false)} style={ghost}>Ahora no</button>
        <button type="button" onClick={() => void updateServiceWorker(true)} style={gold}>Actualizar</button>
      </div>
    </div>
  )
}

const toast: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
  transform: 'translateX(-50%)',
  zIndex: 80,
  width: 'min(440px, calc(100% - 28px))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 16,
  background: 'linear-gradient(180deg,#A06A35,#7E5026)',
  border: '3px solid #4A2E16',
  boxShadow: 'inset 0 2px 0 rgba(255,210,140,.35), 0 6px 0 #34200E, 0 10px 18px rgba(20,12,4,.45)',
}
const gold: React.CSSProperties = {
  border: '2px solid #7A4A12',
  borderRadius: 999,
  padding: '6px 14px',
  fontWeight: 800,
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: '#4A2E10',
  background: 'linear-gradient(180deg,#FFD75C,#EDA31E)',
  boxShadow: 'inset 0 1px 0 rgba(255,245,210,.7)',
}
const ghost: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--cream)',
  fontWeight: 700,
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
  padding: '6px 4px',
  opacity: 0.85,
}

import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface AppBarProps {
  title: ReactNode
  subtitle?: ReactNode
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  large?: boolean
}

export function AppBar({ title, subtitle, back, onBack, right, large = false }: AppBarProps) {
  const navigate = useNavigate()
  return (
    <header style={{ margin: '6px 2px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {back && (
            <button
              aria-label="Volver"
              onClick={() => (onBack ? onBack() : navigate(-1))}
              style={iconBtn}
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <h1 style={large ? titlePlaque : titlePlaqueSmall}>
            {title}
          </h1>
        </div>
        {right && <div style={{ flex: 'none' }}>{right}</div>}
      </div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 5, paddingLeft: back ? 48 : 2 }}>{subtitle}</div>}
    </header>
  )
}

/** Cartel de madera para títulos principales (estilo banner de juego). */
export const titlePlaque: React.CSSProperties = {
  display: 'inline-block',
  margin: 0,
  background: 'linear-gradient(180deg,#A06A35,#7E5026)',
  border: '3px solid #4A2E16',
  borderRadius: 14,
  padding: '5px 18px 7px',
  color: '#FBEFD3',
  fontSize: 23,
  fontWeight: 800,
  letterSpacing: '0.4px',
  lineHeight: 1.15,
  boxShadow:
    'inset 0 2px 0 rgba(255,210,140,.45), inset 0 0 0 4px rgba(201,134,31,.5), 0 4px 0 #34200E, 0 7px 10px rgba(20,12,4,.4)',
  textShadow: '0 2px 0 rgba(40,24,10,.55)',
}

/** Placa de madera compacta para títulos de pantallas de detalle (no quedan sobre el fondo). */
export const titlePlaqueSmall: React.CSSProperties = {
  display: 'inline-block',
  margin: 0,
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  background: 'linear-gradient(180deg,#A06A35,#7E5026)',
  border: '2.5px solid #4A2E16',
  borderRadius: 11,
  padding: '4px 13px 5px',
  color: '#FBEFD3',
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: '0.2px',
  lineHeight: 1.2,
  boxShadow: 'inset 0 1px 0 rgba(255,210,140,.4), 0 3px 0 #34200E, 0 5px 8px rgba(20,12,4,.3)',
  textShadow: '0 1px 0 rgba(40,24,10,.5)',
}

export const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  flex: 'none',
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  color: 'var(--ink)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

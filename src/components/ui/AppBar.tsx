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
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '6px 2px 16px' }}>
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
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: large ? 26 : 19, fontWeight: 600, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
            {title}
          </h1>
          {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ flex: 'none' }}>{right}</div>}
    </header>
  )
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

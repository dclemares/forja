import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Dumbbell, History, ClipboardList, Play } from 'lucide-react'
import type { ReactNode } from 'react'

const tabs: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/sessions', label: 'Sesiones', icon: <ClipboardList size={22} /> },
  { to: '/exercises', label: 'Ejercicios', icon: <Dumbbell size={22} /> },
  { to: '/history', label: 'Historial', icon: <History size={22} /> },
  { to: '/progress', label: 'Progreso', icon: <BarChart3 size={22} /> },
]

export function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="glass" style={navStyle}>
      <Tab tab={tabs[0]} />
      <Tab tab={tabs[1]} />
      <button aria-label="Entrenar" style={fab} onClick={() => navigate('/')}>
        <Play size={24} fill="#fff" />
      </button>
      <Tab tab={tabs[2]} />
      <Tab tab={tabs[3]} />
    </nav>
  )
}

function Tab({ tab }: { tab: { to: string; label: string; icon: ReactNode } }) {
  return (
    <NavLink to={tab.to} style={{ textDecoration: 'none', flex: 1 }}>
      {({ isActive }) => (
        <div style={itemWrap}>
          <span style={{ ...indicator, ...(isActive ? indicatorOn : null) }}>
            <span style={{ color: isActive ? 'var(--accent)' : 'var(--ink-faint)' }}>{tab.icon}</span>
          </span>
          <span style={{ fontSize: 11, color: isActive ? 'var(--accent)' : 'var(--ink-faint)', fontWeight: isActive ? 600 : 400 }}>
            {tab.label}
          </span>
        </div>
      )}
    </NavLink>
  )
}

const navStyle: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 12,
  width: 'calc(100% - 24px)',
  maxWidth: 456,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  padding: '8px 6px',
  borderRadius: 26,
  zIndex: 30,
}
const itemWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  padding: '2px 0',
}
const indicator: React.CSSProperties = {
  width: 54,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  transition: 'background .25s',
}
const indicatorOn: React.CSSProperties = { background: 'var(--accent-tint)' }
const fab: React.CSSProperties = {
  width: 58,
  height: 50,
  flex: 'none',
  borderRadius: 18,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(70,97,242,.45)',
  marginTop: -2,
}

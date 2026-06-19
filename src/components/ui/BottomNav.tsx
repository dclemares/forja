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
    <nav style={navStyle}>
      <Tab tab={tabs[0]} />
      <Tab tab={tabs[1]} />
      <button aria-label="Entrenar" style={fab} onClick={() => navigate('/')}>
        <Play size={24} fill="#4A2E10" color="#4A2E10" />
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
            <span style={{ color: isActive ? '#4A2E10' : '#EAD4A6', display: 'flex' }}>{tab.icon}</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#FFE3A6' : '#D8BE8E' }}>{tab.label}</span>
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
  padding: '8px 8px 10px',
  borderRadius: 22,
  zIndex: 30,
  background: 'linear-gradient(180deg,#A06A35,#7E5026)',
  border: '3px solid #4A2E16',
  boxShadow: 'inset 0 2px 0 rgba(255,210,140,.35), inset 0 -5px 10px rgba(40,24,10,.45), 0 5px 0 #34200E, 0 9px 16px rgba(20,12,4,.5)',
}
const itemWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  padding: '2px 0',
}
const indicator: React.CSSProperties = {
  width: 50,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 11,
  transition: 'background .2s',
}
const indicatorOn: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 50%), linear-gradient(180deg,#FBD269,#E0922C)',
  border: '2px solid #7A4A12',
  boxShadow: 'inset 0 1px 0 rgba(255,240,200,.7)',
}
const fab: React.CSSProperties = {
  width: 64,
  height: 54,
  flex: 'none',
  borderRadius: 18,
  border: '3px solid #7A4A12',
  background: 'linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,0) 46%), linear-gradient(180deg,#FBD269,#E0922C)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  marginTop: -10,
  boxShadow: 'inset 0 2px 0 rgba(255,245,210,.85), 0 4px 0 #A66A18, 0 8px 12px rgba(20,12,4,.5), 0 0 16px rgba(255,205,90,.45)',
}

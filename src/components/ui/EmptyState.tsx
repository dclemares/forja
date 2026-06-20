import type { ReactNode } from 'react'

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="anim-pop" style={{ textAlign: 'center', padding: '46px 24px 24px' }}>
      <div style={medallion}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 16, color: 'var(--ink)' }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

const medallion: React.CSSProperties = {
  width: 84,
  height: 84,
  margin: '0 auto',
  borderRadius: 24,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,0) 45%), linear-gradient(180deg,#A06A35,#7E5026)',
  border: '3px solid #4A2E16',
  color: '#FBEFD3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'inset 0 2px 0 rgba(255,210,140,.4), 0 5px 0 #34200E, 0 9px 14px rgba(20,12,4,.4)',
}

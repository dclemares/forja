import type { ReactNode } from 'react'

export function CoinBadge({ children, size = 'md' }: { children: ReactNode; size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background:
          'linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,0) 50%), linear-gradient(180deg,#E6C06A,#B07E22)',
        border: lg ? '2.5px solid #7A4A12' : '2px solid #7A4A12',
        borderRadius: 999,
        padding: lg ? '4px 16px' : '3px 12px',
        color: '#4A2E10',
        fontWeight: 800,
        fontSize: lg ? 22 : 17,
        lineHeight: 1.1,
        boxShadow: 'inset 0 1px 0 rgba(255,245,210,.7), 0 2px 0 #7C5413',
        textShadow: '0 1px 0 rgba(255,245,210,.4)',
      }}
    >
      {children}
    </span>
  )
}

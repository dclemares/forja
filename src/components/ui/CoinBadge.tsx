import type { ReactNode } from 'react'

/** Contador de datos (no es un botón): chapa dorada GRABADA, con sombra interior. */
export function CoinBadge({ children, size = 'md' }: { children: ReactNode; size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
        background: 'linear-gradient(180deg,#EFC356,#E0A329)',
        border: lg ? '2.5px solid #9A6A1E' : '2px solid #9A6A1E',
        borderRadius: 999,
        padding: lg ? '4px 15px' : '3px 11px',
        color: '#5A3A12',
        fontWeight: 800,
        fontSize: lg ? 22 : 16,
        lineHeight: 1.1,
        // Grabado: sombra interior arriba (hundido), sin relieve inferior ni brillo de botón.
        boxShadow: 'inset 0 2px 3px rgba(120,74,18,.5), inset 0 -1.5px 0 rgba(255,248,222,.55)',
        textShadow: '0 1px 0 rgba(255,245,210,.45)',
      }}
    >
      {children}
    </span>
  )
}

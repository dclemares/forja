import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, children, style, ...rest }: ChipProps) {
  return (
    <button
      style={{
        fontSize: 13,
        fontWeight: 700,
        padding: '6px 13px',
        borderRadius: 999,
        border: active ? '2px solid #7A4A12' : '2px solid #9A6A3A',
        background: active ? 'linear-gradient(180deg,#FFD75C,#EDA31E)' : 'linear-gradient(180deg,#F3E3BE,#E6CF9E)',
        color: active ? '#4A2E10' : '#6E4423',
        boxShadow: active ? 'inset 0 1px 0 rgba(255,240,200,.7)' : 'inset 0 1px 0 rgba(255,255,255,.5)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Etiqueta no interactiva (grupo muscular). */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 700,
        padding: '3px 11px',
        borderRadius: 999,
        background: 'rgba(120,80,30,.16)',
        border: '1.5px solid rgba(120,80,30,.35)',
        color: '#7A4A12',
      }}
    >
      {children}
    </span>
  )
}

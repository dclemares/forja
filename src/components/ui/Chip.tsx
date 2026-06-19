import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, children, style, ...rest }: ChipProps) {
  return (
    <button
      style={{
        fontSize: 13,
        fontWeight: 500,
        padding: '6px 13px',
        borderRadius: 999,
        border: active ? '1px solid var(--accent)' : '1px solid rgba(20,22,26,.1)',
        background: active ? 'var(--accent)' : 'rgba(255,255,255,.5)',
        color: active ? '#fff' : 'var(--ink-soft)',
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
        padding: '3px 10px',
        borderRadius: 999,
        background: 'var(--accent-tint)',
        color: 'var(--accent)',
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  )
}

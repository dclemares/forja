import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'tonal' | 'ghost' | 'danger' | 'dashed'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg'
  full?: boolean
  icon?: ReactNode
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 600,
  fontFamily: 'inherit',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform .12s ease',
  lineHeight: 1.1,
}

const variants: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: '#fff', boxShadow: '0 6px 16px rgba(70,97,242,.32)' },
  tonal: { background: 'var(--accent-tint)', color: 'var(--accent)' },
  ghost: { background: 'rgba(255,255,255,.5)', color: 'var(--ink)', border: '1px solid rgba(20,22,26,.12)' },
  danger: { background: 'var(--danger-tint)', color: 'var(--danger)' },
  dashed: { background: 'transparent', color: 'var(--accent)', border: '1.5px dashed var(--accent-soft)' },
}

export function PillButton({
  variant = 'primary',
  size = 'md',
  full = false,
  icon,
  children,
  style,
  ...rest
}: PillButtonProps) {
  const pad = size === 'lg' ? '15px 20px' : '11px 16px'
  const fontSize = size === 'lg' ? 16 : 14
  return (
    <button
      style={{
        ...base,
        ...variants[variant],
        padding: pad,
        fontSize,
        width: full ? '100%' : undefined,
        borderRadius: size === 'lg' ? 22 : 'var(--radius-control)',
        ...style,
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onPointerUp={(e) => (e.currentTarget.style.transform = '')}
      onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

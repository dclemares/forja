import type { HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  sheen?: boolean
  /** Panel de referencia: menos relieve y borde, para que no compita con el foco. */
  flat?: boolean
}

export function GlassCard({ sheen = false, flat = false, className = '', children, ...rest }: GlassCardProps) {
  const tappable = typeof rest.onClick === 'function'
  return (
    <div className={`glass ${flat ? 'glass-flat' : ''} ${sheen ? 'glass-sheen' : ''} ${tappable ? 'tappable' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

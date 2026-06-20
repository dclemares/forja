import type { HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  sheen?: boolean
}

export function GlassCard({ sheen = false, className = '', children, ...rest }: GlassCardProps) {
  const tappable = typeof rest.onClick === 'function'
  return (
    <div className={`glass ${sheen ? 'glass-sheen' : ''} ${tappable ? 'tappable' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

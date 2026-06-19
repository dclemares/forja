import type { HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  sheen?: boolean
}

export function GlassCard({ sheen = false, className = '', children, ...rest }: GlassCardProps) {
  return (
    <div className={`glass ${sheen ? 'glass-sheen' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

import type { CSSProperties, HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  sheen?: boolean
}

/** Veta de madera generada por turbulencia SVG (procedural, desde cero). */
const grainSvg =
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'>" +
  "<filter id='w'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.013 0.045' numOctaves='3' seed='4' stitchTiles='stitch'/>" +
  "<feColorMatrix type='matrix' values='0 0 0 0 0.40  0 0 0 0 0.25  0 0 0 0 0.11  0 0 0 0.5 0'/>" +
  "</filter><rect width='240' height='160' filter='url(#w)'/></svg>"

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(grainSvg)}")`

const baseStyle: CSSProperties = {
  backgroundImage: `${GRAIN}, linear-gradient(180deg, var(--parch-top), var(--parch-bot))`,
  backgroundBlendMode: 'multiply, normal',
  backgroundSize: 'cover',
}

export function GlassCard({ sheen = false, className = '', style, children, ...rest }: GlassCardProps) {
  return (
    <div className={`glass ${sheen ? 'glass-sheen' : ''} ${className}`} style={{ ...baseStyle, ...style }} {...rest}>
      {children}
    </div>
  )
}

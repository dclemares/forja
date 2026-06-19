import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { playClick } from '@/lib/sound'

type Variant = 'primary' | 'tonal' | 'ghost' | 'danger' | 'dashed'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg'
  full?: boolean
  icon?: ReactNode
}

interface VStyle {
  bg: string
  color: string
  border: string
  threeD: string
  highlight: string
  textShadow?: string
  dashed?: boolean
  flat?: boolean
}

const V: Record<Variant, VStyle> = {
  primary: { bg: 'linear-gradient(180deg,#E6C06A,#B07E22)', color: '#4A2E10', border: '#7A4A12', threeD: '#7C5413', highlight: 'rgba(255,240,200,.75)', textShadow: '0 1px 0 rgba(255,240,200,.5)' },
  tonal: { bg: 'linear-gradient(180deg,#5C8AD0,#39619F)', color: '#fff', border: '#21406C', threeD: '#2B4C80', highlight: 'rgba(255,255,255,.45)', textShadow: '0 1px 1px rgba(18,38,72,.55)' },
  ghost: { bg: 'linear-gradient(180deg,#DCEAF8,#BFD6EF)', color: '#244B86', border: '#3A63A8', threeD: '#9CB7D9', highlight: 'rgba(255,255,255,.65)' },
  danger: { bg: 'linear-gradient(180deg,#F18A6A,#D2412C)', color: '#fff', border: '#7A1E12', threeD: '#9A2A1A', highlight: 'rgba(255,200,180,.5)', textShadow: '0 1px 1px rgba(120,20,10,.6)' },
  dashed: { bg: 'rgba(247,231,194,.45)', color: '#7A4A12', border: '#8A5A2A', threeD: 'transparent', highlight: 'transparent', dashed: true, flat: true },
}

export function PillButton({ variant = 'primary', size = 'md', full = false, icon, children, style, ...rest }: PillButtonProps) {
  const v = V[variant]
  const depth = v.flat ? 0 : size === 'lg' ? 5 : 4
  const shadow = (d: number) =>
    v.flat ? 'none' : `inset 0 2px 0 ${v.highlight}, 0 ${d}px 0 ${v.threeD}, 0 ${d + 4}px ${d + 6}px rgba(30,18,6,.4)`

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'inherit',
        fontWeight: 700,
        letterSpacing: '0.2px',
        lineHeight: 1.1,
        cursor: 'pointer',
        background: v.flat ? v.bg : `linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0) 48%), ${v.bg}`,
        color: v.color,
        border: `2.5px ${v.dashed ? 'dashed' : 'solid'} ${v.border}`,
        borderRadius: size === 'lg' ? 16 : 'var(--radius-control)',
        padding: size === 'lg' ? '14px 20px' : '10px 16px',
        fontSize: size === 'lg' ? 16 : 14,
        width: full ? '100%' : undefined,
        boxShadow: shadow(depth),
        textShadow: v.textShadow,
        transition: 'transform .07s ease, box-shadow .07s ease',
        ...style,
      }}
      onPointerDown={(e) => {
        playClick()
        e.currentTarget.style.transform = `translateY(${depth}px)`
        e.currentTarget.style.boxShadow = shadow(0)
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = shadow(depth)
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = shadow(depth)
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

import { Dumbbell, Footprints, Grid2x2, Hand, HeartPulse, MoveUp, StretchHorizontal, type LucideIcon } from 'lucide-react'
import type { MuscleGroup } from '@/lib/types'

/** Icono + color distintivos por grupo muscular. */
const MAP: Record<MuscleGroup, { Icon: LucideIcon; color: string }> = {
  Pecho: { Icon: HeartPulse, color: '#E5484D' },
  Espalda: { Icon: StretchHorizontal, color: '#3E63DD' },
  'Bíceps': { Icon: Dumbbell, color: '#8E4EC6' },
  'Tríceps': { Icon: Hand, color: '#C2620B' },
  Hombro: { Icon: MoveUp, color: '#0E7C9B' },
  Pierna: { Icon: Footprints, color: '#3E9B4F' },
  Abdomen: { Icon: Grid2x2, color: '#E5670B' },
}

export function muscleColor(group: MuscleGroup): string {
  return MAP[group]?.color ?? '#4661F2'
}

/** Círculo con el icono del grupo muscular, tintado con su color. */
export function MuscleIconBadge({ group, size = 38 }: { group: MuscleGroup; size?: number }) {
  const entry = MAP[group] ?? { Icon: Dumbbell, color: '#4661F2' }
  const { Icon, color } = entry
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: 'linear-gradient(180deg,#F7E8C6,#EAD3A2)',
        border: '2.5px solid #8A5A2A',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 2px 0 #6E4423',
      }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.6} />
    </span>
  )
}

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Flame, Star, Trophy } from 'lucide-react'
import { PillButton } from '@/components/ui/PillButton'
import { CoinBadge } from '@/components/ui/CoinBadge'
import { formatNumber } from '@/lib/format'
import { playSuccess } from '@/lib/sound'

interface Props {
  volume: number
  exercises: number
  series: number
  prs?: number
  streak?: number
  onClose: () => void
}

export function WorkoutCelebration({ volume, exercises, series, prs = 0, streak = 0, onClose }: Props) {
  useEffect(() => {
    playSuccess()
  }, [])

  return createPortal(
    <motion.div style={scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={glow} />
      <motion.div
        style={card}
        className="glass"
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 17, stiffness: 260 }}
      >
        <div style={banner}>¡Entreno completado!</div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 6, margin: '20px 0 4px' }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25 + i * 0.16, type: 'spring', stiffness: 320, damping: 11 }}
              style={{ display: 'flex', filter: 'drop-shadow(0 3px 2px rgba(120,74,18,.4))' }}
            >
              <Star size={i === 1 ? 58 : 46} fill="#FFD75C" color="#7A4A12" strokeWidth={2} />
            </motion.span>
          ))}
        </div>

        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 14 }}>Volumen total</div>
        <div style={{ marginTop: 6 }}>
          <CoinBadge size="lg">{formatNumber(volume)} kg</CoinBadge>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 12, marginBottom: prs > 0 || streak >= 2 ? 12 : 18 }}>
          {exercises} ejercicios · {series} series
        </div>

        {(prs > 0 || streak >= 2) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {prs > 0 && (
              <div style={highlight}>
                <Trophy size={16} /> {prs} récord{prs > 1 ? 's' : ''} nuevo{prs > 1 ? 's' : ''}
              </div>
            )}
            {streak >= 2 && (
              <div style={{ ...highlight, background: 'linear-gradient(180deg,#FFB36B,#F0832B)' }}>
                <Flame size={16} /> {streak} semanas seguidas
              </div>
            )}
          </div>
        )}

        <PillButton full size="lg" onClick={onClose}>¡Hecho!</PillButton>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

const scrim: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(40,24,10,.62)',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 22,
}
const glow: React.CSSProperties = {
  position: 'absolute',
  width: 420,
  height: 420,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,210,90,.45), rgba(255,210,90,0) 65%)',
  pointerEvents: 'none',
}
const card: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 340,
  textAlign: 'center',
  padding: '22px 20px',
}
const highlight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 800,
  color: '#4A2E10',
  background: 'linear-gradient(180deg,#FFE08A,#EDB836)',
  border: '2px solid #7A4A12',
  boxShadow: 'inset 0 1px 0 rgba(255,245,210,.7)',
}
const banner: React.CSSProperties = {
  display: 'inline-block',
  background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 50%), linear-gradient(180deg,#7BC23E,#4E9A1E)',
  border: '3px solid #2F5E12',
  borderRadius: 14,
  padding: '7px 20px',
  color: '#fff',
  fontWeight: 800,
  fontSize: 19,
  letterSpacing: '0.3px',
  boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 4px 0 #25490D, 0 7px 10px rgba(20,12,4,.4)',
  textShadow: '0 2px 0 rgba(30,60,12,.6)',
  marginTop: -2,
}

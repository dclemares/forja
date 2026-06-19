import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { iconBtn } from './AppBar'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={scrim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass"
            style={sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={grabber} />
            {title && (
              <div style={head}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
                <button aria-label="Cerrar" onClick={onClose} style={iconBtn}>
                  <X size={20} />
                </button>
              </div>
            )}
            <div style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const scrim: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(20,22,40,.28)',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}
const sheet: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  maxHeight: '85vh',
  borderRadius: '28px 28px 0 0',
  padding: '10px 16px max(16px, env(safe-area-inset-bottom))',
  background: 'var(--glass-strong)',
  display: 'flex',
  flexDirection: 'column',
}
const grabber: React.CSSProperties = {
  width: 40,
  height: 4,
  borderRadius: 999,
  background: 'rgba(20,22,26,.18)',
  margin: '0 auto 12px',
}
const head: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
}

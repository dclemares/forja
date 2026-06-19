/** Fondo cartoon: tablones de madera cálida (tan) con vetas y viñeta suave. */
export function AnimatedBackground() {
  return (
    <div aria-hidden style={wrap}>
      <div style={grain} />
      <div style={vignette} />
    </div>
  )
}

const wrap: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  background: 'radial-gradient(130% 100% at 50% -10%, #CBA468 0%, #B08A50 45%, #93703A 100%)',
}

const grain: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  opacity: 0.6,
  backgroundImage:
    'repeating-linear-gradient(92deg, rgba(74,46,22,0.14) 0px, rgba(74,46,22,0.14) 2px, transparent 2px, transparent 30px),' +
    'repeating-linear-gradient(92deg, rgba(255,225,170,0.07) 0px, rgba(255,225,170,0.07) 1px, transparent 1px, transparent 15px)',
}

const vignette: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  boxShadow: 'inset 0 0 140px 40px rgba(60,38,16,0.4)',
}

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
  opacity: 0.7,
  backgroundImage:
    // juntas de tablón (bordes de tabla cada ~94px)
    'repeating-linear-gradient(90deg, transparent 0 90px, rgba(40,24,10,0.20) 90px 93px, rgba(255,224,168,0.08) 93px 94px, transparent 94px 96px),' +
    // veta fina
    'repeating-linear-gradient(90deg, rgba(74,46,22,0.13) 0px, rgba(74,46,22,0.13) 2px, transparent 2px, transparent 30px),' +
    'repeating-linear-gradient(90deg, rgba(255,225,170,0.06) 0px, rgba(255,225,170,0.06) 1px, transparent 1px, transparent 15px)',
}

const vignette: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  boxShadow: 'inset 0 0 140px 40px rgba(60,38,16,0.4)',
}

/** Fondo cartoon: tablero de tablones de madera cálida con juntas y veta. */
export function AnimatedBackground() {
  return (
    <div aria-hidden style={wrap}>
      <div style={planks} />
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
  background: 'radial-gradient(130% 100% at 50% -10%, #C9A263 0%, #AE8850 45%, #8F6D38 100%)',
}

const planks: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    // tono alterno por tablón (claro/oscuro) -> sensación de tabla independiente
    'repeating-linear-gradient(180deg, rgba(255,228,176,0.07) 0 72px, rgba(48,28,10,0.07) 72px 144px),' +
    // junta horizontal entre tablones: sombra hundida + reflejo (bisel cartoon)
    'repeating-linear-gradient(180deg, transparent 0 67px, rgba(32,18,7,0.55) 67px 70px, rgba(255,234,188,0.20) 70px 72px),' +
    // juntas verticales (extremos de tabla) cada ~150px
    'repeating-linear-gradient(90deg, transparent 0 150px, rgba(32,18,7,0.30) 150px 152px, rgba(255,234,188,0.12) 152px 153px)',
}

const grain: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  opacity: 0.5,
  backgroundImage:
    // veta fina a lo largo del tablón (horizontal)
    'repeating-linear-gradient(180deg, rgba(74,46,22,0.10) 0 1px, transparent 1px 8px),' +
    'repeating-linear-gradient(180deg, rgba(255,228,176,0.05) 0 1px, transparent 1px 5px)',
}

const vignette: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  boxShadow: 'inset 0 0 140px 40px rgba(55,34,14,0.42)',
}

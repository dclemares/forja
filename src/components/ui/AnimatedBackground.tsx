/**
 * Fondo dinámico claro con un juego de luces azul/blanco que deriva lentamente.
 * (En el futuro puede sustituirse por una foto/vídeo de gym desenfocado.)
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden style={wrap}>
      <div style={{ ...blob, ...b1 }} />
      <div style={{ ...blob, ...b2 }} />
      <div style={{ ...blob, ...b3 }} />
      <div style={{ ...blob, ...b4 }} />
    </div>
  )
}

const wrap: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  background: '#EAECF2',
}

const blob: React.CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(60px)',
  willChange: 'transform',
}

const b1: React.CSSProperties = {
  width: 360,
  height: 360,
  top: -80,
  left: -60,
  background: 'radial-gradient(circle, rgba(255,255,255,0.95), transparent 70%)',
  animation: 'drift 19s ease-in-out infinite alternate',
}
const b2: React.CSSProperties = {
  width: 320,
  height: 320,
  top: 60,
  right: -100,
  background: 'radial-gradient(circle, rgba(70,97,242,0.28), transparent 68%)',
  animation: 'drift2 24s ease-in-out infinite alternate',
}
const b3: React.CSSProperties = {
  width: 340,
  height: 340,
  bottom: -90,
  left: -40,
  background: 'radial-gradient(circle, rgba(150,120,255,0.22), transparent 66%)',
  animation: 'drift 27s ease-in-out infinite alternate',
}
const b4: React.CSSProperties = {
  width: 260,
  height: 260,
  bottom: 40,
  right: -60,
  background: 'radial-gradient(circle, rgba(60,200,210,0.16), transparent 66%)',
  animation: 'drift2 22s ease-in-out infinite alternate',
}

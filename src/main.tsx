import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { StoreProvider } from './lib/store'
import type { AppState } from './lib/store'
import { buildSeed, buildEmpty } from './lib/seed'
import { isSupabaseConfigured } from './lib/supabase'
import { AuthProvider, useAuth } from './lib/auth'
import { AuthScreen } from './features/auth/AuthScreen'
import { loadState, saveState } from './lib/backend'
import { AnimatedBackground } from './components/ui/AnimatedBackground'

function Splash() {
  return (
    <>
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
        Cargando…
      </div>
    </>
  )
}

function CloudGate({ userId }: { userId: string }) {
  const [initial, setInitial] = useState<AppState | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setFailed(false)
    setInitial(null)
    ;(async () => {
      const res = await loadState(userId)
      if (!active) return
      if (!res.ok) {
        // La carga FALLÓ: no sabemos si hay datos, así que NO montamos la app
        // (no se dispara ningún guardado) y NUNCA sobrescribimos con vacío.
        setFailed(true)
        return
      }
      let s = res.state
      if (!s) {
        // Solo aquí (consulta correcta y sin fila) es una cuenta nueva de verdad.
        s = buildEmpty()
        await saveState(userId, s)
      }
      setInitial(s)
    })()
    return () => {
      active = false
    }
  }, [userId, attempt])

  if (failed) {
    return (
      <>
        <AnimatedBackground />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, color: 'var(--ink)' }}>No se pudieron cargar tus datos</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16, lineHeight: 1.45 }}>Revisa tu conexión y reintenta. Tus datos NO se han tocado: solo no se han podido leer ahora mismo.</div>
            <button onClick={() => setAttempt((a) => a + 1)} style={{ border: '2px solid #7A4A12', background: 'linear-gradient(180deg,#FFD75C,#EDA31E)', color: '#4A2E10', fontWeight: 800, fontFamily: 'inherit', fontSize: 15, padding: '11px 22px', borderRadius: 12, cursor: 'pointer' }}>Reintentar</button>
          </div>
        </div>
      </>
    )
  }
  if (!initial) return <Splash />
  return (
    <StoreProvider initial={initial} cloudUserId={userId}>
      <App />
    </StoreProvider>
  )
}

function Root() {
  const { loading, session } = useAuth()
  if (!isSupabaseConfigured) {
    return (
      <StoreProvider initial={buildSeed()}>
        <App />
      </StoreProvider>
    )
  }
  if (loading) return <Splash />
  if (!session) return <AuthScreen />
  return <CloudGate userId={session.user.id} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)

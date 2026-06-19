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
  useEffect(() => {
    let active = true
    ;(async () => {
      let s = await loadState(userId)
      if (!s) {
        s = buildEmpty()
        await saveState(userId, s)
      }
      if (active) setInitial(s)
    })()
    return () => {
      active = false
    }
  }, [userId])
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

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

interface AuthValue {
  session: Session | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthValue = {
    session,
    loading,
    configured: isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) return { error: 'Supabase no configurado' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? { error: translate(error.message) } : {}
    },
    async signUp(email, password) {
      if (!supabase) return { error: 'Supabase no configurado' }
      const { error } = await supabase.auth.signUp({ email, password })
      return error ? { error: translate(error.message) } : {}
    },
    async signOut() {
      await supabase?.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function translate(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  if (m.includes('already registered') || m.includes('already exists')) return 'Ese email ya está registrado. Pulsa "Entrar".'
  if (m.includes('not confirmed')) return 'Esa cuenta no está confirmada. Crea una cuenta nueva.'
  if (m.includes('password should be') || m.includes('at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('email')) return 'Revisa el email introducido.'
  return msg
}

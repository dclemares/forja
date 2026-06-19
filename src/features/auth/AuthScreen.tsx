import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  const submit = async () => {
    setError(''); setInfo(''); setBusy(true)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(email.trim(), password)
    setBusy(false)
    if (error) setError(error)
    else if (mode === 'register') setInfo('Cuenta creada. Si pide confirmación, revisa tu email; si no, ya puedes entrar.')
  }

  return (
    <>
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={logo}><Dumbbell size={30} color="#fff" /></div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: '14px 0 4px' }}>Forja</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: 0 }}>Tu diario de entrenamientos</p>
        </div>

        <GlassCard sheen style={{ padding: 20 }}>
          <div style={seg}>
            <SegBtn active={mode === 'login'} onClick={() => setMode('login')}>Entrar</SegBtn>
            <SegBtn active={mode === 'register'} onClick={() => setMode('register')}>Crear cuenta</SegBtn>
          </div>

          <label style={lbl}>Email</label>
          <input style={input} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
          <label style={lbl}>Contraseña</label>
          <input style={input} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && submit()} />

          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
          {info && <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 10 }}>{info}</div>}

          <PillButton full size="lg" style={{ marginTop: 16, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </PillButton>
        </GlassCard>
      </div>
    </>
  )
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 1, textAlign: 'center', fontSize: 14, padding: 9, borderRadius: 11, border: active ? '1px solid rgba(20,22,26,.1)' : '1px solid transparent', background: active ? 'rgba(255,255,255,.85)' : 'transparent', color: active ? 'var(--accent)' : 'var(--ink-soft)', fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
      {children}
    </button>
  )
}

const logo: React.CSSProperties = { width: 64, height: 64, borderRadius: 20, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(70,97,242,.4)' }
const seg: React.CSSProperties = { display: 'flex', background: 'rgba(255,255,255,.45)', border: '1px solid rgba(20,22,26,.08)', borderRadius: 13, padding: 3, marginBottom: 16 }
const lbl: React.CSSProperties = { display: 'block', fontSize: 13, color: 'var(--ink-soft)', margin: '12px 0 6px' }
const input: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(20,22,26,.12)', borderRadius: 14, padding: '12px', color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }

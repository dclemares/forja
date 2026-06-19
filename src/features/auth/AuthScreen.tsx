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
          <div style={logo}><Dumbbell size={32} color="#4A2E10" strokeWidth={2.6} /></div>
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
    <button onClick={onClick} style={{ flex: 1, textAlign: 'center', fontSize: 14, padding: 9, borderRadius: 10, border: active ? '2px solid #7A4A12' : '2px solid transparent', background: active ? 'linear-gradient(180deg,#E6C06A,#B07E22)' : 'transparent', color: active ? '#4A2E10' : '#6E4423', fontWeight: 700, boxShadow: active ? 'inset 0 1px 0 rgba(255,240,200,.7)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
      {children}
    </button>
  )
}

const logo: React.CSSProperties = { width: 70, height: 70, borderRadius: 22, background: 'linear-gradient(180deg,#E6C06A,#B07E22)', border: '3px solid #7A4A12', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 0 rgba(255,240,200,.7), 0 5px 0 #7C5413, 0 9px 14px rgba(30,18,6,.4)' }
const seg: React.CSSProperties = { display: 'flex', background: 'rgba(120,80,30,.16)', border: '2px solid #9A6A3A', borderRadius: 13, padding: 3, marginBottom: 16, boxShadow: 'inset 0 2px 4px rgba(80,50,20,.25)' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', margin: '12px 0 6px' }
const input: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }

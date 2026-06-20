import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, LogOut, Play, Scale, Trash2, TrendingDown, History as HistoryIcon, User, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { CoinBadge } from '@/components/ui/CoinBadge'
import { Sheet } from '@/components/ui/Sheet'
import { titlePlaque } from '@/components/ui/AppBar'
import { isSoundEnabled, setSoundEnabled, playClick } from '@/lib/sound'
import { formatLongDate, formatNumber, todayISO } from '@/lib/format'
import { workoutVolume } from '@/lib/domain/volume'
import { weeklyVolume, bodyweightTrend } from '@/lib/domain/trends'

export function TodayScreen() {
  const { state, startWorkout, startFreeWorkout, addBodyweight, resetAll } = useStore()
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [pickOpen, setPickOpen] = useState(false)
  const [bwOpen, setBwOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(isSoundEnabled())

  const planDay = (new Date().getDay() + 6) % 7
  const plannedId = state.weeklyPlan[planDay]
  const planned = state.sessions.find((s) => s.id === plannedId)
  const active = state.workouts.find((w) => w.id === state.activeWorkoutId)

  const finished = state.workouts.filter((w) => w.finishedAt).sort((a, b) => b.date.localeCompare(a.date))
  const last = finished[0]
  const weekly = weeklyVolume(finished)
  const thisWeek = weekly[weekly.length - 1]?.volume ?? 0
  const body = bodyweightTrend(state.bodyweight)
  const lastBody = body[body.length - 1]

  const begin = (sessionId: string) => {
    const id = startWorkout(sessionId)
    if (id) navigate(`/workout/${id}`)
  }
  const beginFree = () => navigate(`/workout/${startFreeWorkout()}`)

  return (
    <div className="anim-rise">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 4px 16px' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 7 }}>{formatLongDate(todayISO())}</div>
          <h1 style={titlePlaque}>Entrenar</h1>
        </div>
        {session && (
          <button aria-label="Perfil" onClick={() => setProfileOpen(true)} style={{ width: 46, height: 46, borderRadius: 999, border: '2.5px solid #4A2E16', background: 'repeating-linear-gradient(90deg,rgba(40,24,10,.12) 0 1px,transparent 1px 7px),repeating-linear-gradient(90deg,rgba(255,215,150,.06) 0 1px,transparent 1px 4px),linear-gradient(180deg,#A06A35,#7E5026)', color: '#FBEFD3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', boxShadow: 'inset 0 2px 0 rgba(255,210,140,.35), 0 3px 0 #34200E' }}>
            <User size={20} />
          </button>
        )}
      </header>

      {active && (
        <GlassCard style={{ padding: 15, marginBottom: 12, border: '1px solid var(--accent-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Entrenamiento en curso</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{active.name}</div>
            </div>
            <PillButton icon={<Play size={16} fill="#fff" />} onClick={() => navigate(`/workout/${active.id}`)}>
              Continuar
            </PillButton>
          </div>
        </GlassCard>
      )}

      <GlassCard sheen style={{ padding: 19, marginBottom: 12 }}>
        <span style={chip}>
          <CalendarDays size={14} /> Hoy · {planned ? 'sesión prevista' : 'sin sesión prevista'}
        </span>
        <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.6px', margin: '12px 0 4px' }}>
          {planned ? planned.name : 'Descanso'}
        </h2>
        {planned && (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
            {planned.exerciseIds
              .map((id) => state.exercises.find((e) => e.id === id)?.name)
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}
        {planned ? (
          <PillButton full size="lg" icon={<Play size={18} fill="#fff" />} onClick={() => begin(planned.id)}>
            Comenzar entrenamiento
          </PillButton>
        ) : (
          <PillButton full size="lg" variant="tonal" icon={<Play size={18} />} onClick={beginFree}>
            Empezar un entrenamiento
          </PillButton>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <PillButton variant="ghost" style={{ flex: 1 }} onClick={() => setPickOpen(true)}>
            Otra sesión
          </PillButton>
          <PillButton variant="ghost" style={{ flex: 1 }} onClick={beginFree}>
            Entreno libre
          </PillButton>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Volumen semanal</div>
          <div style={{ marginTop: 8 }}>
            <CoinBadge>{formatNumber(thisWeek)} kg</CoinBadge>
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/bodyweight')}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Peso corporal</div>
          <div style={{ marginTop: 8 }}>
            <CoinBadge>{lastBody ? `${lastBody.weight.toFixed(1).replace('.', ',')} kg` : '—'}</CoinBadge>
          </div>
          {lastBody && (
            <div style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
              <TrendingDown size={14} /> media {lastBody.avg.toFixed(1).replace('.', ',')}
            </div>
          )}
        </GlassCard>
      </div>

      {last && (
        <GlassCard style={{ padding: 15, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Último entrenamiento</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }} onClick={() => navigate(`/history/${last.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={iconCircle}><HistoryIcon size={20} /></span>
              <div>
                <div style={{ fontWeight: 600 }}>{last.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{last.exercises.length} ejercicios</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 7 }}>
              <CoinBadge>{formatNumber(workoutVolume(last))} kg</CoinBadge>
              <ChevronRight size={18} color="#8A5A2A" />
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={iconCircle}><Scale size={20} /></span>
            <div style={{ fontSize: 14 }}>Registrar peso corporal</div>
          </div>
          <PillButton variant="ghost" onClick={() => setBwOpen(true)}>+ Registrar</PillButton>
        </div>
      </GlassCard>

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)} title="Elegir sesión">
        <div style={{ paddingBottom: 8 }}>
          {state.sessions.map((s) => (
            <button key={s.id} style={rowBtn} onClick={() => { setPickOpen(false); begin(s.id) }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{s.exerciseIds.length} ejercicios</div>
              </div>
              <ChevronRight size={18} color="var(--ink-faint)" />
            </button>
          ))}
          <button style={{ ...rowBtn, color: 'var(--accent)', fontWeight: 600 }} onClick={() => { setPickOpen(false); beginFree() }}>
            Entrenamiento libre
          </button>
        </div>
      </Sheet>

      <BodyweightSheet open={bwOpen} onClose={() => setBwOpen(false)} onSave={(w) => { addBodyweight(todayISO(), w); setBwOpen(false) }} />

      <Sheet open={profileOpen} onClose={() => setProfileOpen(false)} title="Tu cuenta">
        <div style={{ padding: '4px 2px 12px' }}>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 14 }}>{session?.user.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600 }}>
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />} Sonidos
            </span>
            <button
              onClick={() => { const v = !soundOn; setSoundOn(v); setSoundEnabled(v); if (v) playClick() }}
              style={{ border: '2px solid #7A4A12', borderRadius: 999, padding: '5px 18px', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', color: soundOn ? '#4A2E10' : '#6E4423', background: soundOn ? 'linear-gradient(180deg,#FFD75C,#EDA31E)' : 'linear-gradient(180deg,#F3E3BE,#E6CF9E)', boxShadow: 'inset 0 1px 0 rgba(255,245,210,.6)' }}
            >
              {soundOn ? 'ON' : 'OFF'}
            </button>
          </div>
          <PillButton full variant="ghost" icon={<LogOut size={16} />} onClick={() => signOut()}>Cerrar sesión</PillButton>
          <PillButton
            full
            variant="danger"
            icon={<Trash2 size={16} />}
            style={{ marginTop: 10 }}
            onClick={() => {
              if (window.confirm('¿Borrar TODOS tus datos (ejercicios, sesiones, entrenamientos y peso)? Empezarás de cero. No se puede deshacer.')) {
                resetAll()
                setProfileOpen(false)
              }
            }}
          >
            Borrar todos mis datos
          </PillButton>
        </div>
      </Sheet>
    </div>
  )
}

function BodyweightSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (w: number) => void }) {
  const [val, setVal] = useState('78,4')
  return (
    <Sheet open={open} onClose={onClose} title="Peso corporal de hoy">
      <div style={{ padding: '4px 2px 12px' }}>
        <input
          autoFocus
          inputMode="decimal"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          style={{ width: '100%', fontSize: 22, fontWeight: 700, textAlign: 'center', padding: '14px', borderRadius: 14, border: '2px solid #9A6A3A', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', color: 'var(--ink)', fontFamily: 'inherit', marginBottom: 12, outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }}
        />
        <PillButton full size="lg" onClick={() => { const n = parseFloat(val.replace(',', '.')); if (Number.isFinite(n)) onSave(n) }}>
          Guardar
        </PillButton>
      </div>
    </Sheet>
  )
}

const chip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-tint)',
  color: 'var(--accent)', fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 18,
}
const iconCircle: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(180deg,#F5E9CB,#E6D2A2)', border: '2px solid #8A5A2A', color: '#EDA31E',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 2px 0 #6E4423',
}
const rowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)',
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left',
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CalendarDays, ChevronRight, Flame, LogOut, Play, Plus, Trash2, TrendingDown, TrendingUp, History as HistoryIcon, User, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { CoinBadge } from '@/components/ui/CoinBadge'
import { Sheet } from '@/components/ui/Sheet'
import { titlePlaque } from '@/components/ui/AppBar'
import { isSoundEnabled, setSoundEnabled, playClick } from '@/lib/sound'
import { formatLongDate, formatNumber, todayISO } from '@/lib/format'
import { workoutVolume, workoutSetCount } from '@/lib/domain/volume'
import { isoWeekKey, bodyweightTrend, weeklyStreak } from '@/lib/domain/trends'

export function TodayScreen() {
  const { state, startWorkout, startFreeWorkout, addBodyweight, deleteWorkout, resetAll } = useStore()
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
  // Volumen de la semana ACTUAL y comparativa con la anterior.
  const curKey = isoWeekKey(todayISO())
  const prev = new Date()
  prev.setDate(prev.getDate() - 7)
  const prevKey = isoWeekKey(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`)
  const thisWeek = finished.filter((w) => isoWeekKey(w.date) === curKey).reduce((a, w) => a + workoutVolume(w), 0)
  const prevWeek = finished.filter((w) => isoWeekKey(w.date) === prevKey).reduce((a, w) => a + workoutVolume(w), 0)
  const deltaPct = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : null
  const body = bodyweightTrend(state.bodyweight)
  const lastBody = body[body.length - 1]
  const streak = weeklyStreak(state.workouts, todayISO())
  const activeEmpty = active ? workoutSetCount(active) === 0 : false

  const discardActive = () => {
    if (active && window.confirm('¿Descartar este entrenamiento vacío?')) deleteWorkout(active.id)
  }

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
          <button aria-label="Perfil" onClick={() => setProfileOpen(true)} style={{ width: 46, height: 46, borderRadius: 999, border: '2.5px solid #4A2E16', background: 'linear-gradient(180deg,#A06A35,#7E5026)', color: '#FBEFD3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', boxShadow: 'inset 0 2px 0 rgba(255,210,140,.35), 0 3px 0 #34200E' }}>
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
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 1 }}>
                {activeEmpty ? 'Sin series todavía' : `${workoutSetCount(active)} series registradas`}
              </div>
            </div>
            <PillButton icon={<Play size={16} fill="#fff" />} onClick={() => navigate(`/workout/${active.id}`)}>
              Continuar
            </PillButton>
          </div>
          {activeEmpty && (
            <button type="button" onClick={discardActive} style={discardBtn}>
              <Trash2 size={14} /> Descartar
            </button>
          )}
        </GlassCard>
      )}

      {streak >= 1 && (
        <GlassCard style={{ padding: '11px 15px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={flameCircle}><Flame size={20} /></span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{streak} {streak === 1 ? 'semana' : 'semanas'} seguidas</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{streak === 1 ? 'Entrena otra semana para encadenar la racha' : '¡Sigue así, no rompas la cadena!'}</div>
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
            <CoinBadge size="lg">{formatNumber(thisWeek)} kg</CoinBadge>
          </div>
          {deltaPct != null && (
            <div style={{ fontSize: 12, fontWeight: 700, color: deltaPct >= 0 ? '#3E8E2E' : '#C5403F', display: 'flex', alignItems: 'center', gap: 3, marginTop: 7 }}>
              {deltaPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {Math.abs(deltaPct)}% vs anterior
            </div>
          )}
        </GlassCard>
        <GlassCard style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/bodyweight')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Peso corporal</div>
            <button aria-label="Registrar peso" className="gold-shine" onClick={(e) => { e.stopPropagation(); setBwOpen(true) }} style={miniAdd}><Plus size={16} /></button>
          </div>
          <div style={{ marginTop: 8 }}>
            {lastBody ? (
              <CoinBadge size="lg">{lastBody.weight.toFixed(1).replace('.', ',')} kg</CoinBadge>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-faint)', lineHeight: 1.3, padding: '4px 0' }}>
                Sin registro<br />toca <b style={{ color: 'var(--accent)' }}>+</b> para añadir
              </div>
            )}
          </div>
          {lastBody && (
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 7 }}>
              <Activity size={14} /> media {lastBody.avg.toFixed(1).replace('.', ',')}
            </div>
          )}
        </GlassCard>
      </div>

      {last && (
        <GlassCard style={{ padding: 15, marginBottom: 12 }} onClick={() => navigate(`/history/${last.id}`)}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Último entrenamiento</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={iconCircle}><HistoryIcon size={20} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{last.exercises.length} {last.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}</div>
            </div>
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CoinBadge>{formatNumber(workoutVolume(last))} kg</CoinBadge>
              <ChevronRight size={18} color="#8A5A2A" />
            </div>
          </div>
        </GlassCard>
      )}


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
const miniAdd: React.CSSProperties = {
  width: 30, height: 30, flex: 'none', borderRadius: 999, border: '2px solid #7A4A12',
  background: 'linear-gradient(180deg,#FFD75C,#EDA31E)', color: '#4A2E10',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,245,210,.7), 0 2px 0 #A66A18',
}
const discardBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 11, padding: '4px 2px',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13, fontWeight: 700, color: 'var(--ink-faint)',
}
const flameCircle: React.CSSProperties = {
  width: 42, height: 42, flex: 'none', borderRadius: 13, color: '#fff',
  background: 'linear-gradient(180deg,#FFB36B,#F0832B)', border: '2px solid #8A4A12',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: 'inset 0 1px 0 rgba(255,225,180,.6), 0 2px 0 #7A3E10',
}
const rowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '13px 6px', background: 'none', border: 'none', borderBottom: '1px solid rgba(20,22,26,.07)',
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left',
}

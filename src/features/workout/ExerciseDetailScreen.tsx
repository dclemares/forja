import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftRight, ChartLine, ClipboardList, Flame, History as HistoryIcon, MoreVertical, Plus, SlidersHorizontal, Table, Trash2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/GlassCard'
import { CoinBadge } from '@/components/ui/CoinBadge'
import { PillButton } from '@/components/ui/PillButton'
import { AppBar, iconBtn } from '@/components/ui/AppBar'
import { Tag } from '@/components/ui/Chip'
import { Stepper } from '@/components/ui/Stepper'
import { Sheet } from '@/components/ui/Sheet'
import { RestTimer } from '@/components/ui/RestTimer'
import { ExercisePicker } from './ExercisePicker'
import { LineChart } from '@/components/charts/Charts'
import { exerciseVolume, formatSetsSummary } from '@/lib/domain/volume'
import { exercisePR } from '@/lib/domain/prs'
import { formatDayMonth, formatNumber } from '@/lib/format'
import { getWeightStep, setWeightStep, WEIGHT_STEPS } from '@/lib/prefs'
import { playClick } from '@/lib/sound'
import type { WorkoutSet } from '@/lib/types'

const fmtKg = (n: number) => (Number.isInteger(n) ? String(n) : String(n).replace('.', ',')) + ' kg'

export function ExerciseDetailScreen() {
  const { id = '', weId = '' } = useParams()
  const navigate = useNavigate()
  const { state, ensurePrefill, addSet, updateSet, deleteSet, removeWorkoutExercise, replaceWorkoutExercise } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [wstep, setWstep] = useState(getWeightStep())
  const [metaSetId, setMetaSetId] = useState<string | null>(null)

  const workout = state.workouts.find((w) => w.id === id)
  const we = workout?.exercises.find((e) => e.id === weId)

  const cycleStep = () => {
    const next = WEIGHT_STEPS[(WEIGHT_STEPS.indexOf(wstep as (typeof WEIGHT_STEPS)[number]) + 1) % WEIGHT_STEPS.length]
    setWstep(next)
    setWeightStep(next)
    playClick()
  }

  useEffect(() => {
    if (we) ensurePrefill(id, weId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, weId])

  if (!workout || !we) {
    return (
      <div style={{ padding: 24 }}>
        <PillButton onClick={() => navigate(`/workout/${id}`)}>Volver</PillButton>
      </div>
    )
  }

  const history = state.workouts
    .filter((w) => w.id !== workout.id)
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseId === we.exerciseId && e.sets.length)
      return ex ? { date: w.date, sets: ex.sets, volume: exerciseVolume(ex) } : null
    })
    .filter((x): x is { date: string; sets: typeof we.sets; volume: number } => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const chartData = [
    ...history.map((h) => ({ label: formatDayMonth(h.date), value: h.volume })),
    { label: 'hoy', value: exerciseVolume(we) },
  ]

  const pr = exercisePR(we, state.workouts, id)
  const metaSet = metaSetId ? we.sets.find((s) => s.id === metaSetId) ?? null : null
  const hasSets = we.sets.length > 0
  const hasChartData = history.length > 0 || exerciseVolume(we) > 0

  return (
    <div className="anim-fade">
      <AppBar
        back
        onBack={() => navigate(`/workout/${id}`)}
        title={we.name}
        titleBadge={<Tag>{we.muscleGroup}</Tag>}
        right={<button aria-label="Opciones" style={iconBtn} onClick={() => setMenuOpen(true)}><MoreVertical size={20} /></button>}
      />

      <GlassCard style={{ padding: 15, marginBottom: 14 }}>
        <CardHeader icon={<ClipboardList size={16} />}>Series de hoy</CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={hint}><HistoryIcon size={13} /> Prerellenado con tu última vez</span>
          <button type="button" onClick={cycleStep} style={stepPill} aria-label="Cambiar paso de peso"><SlidersHorizontal size={12} /> Paso {fmtKg(wstep)}</button>
        </div>
        {hasSets && (
          <div style={{ ...gridHead }}>
            <span />
            <span style={{ textAlign: 'center' }}>Peso (kg)</span>
            <span style={{ textAlign: 'center' }}>Reps</span>
            <span />
          </div>
        )}
        {we.sets.map((s, i) => (
          <div key={s.id} className="anim-pop" style={{ marginTop: 9 }}>
            <div style={row}>
              <span style={sn}>{i + 1}</span>
              <Stepper kind="weight" step={wstep} value={s.weight} ariaLabel="peso" onChange={(v) => updateSet(id, weId, s.id, { weight: v })} />
              <Stepper kind="reps" step={1} value={s.reps} ariaLabel="reps" onChange={(v) => updateSet(id, weId, s.id, { reps: v })} />
              <button aria-label="Borrar serie" style={delBtn} onClick={() => deleteSet(id, weId, s.id)}><X size={16} /></button>
            </div>
            <button type="button" style={metaRow} onClick={() => setMetaSetId(s.id)}>
              {s.rpe != null && <span style={rpeChip}>RPE {s.rpe}</span>}
              {s.note ? <span style={noteTxt}>{s.note}</span> : null}
              {s.rpe == null && !s.note && <span style={{ color: 'var(--ink-faint)' }}>+ esfuerzo / nota</span>}
            </button>
          </div>
        ))}
        {!hasSets && <div style={{ color: 'var(--ink-faint)', fontSize: 14, textAlign: 'center', padding: '14px 2px 4px' }}>Aún no hay series. Pulsa “Añadir serie”.</div>}
        <PillButton full variant="tonal" icon={<Plus size={16} />} style={{ marginTop: 12 }} onClick={() => addSet(id, weId)}>
          Añadir serie
        </PillButton>
        {(pr.weight || pr.volume) && (
          <div style={prBanner} className="pr-fire">
            <FlameCrest />
            <Flame size={17} fill="#FFE07A" color="#7A2208" strokeWidth={2.2} className="pr-flame" />
            <span style={{ position: 'relative', zIndex: 1 }}>
              {pr.weight && pr.volume ? '¡Récord de peso y volumen!' : pr.weight ? '¡Récord de peso!' : '¡Récord de volumen!'}
            </span>
            <Flame size={17} fill="#FFE07A" color="#7A2208" strokeWidth={2.2} className="pr-flame" style={{ transform: 'scaleX(-1)' }} />
          </div>
        )}
        <div style={volRow}>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Volumen de hoy</span>
          <CoinBadge>{formatNumber(exerciseVolume(we))} kg</CoinBadge>
        </div>
      </GlassCard>

      {hasSets && <RestTimer trigger={we.sets.length} />}

      <GlassCard flat style={{ padding: 15, marginBottom: 14 }}>
        <CardHeader icon={<Table size={16} />}>Histórico de semanas anteriores</CardHeader>
        {history.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              <tr style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                <td style={td}>Fecha</td><td style={td}>Series</td><td style={{ ...td, textAlign: 'right' }}>Volumen</td>
              </tr>
              {[...history].reverse().map((h, i) => (
                <tr key={i}>
                  <td style={{ ...td, color: 'var(--ink-soft)' }}>{formatDayMonth(h.date)}</td>
                  <td style={td}>{formatSetsSummary(h.sets)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatNumber(h.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--ink-faint)', fontSize: 14 }}>Primera vez que haces este ejercicio.</div>
        )}
      </GlassCard>

      {hasChartData ? (
        <GlassCard flat style={{ padding: 15 }}>
          <CardHeader icon={<ChartLine size={16} />}>Volumen total del ejercicio</CardHeader>
          <LineChart data={chartData} />
          {history.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 6 }}>
              Primer registro · vuelve otra semana para ver tu evolución.
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard flat style={{ padding: 15 }}>
          <CardHeader icon={<ChartLine size={16} />}>Volumen total del ejercicio</CardHeader>
          <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13, padding: '6px 0 2px' }}>Registra alguna serie para empezar a ver tu evolución.</div>
        </GlassCard>
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones del ejercicio">
        <div style={{ paddingBottom: 8 }}>
          <button style={menuItem} onClick={() => { setMenuOpen(false); setPickerOpen(true) }}>
            <ArrowLeftRight size={19} color="var(--accent)" /> Quitar y sustituir por otro
          </button>
          <button style={{ ...menuItem, color: 'var(--danger)' }} onClick={() => { removeWorkoutExercise(id, weId); navigate(`/workout/${id}`) }}>
            <Trash2 size={19} /> Quitar ejercicio
          </button>
        </div>
      </Sheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        relatedMuscle={we.muscleGroup}
        title="Cambiar ejercicio"
        excludeIds={workout.exercises.map((e) => e.exerciseId).filter(Boolean) as string[]}
        onPick={(ex) => { replaceWorkoutExercise(id, weId, { exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup }); navigate(`/workout/${id}`) }}
      />

      <Sheet open={metaSet !== null} onClose={() => setMetaSetId(null)} title="Esfuerzo y nota">
        {metaSet && (
          <SetMetaEditor
            set={metaSet}
            onChange={(patch) => updateSet(id, weId, metaSet.id, patch)}
            onDone={() => setMetaSetId(null)}
          />
        )}
      </Sheet>
    </div>
  )
}

const RPE_OPTIONS: (number | null)[] = [null, 6, 7, 8, 9, 10]

function SetMetaEditor({ set, onChange, onDone }: { set: WorkoutSet; onChange: (patch: Partial<Pick<WorkoutSet, 'rpe' | 'note'>>) => void; onDone: () => void }) {
  return (
    <div style={{ padding: '4px 2px 12px' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Esfuerzo (RPE)</div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {RPE_OPTIONS.map((v) => {
          const active = (set.rpe ?? null) === v
          return (
            <button key={String(v)} type="button" onClick={() => { onChange({ rpe: v ?? undefined }); playClick() }} style={rpeOpt(active)}>
              {v == null ? '—' : v}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Nota</div>
      <input
        autoFocus={false}
        placeholder="p. ej. fallé en la 8, mejor técnica…"
        value={set.note ?? ''}
        onChange={(e) => onChange({ note: e.target.value })}
        style={noteInput}
      />
      <PillButton full size="lg" style={{ marginTop: 14 }} onClick={onDone}>Hecho</PillButton>
    </div>
  )
}

function CardHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={cardHead}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
      {children}
    </div>
  )
}

/** Cresta de llamas cartoon que asoma por el borde superior del cartel de récord. */
function FlameCrest() {
  const xs = [12, 38, 64, 90, 116, 142, 168, 194, 220, 246, 272, 296]
  return (
    <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 19, transform: 'translateY(-58%)', pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(120,30,8,.35))' }}>
      <defs>
        <g id="ft">
          <path d="M0,0 C5.5,7 7.5,11 5.5,16 C4.5,21 2,24 0,24 C-2,24 -4.5,21 -5.5,16 C-7.5,11 -5.5,7 0,0 Z" fill="#F0531E" />
          <path d="M0,6 C3,10 4,13.5 3,17.5 C2,21 1,23.5 0,23.5 C-1,23.5 -2,21 -3,17.5 C-4,13.5 -3,10 0,6 Z" fill="#FFD24A" />
        </g>
      </defs>
      {xs.map((x, i) => (
        <g key={i} transform={`translate(${x},${i % 2 ? 3 : 0}) scale(${1.5 - (i % 3) * 0.2})`}>
          <use href="#ft" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', animation: `flame ${0.8 + (i % 3) * 0.12}s ease-in-out ${(i % 4) * 0.1}s infinite` }} />
        </g>
      ))}
    </svg>
  )
}

const cardHead: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--hairline)' }
const hint: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 11, padding: '5px 11px', borderRadius: 13, marginBottom: 4 }
const gridHead: React.CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr 40px', gap: 8, fontSize: 11, color: 'var(--ink-soft)', marginTop: 11, padding: '0 2px' }
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr 40px', gap: 8, alignItems: 'center' }
const stepPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1.5px solid var(--hairline)', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--ink-soft)', background: 'rgba(120,80,30,.06)', flex: 'none' }
const metaRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%', padding: '5px 2px 0 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'left' }
const rpeChip: React.CSSProperties = { background: 'var(--accent-tint)', color: 'var(--accent)', fontWeight: 800, fontSize: 11, padding: '2px 8px', borderRadius: 999 }
const noteTxt: React.CSSProperties = { color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }
const prBanner: React.CSSProperties = { position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 18, padding: '9px 14px', borderRadius: 12, fontSize: 14, fontWeight: 800, color: '#FFF3D8', background: 'linear-gradient(180deg,#FFCE3E 0%,#FF8A1E 55%,#EF4E1E 100%)', border: '3px solid #8A2A0A', textShadow: '0 1px 0 rgba(120,30,8,.7), 0 2px 4px rgba(110,25,6,.45)', boxShadow: 'inset 0 1px 0 rgba(255,240,200,.5), 0 0 14px rgba(255,120,30,.55)' }
const rpeOpt = (active: boolean): React.CSSProperties => ({ minWidth: 44, padding: '9px 0', flex: 1, border: '2px solid #7A4A12', borderRadius: 11, fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', color: active ? '#4A2E10' : '#6E4423', background: active ? 'linear-gradient(180deg,#FFD75C,#EDA31E)' : 'linear-gradient(180deg,#F0E2C0,#E3CE9E)', boxShadow: active ? 'inset 0 1px 0 rgba(255,245,210,.7)' : 'none' })
const noteInput: React.CSSProperties = { width: '100%', background: 'linear-gradient(180deg,#F8EDCF,#ECDDB6)', border: '2px solid #9A6A3A', borderRadius: 12, padding: '12px', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(80,50,20,.2)' }
const sn: React.CSSProperties = { textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 500 }
const delBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const volRow: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 13, paddingTop: 12, borderTop: '1px solid rgba(20,22,26,.1)' }
const td: React.CSSProperties = { padding: '8px 0', borderBottom: '1px solid rgba(20,22,26,.07)' }
const menuItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', textAlign: 'left' }

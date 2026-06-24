import { useNavigate } from 'react-router-dom'
import { AppBar } from '@/components/ui/AppBar'
import { MetricProgress } from '@/features/progress/MetricProgress'

/** Progreso de calorías y macros (reutiliza MetricProgress, limitado a nutrición). */
export function NutritionProgressScreen() {
  const navigate = useNavigate()
  return (
    <div className="anim-fade">
      <AppBar back onBack={() => navigate('/nutrition')} title="Progreso nutricional" />
      <MetricProgress metrics={['kcal', 'protein', 'carbs', 'fat']} defaultMetric="kcal" />
    </div>
  )
}

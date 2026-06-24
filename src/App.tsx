import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatedBackground } from './components/ui/AnimatedBackground'
import { BottomNav } from './components/ui/BottomNav'
import { UpdatePrompt } from './components/ui/UpdatePrompt'
import { TodayScreen } from './features/today/TodayScreen'
import { SessionsScreen } from './features/sessions/SessionsScreen'
import { SessionDetailScreen } from './features/sessions/SessionDetailScreen'
import { ExercisesScreen } from './features/exercises/ExercisesScreen'
import { ExerciseProgressScreen } from './features/exercises/ExerciseProgressScreen'
import { WorkoutDetailScreen } from './features/history/WorkoutDetailScreen'
import { ProgressScreen } from './features/progress/ProgressScreen'
import { BodyweightScreen } from './features/bodyweight/BodyweightScreen'
import { WorkoutScreen } from './features/workout/WorkoutScreen'
import { ExerciseDetailScreen } from './features/workout/ExerciseDetailScreen'
import { NutritionScreen } from './features/nutrition/NutritionScreen'
import { FoodsScreen } from './features/nutrition/FoodsScreen'
import { MealsScreen } from './features/nutrition/MealsScreen'

function RootLayout() {
  const { pathname } = useLocation()
  const fullscreen = pathname.startsWith('/workout')
  return (
    <>
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <main style={{ padding: '8px 14px', paddingBottom: fullscreen ? 28 : 104, minHeight: '100svh' }}>
          <Outlet />
        </main>
        {!fullscreen && <BottomNav />}
      </div>
      <UpdatePrompt />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/sessions" element={<SessionsScreen />} />
        <Route path="/sessions/:id" element={<SessionDetailScreen />} />
        <Route path="/exercises" element={<ExercisesScreen />} />
        <Route path="/exercises/:id" element={<ExerciseProgressScreen />} />
        <Route path="/history/:id" element={<WorkoutDetailScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/bodyweight" element={<BodyweightScreen />} />
        <Route path="/nutrition" element={<NutritionScreen />} />
        <Route path="/nutrition/foods" element={<FoodsScreen />} />
        <Route path="/nutrition/meals" element={<MealsScreen />} />
        <Route path="/workout/:id" element={<WorkoutScreen />} />
        <Route path="/workout/:id/ex/:weId" element={<ExerciseDetailScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

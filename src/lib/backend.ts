import { supabase } from './supabase'
import type { AppState } from './store'

/** Carga el estado del usuario desde Supabase (null si aún no tiene). */
export async function loadState(userId: string): Promise<AppState | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('app_state').select('data').eq('user_id', userId).maybeSingle()
  if (error) {
    console.error('loadState', error)
    return null
  }
  return (data?.data as AppState) ?? null
}

/** Guarda (upsert) el estado completo del usuario. */
export async function saveState(userId: string, state: AppState): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('app_state')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) console.error('saveState', error)
}

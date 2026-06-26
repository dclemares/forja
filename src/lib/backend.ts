import { supabase } from './supabase'
import type { AppState } from './store'

/** Resultado de cargar: distingue "no hay fila" (state null) de un ERROR de lectura.
 *  Es crucial no confundirlos: tratar un error como "cuenta vacía" llevaría a
 *  sobrescribir los datos buenos con un estado vacío. */
export type LoadResult = { ok: true; state: AppState | null } | { ok: false }

/** Carga el estado del usuario desde Supabase. */
export async function loadState(userId: string): Promise<LoadResult> {
  if (!supabase) return { ok: true, state: null }
  try {
    const { data, error } = await supabase.from('app_state').select('data').eq('user_id', userId).maybeSingle()
    if (error) {
      console.error('loadState', error)
      return { ok: false }
    }
    return { ok: true, state: (data?.data as AppState) ?? null }
  } catch (e) {
    console.error('loadState (excepción)', e)
    return { ok: false }
  }
}

/** Guarda (upsert) el estado completo del usuario. */
export async function saveState(userId: string, state: AppState): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('app_state')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) console.error('saveState', error)
}

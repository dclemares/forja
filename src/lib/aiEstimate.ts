import { isSupabaseConfigured } from './supabase'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** El botón "Foto (IA)" solo aparece si está habilitado (función desplegada).
 *  Activar con VITE_AI_PHOTO=1 una vez desplegada la Edge Function `estimate-meal`. */
export const aiPhotoEnabled = (): boolean => import.meta.env.VITE_AI_PHOTO === '1' && isSupabaseConfigured

export interface MealEstimate {
  label: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  confidence: string
}

/** Reescala una imagen a ≤maxPx y la comprime a JPEG (controla coste y payload). */
export async function fileToScaledBase64(file: File, maxPx = 1024): Promise<{ data: string; mediaType: string; previewUrl: string }> {
  const previewUrl = URL.createObjectURL(file)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = previewUrl
  })
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  return { data: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg', previewUrl: dataUrl }
}

export async function estimateMeal(input: { imageBase64: string; mediaType: string; note: string }): Promise<MealEstimate> {
  const r = await fetch(`${url}/functions/v1/estimate-meal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${anon ?? ''}`, apikey: anon ?? '' },
    body: JSON.stringify(input),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((d as { error?: string })?.error || 'No se pudo estimar la comida')
  return d as MealEstimate
}

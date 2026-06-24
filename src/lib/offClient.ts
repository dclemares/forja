import type { Macros } from './types'

/** Resultado de Open Food Facts ya mapeado a nuestro formato (macros por 100 g). */
export interface OffFood {
  code?: string
  name: string
  brand?: string
  per100: Macros
  serving?: number
  servingLabel?: string
}

const OFF = 'https://world.openfoodfacts.org/api/v2'
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const round1 = (n: number): number => Math.round(n * 10) / 10

interface OffProduct {
  code?: string
  product_name?: string
  brands?: string
  nutriments?: Record<string, number | string>
  serving_size?: string
  serving_quantity?: number | string
}

function mapProduct(p: OffProduct): OffFood | null {
  const name = (p.product_name ?? '').trim()
  if (!name) return null
  const nut = p.nutriments ?? {}
  let kcal = nut['energy-kcal_100g']
  if (typeof kcal !== 'number') {
    const kj = nut['energy_100g']
    if (typeof kj === 'number') kcal = kj / 4.184
  }
  const sq = typeof p.serving_quantity === 'string' ? parseFloat(p.serving_quantity) : p.serving_quantity
  const serving = typeof sq === 'number' && Number.isFinite(sq) && sq > 0 ? Math.round(sq) : undefined
  const servingLabel = (p.serving_size ?? '').trim() || undefined
  return {
    code: p.code,
    name,
    brand: (p.brands ?? '').split(',')[0]?.trim() || undefined,
    per100: {
      kcal: Math.round(num(kcal)),
      protein: round1(num(nut['proteins_100g'])),
      carbs: round1(num(nut['carbohydrates_100g'])),
      fat: round1(num(nut['fat_100g'])),
    },
    serving,
    servingLabel,
  }
}

/** Busca un producto por código de barras (EAN/UPC). Devuelve null si no existe o no tiene nutrición. */
export async function lookupBarcode(ean: string): Promise<OffFood | null> {
  try {
    const r = await fetch(`${OFF}/product/${encodeURIComponent(ean)}.json?fields=code,product_name,brands,nutriments,serving_size,serving_quantity`)
    if (!r.ok) return null
    const d = (await r.json()) as { status?: number; product?: OffProduct }
    if (!d.product) return null
    const f = mapProduct(d.product)
    return f && f.per100.kcal > 0 ? f : f // permitir 0 kcal: el usuario podrá corregir
  } catch {
    return null
  }
}

/** Busca alimentos por texto. Usa el buscador de texto completo (cgi/search.pl):
 *  el endpoint v2 /search NO filtra por `search_terms`. Devuelve los que tengan
 *  nombre y calorías. */
export async function searchFoods(query: string): Promise<OffFood[]> {
  const q = query.trim()
  if (q.length < 2) return []
  try {
    const r = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,serving_size,serving_quantity`,
    )
    if (!r.ok) return []
    const d = (await r.json()) as { products?: OffProduct[] }
    return (d.products ?? [])
      .map(mapProduct)
      .filter((f): f is OffFood => f !== null && f.per100.kcal > 0)
  } catch {
    return []
  }
}

/** El escáner funciona allí donde haya cámara (getUserMedia); usamos zxing
 *  bajo demanda, así que no depende del soporte nativo de BarcodeDetector. */
export const barcodeScanSupported = (): boolean =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'

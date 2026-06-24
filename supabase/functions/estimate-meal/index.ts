// Edge Function (Deno): estima calorías y macros de una comida a partir de una
// foto + descripción, usando modelos de visión vía endpoints compatibles-OpenAI.
//
// FALLBACK MULTI-PROVEEDOR: prueba los modelos de Groq y de Gemini en orden hasta
// que uno responda. Dos tiers GRATIS independientes = mucha más fiabilidad (si a
// uno se le acaba la cuota, salta al otro solo).
//
// Secretos (Supabase) — basta con tener al menos una clave:
//   supabase secrets set GROQ_API_KEY=<clave_gratis_de_groq>      # console.groq.com
//   supabase secrets set GEMINI_API_KEY=<clave_gratis_de_gemini>  # aistudio.google.com
//   # (AI_API_KEY se sigue aceptando como clave de Gemini, por compatibilidad)
//   # opcionales: GROQ_MODELS / GEMINI_MODELS para cambiar la lista de modelos.
// Despliegue:  supabase functions deploy estimate-meal
//
// Las claves viven SOLO aquí (servidor); nunca llegan al cliente.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

const splitList = (s: string): string[] => s.split(',').map((x) => x.trim()).filter(Boolean)

interface Provider {
  name: string
  baseUrl: string
  key?: string
  models: string[]
}

// Orden de proveedores: Groq primero (Llama 4 Scout); si falla, Gemini de respaldo.
const PROVIDERS: Provider[] = [
  {
    name: 'groq',
    baseUrl: (Deno.env.get('GROQ_BASE_URL') ?? 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
    key: Deno.env.get('GROQ_API_KEY'),
    models: splitList(Deno.env.get('GROQ_MODELS') ?? 'meta-llama/llama-4-scout-17b-16e-instruct'),
  },
  {
    name: 'gemini',
    baseUrl: (Deno.env.get('GEMINI_BASE_URL') ?? Deno.env.get('AI_BASE_URL') ?? 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, ''),
    key: Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('AI_API_KEY'),
    models: splitList(Deno.env.get('GEMINI_MODELS') ?? Deno.env.get('AI_MODELS') ?? Deno.env.get('AI_MODEL') ?? 'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash'),
  },
]

// Lista plana de intentos (proveedor + modelo), solo de proveedores que tengan clave.
const ATTEMPTS = PROVIDERS.filter((p) => p.key).flatMap((p) => p.models.map((model) => ({ provider: p, model })))

const SYSTEM = [
  'Eres un estimador nutricional a partir de DOS fotos del mismo plato: una CENITAL (desde arriba) y otra LATERAL (de lado), más la descripción del usuario. Sigue este método sin saltarte pasos.',
  '1) IDENTIFICA cada alimento e indica si está CRUDO o COCIDO. Clave: arroz, pasta y legumbre CRUDOS tienen ~3× más kcal por gramo que cocidos; no los confundas.',
  '2) ESCALA: busca un objeto de tamaño conocido en las fotos y úsalo de referencia (moneda de 1€ ≈ 23 mm, cuchara/tenedor ≈ 19-20 cm, plato llano ≈ 26 cm, lata ≈ 33 cl, móvil ≈ 14-16 cm, mano adulta ≈ 18 cm). Si dudas cuál es, asume el caso intermedio y dilo.',
  '3) CALCULA, no estimes a ojo: usa la foto CENITAL para el ÁREA y la LATERAL para el GROSOR. peso ≈ área(cm²) × grosor(cm) × densidad(g/cm³). Densidades aprox.: arroz/legumbre crudos ~0,85 · arroz/pasta cocidos ~0,8 · pan aireado ~0,3 · carne/pescado ~1,05 · verdura ~0,6 · salsa/aceite ~0,95.',
  '4) SANITY CHECK: contrasta con una ración normal (arroz seco 60-80 g, pasta seca 70-100 g, pan 50-90 g, pechuga 150-250 g, guarnición de verdura 100-200 g). Si te sale el doble de lo típico sin motivo claro, probablemente te has pasado: corrige.',
  'En "description" describe en 1-2 frases lo que ves (alimentos, y si están crudos o cocidos), SIN cálculos. Empieza con "Veo…".',
  'En "reasoning" explica el cálculo en 2-5 frases: la escala usada, el área (por la cenital) y el grosor (por la lateral), la densidad y el peso resultante, y el RANGO de incertidumbre. Si una foto falta o no se aprecia el grosor, dilo y usa "confidence":"baja".',
  'DESGLOSA en "items": un objeto por ingrediente (nombre, gramos, kcal y macros), con tu MEJOR estimación (el centro del rango) para la cantidad que se ve. Devuelve SIEMPRE al menos un ingrediente; nunca lo dejes vacío.',
  'Los totales (grams, kcal, protein, carbs, fat) deben ser la SUMA de los items. Todo para la ración COMPLETA (no por 100 g).',
  'Responde EXCLUSIVAMENTE un objeto JSON con estas claves exactas:',
  '{"description": string, "reasoning": string, "label": string (nombre corto del plato en español), "items": [{"name": string, "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number}], "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number, "confidence": "baja"|"media"|"alta"}.',
  'Sin texto adicional, sin markdown, solo el JSON.',
].join('\n')

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0
}
const confidenceOf = (v: unknown): string => (['baja', 'media', 'alta'].includes(String(v)) ? String(v) : 'media')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  if (ATTEMPTS.length === 0) return json({ error: 'Falta una clave de IA en el servidor (GROQ_API_KEY o GEMINI_API_KEY).' }, 500)

  let body: { imageBase64?: string; mediaType?: string; imageBase64Side?: string; mediaTypeSide?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido.' }, 400)
  }
  if (!body.imageBase64) return json({ error: 'Falta la imagen.' }, 400)

  const note = (body.note ?? '').trim()
  const topUrl = `data:${body.mediaType || 'image/jpeg'};base64,${body.imageBase64}`
  const sideUrl = body.imageBase64Side ? `data:${body.mediaTypeSide || 'image/jpeg'};base64,${body.imageBase64Side}` : null

  const userContent: Array<Record<string, unknown>> = [
    { type: 'text', text: `Descripción del usuario: "${note || '(sin descripción)'}". Foto 1 = CENITAL (desde arriba)${sideUrl ? '. Foto 2 = LATERAL (de lado)' : ' (no se aportó foto lateral)'}. Estima la ración.` },
    { type: 'image_url', image_url: { url: topUrl } },
  ]
  if (sideUrl) userContent.push({ type: 'image_url', image_url: { url: sideUrl } })

  const messages = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: userContent,
    },
  ]

  try {
    let d: { choices?: { message?: { content?: string } }[] } | null = null
    let used: { provider: string; model: string } | null = null
    let lastInfo = ''
    // Una llamada por (proveedor, modelo): si falla, pasa al siguiente. Groq y
    // Gemini tienen cuota/capacidad independientes → mucha más fiabilidad.
    for (const { provider, model } of ATTEMPTS) {
      const r = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${provider.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, temperature: 0.2, max_tokens: 1500, response_format: { type: 'json_object' }, messages }),
      })
      if (r.ok) {
        d = await r.json().catch(() => ({}))
        used = { provider: provider.name, model }
        break
      }
      const raw = (await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 140)
      lastInfo += `[${provider.name}/${model} ${r.status}: ${raw}] `
    }
    if (!d) return json({ error: 'Los modelos gratis están saturados ahora mismo. Inténtalo de nuevo en unos segundos.', detail: lastInfo }, 503)

    let text = (d?.choices?.[0]?.message?.content ?? '').trim()
    // Quita fences de markdown si el modelo los añade (```json ... ```).
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = JSON.parse(text)
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      try {
        parsed = m ? JSON.parse(m[0]) : null
      } catch {
        parsed = null
      }
    }
    if (!parsed) return json({ error: 'La IA no devolvió un resultado legible. Inténtalo de nuevo.', raw: text.slice(0, 300) }, 502)

    // Desglose por ingredientes. Los totales se derivan de la suma de los items
    // (si hay), para que el desglose y el total siempre cuadren.
    const rawItems = Array.isArray(parsed.items) ? (parsed.items as Record<string, unknown>[]) : []
    const items = rawItems
      .map((it) => ({
        name: String(it?.name ?? '').slice(0, 60),
        grams: num(it?.grams),
        kcal: num(it?.kcal),
        protein: num(it?.protein),
        carbs: num(it?.carbs),
        fat: num(it?.fat),
      }))
      .filter((it) => it.name)
      .slice(0, 15)
    const hasItems = items.length > 0
    const sum = (sel: (it: (typeof items)[number]) => number): number => Math.round(items.reduce((a, it) => a + sel(it), 0))

    return json(
      {
        provider: used?.provider ?? '',
        model: used?.model ?? '',
        description: String(parsed.description ?? '').slice(0, 500),
        reasoning: String(parsed.reasoning ?? '').slice(0, 900),
        label: String(parsed.label ?? 'Comida').slice(0, 80),
        items,
        grams: hasItems ? sum((it) => it.grams) : num(parsed.grams),
        kcal: hasItems ? sum((it) => it.kcal) : num(parsed.kcal),
        protein: hasItems ? sum((it) => it.protein) : num(parsed.protein),
        carbs: hasItems ? sum((it) => it.carbs) : num(parsed.carbs),
        fat: hasItems ? sum((it) => it.fat) : num(parsed.fat),
        confidence: confidenceOf(parsed.confidence),
      },
      200,
    )
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

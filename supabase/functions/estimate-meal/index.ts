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
  /** Parámetros extra específicos del proveedor para el cuerpo de la petición. */
  extra?: Record<string, unknown>
}

// Orden de proveedores: Gemini primero (Google); si falla, Groq de respaldo.
const PROVIDERS: Provider[] = [
  {
    name: 'gemini',
    baseUrl: (Deno.env.get('GEMINI_BASE_URL') ?? Deno.env.get('AI_BASE_URL') ?? 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, ''),
    key: Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('AI_API_KEY'),
    models: splitList(Deno.env.get('GEMINI_MODELS') ?? Deno.env.get('AI_MODELS') ?? Deno.env.get('AI_MODEL') ?? 'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash'),
    // Limita el "pensamiento" interno de Gemini 2.5: más rápido y evita que se
    // coma el presupuesto de tokens y trunque el JSON.
    extra: { reasoning_effort: 'low' },
  },
  {
    name: 'groq',
    baseUrl: (Deno.env.get('GROQ_BASE_URL') ?? 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
    key: Deno.env.get('GROQ_API_KEY'),
    models: splitList(Deno.env.get('GROQ_MODELS') ?? 'meta-llama/llama-4-scout-17b-16e-instruct'),
  },
]

// Lista plana de intentos (proveedor + modelo), solo de proveedores que tengan clave.
const ATTEMPTS = PROVIDERS.filter((p) => p.key).flatMap((p) => p.models.map((model) => ({ provider: p, model })))

const SYSTEM = [
  'Eres un estimador nutricional. Recibes, según disponga el usuario: una foto CENITAL (desde arriba), una foto LATERAL (de lado) y/o una descripción de la comida. Usa lo que haya. Si no hay ninguna foto, estima a partir de la descripción y raciones típicas, con la confianza acorde. Sigue este método sin saltarte pasos.',
  '1) IDENTIFICA cada alimento, si está CRUDO o COCIDO (arroz/pasta/legumbre crudos ~3× más kcal/g que cocidos) y el RECIPIENTE: un plato HONDO o BOL contiene mucho más que un plato llano para la misma área vista desde arriba; tenlo muy en cuenta en fotos cenitales.',
  '2) ESCALA: busca un objeto de tamaño conocido y úsalo de referencia (moneda de 1€ ≈ 23 mm, cuchara/tenedor ≈ 19-20 cm, plato llano ≈ 26 cm, lata ≈ 33 cl, móvil ≈ 14-16 cm, mano adulta ≈ 18 cm). Si dudas cuál es, asume el caso intermedio y dilo.',
  '3) CANTIDAD: parte del reconocimiento del alimento, su RACIÓN TÍPICA y el LLENADO del recipiente; usa la geometría (área de la cenital × grosor de la lateral × densidad) como CONTROL para cuadrar, no como verdad absoluta. Densidades aprox.: arroz/legumbre crudos ~0,85 · arroz/pasta cocidos ~0,8 · pan aireado ~0,3 · carne/pescado ~1,05 · verdura ~0,6 · salsa/aceite ~0,95.',
  '4) GRASA OCULTA: añade el aceite de cocción según el método (es lo que más se infravalora): frito/rebozado +10-20 g, salteado +5-10 g, plancha/horno +2-5 g.',
  '5) COHERENCIA: para CADA ingrediente, las kcal deben cuadrar con sus macros: kcal ≈ 4·proteína + 4·carbos + 9·grasa. Usa valores nutricionales estándar por 100 g.',
  '6) REVISA antes de responder: ¿recipiente hondo?, ¿aceite oculto?, ¿kcal cuadra con macros?, ¿total plausible (una comida suele ser 300-900 kcal)?; contrasta con raciones normales (arroz seco 60-80 g, pasta seca 70-100 g, pan 50-90 g, pechuga 150-250 g, verdura 100-200 g) y corrige lo que no cuadre.',
  'Sé BREVE y conciso en los textos (no te enrolles).',
  'En "description" describe en 1-2 frases lo que ves (alimentos, y si están crudos o cocidos), SIN cálculos. Empieza con "Veo…".',
  'En "reasoning" explica el cálculo en máximo 3 frases: la escala usada, el grosor/volumen, la densidad y el peso, y el RANGO de incertidumbre. Si falta una foto o no se aprecia el grosor, dilo y usa "confidence":"baja".',
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
  const note = (body.note ?? '').trim()
  const shots: { label: string; url: string }[] = []
  if (body.imageBase64) shots.push({ label: 'CENITAL (desde arriba)', url: `data:${body.mediaType || 'image/jpeg'};base64,${body.imageBase64}` })
  if (body.imageBase64Side) shots.push({ label: 'LATERAL (de lado)', url: `data:${body.mediaTypeSide || 'image/jpeg'};base64,${body.imageBase64Side}` })

  if (shots.length === 0 && !note) return json({ error: 'Aporta al menos una foto o una descripción.' }, 400)

  const intro =
    shots.length === 0
      ? `Descripción del usuario: "${note}". No hay foto; estima a partir de la descripción y raciones típicas.`
      : `Descripción del usuario: "${note || '(sin descripción)'}". ${shots.map((s, i) => `Foto ${i + 1} = ${s.label}`).join('. ')}. Estima la ración.`

  const userContent: Array<Record<string, unknown>> = [{ type: 'text', text: intro }]
  for (const s of shots) userContent.push({ type: 'image_url', image_url: { url: s.url } })

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
        body: JSON.stringify({ model, temperature: 0.2, max_tokens: 5000, response_format: { type: 'json_object' }, messages, ...(provider.extra ?? {}) }),
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
      .map((it) => {
        const protein = num(it?.protein)
        const carbs = num(it?.carbs)
        const fat = num(it?.fat)
        let kcal = num(it?.kcal)
        // Coherencia Atwater: si las kcal del modelo se desvían >30% de las que
        // dan sus macros (4·prot + 4·carb + 9·grasa), usa las de los macros
        // (más fiables) para evitar cifras incoherentes.
        const atwater = Math.round(4 * protein + 4 * carbs + 9 * fat)
        if (atwater > 0 && Math.abs(kcal - atwater) > 0.3 * Math.max(kcal, atwater)) kcal = atwater
        return { name: String(it?.name ?? '').slice(0, 60), grams: num(it?.grams), kcal, protein, carbs, fat }
      })
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

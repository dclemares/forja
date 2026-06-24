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
  'Eres un nutricionista que estima raciones a partir de una foto y una descripción.',
  'Combina ambas: la FOTO te da el tamaño y el volumen de la porción, y la DESCRIPCIÓN del usuario te dice qué es y cómo está cocinado.',
  'ESCALA: para calcular las cantidades, fíjate en el TAMAÑO y el VOLUMEN usando objetos de referencia visibles para calibrar. Tamaños típicos: moneda de 1€ ≈ 23 mm, cuchara/tenedor ≈ 19-20 cm, plato llano ≈ 26 cm, lata ≈ 33 cl, vaso ≈ 8 cm de alto, móvil ≈ 14-16 cm, mano adulta ≈ 18 cm. Si la descripción menciona un objeto y su medida (p. ej. "un mando de 16 cm"), úsalo como regla.',
  'Con esa escala, estima las dimensiones y el volumen de cada alimento y, según su densidad típica, deduce su peso en gramos.',
  'En "description" DESCRIBE en español lo que ves en el plato: los alimentos y su presentación, en 1-3 frases, SIN cálculos. Empieza con "Veo…".',
  'En "reasoning" explica en español CÓMO CALCULAS LOS PESOS (2-5 frases): qué objeto de referencia usas y qué escala deduces, el tamaño/volumen de cada alimento, su densidad típica y el peso en gramos resultante. Ten en cuenta aceites, salsas y rebozados, que suman bastante.',
  'DESGLOSA el plato en sus ingredientes principales. En "items" devuelve un array con un objeto por ingrediente (p. ej. arroz, pollo, aceite…), cada uno con su nombre, gramos, kcal y macros para la cantidad que se ve.',
  'Los totales (grams, kcal, protein, carbs, fat) deben ser la SUMA de los items. Todo para la ración COMPLETA que se ve (no por 100 g).',
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

  let body: { imageBase64?: string; mediaType?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido.' }, 400)
  }
  if (!body.imageBase64) return json({ error: 'Falta la imagen.' }, 400)

  const note = (body.note ?? '').trim()
  const dataUrl = `data:${body.mediaType || 'image/jpeg'};base64,${body.imageBase64}`

  const messages = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Descripción del usuario: "${note || '(sin descripción)'}". Estima la ración de la foto.` },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
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

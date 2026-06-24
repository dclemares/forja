// Edge Function (Deno): estima calorías y macros de una comida a partir de una
// foto + descripción, usando un modelo de visión vía endpoint compatible-OpenAI.
//
// Por defecto usa Gemini (tier GRATIS de Google AI Studio). Como el endpoint es
// compatible-OpenAI, cambiar de proveedor (Groq, Qwen, GLM…) es solo config:
// basta con cambiar los secretos AI_BASE_URL / AI_MODEL / AI_API_KEY.
//
// Secretos (Supabase):
//   supabase secrets set AI_API_KEY=<tu_clave_gratis>
//   # opcionales (con estos valores por defecto apunta a Gemini):
//   supabase secrets set AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
//   supabase secrets set AI_MODEL=gemini-2.5-flash
// Despliegue:
//   supabase functions deploy estimate-meal
//
// La clave vive SOLO aquí (servidor); nunca llega al cliente.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

const BASE_URL = (Deno.env.get('AI_BASE_URL') ?? 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '')
// Cadena de modelos: si el primero está saturado (503), prueba el siguiente.
// Cada modelo tiene capacidad/cuota separada, así que el fallback sube mucho el éxito.
const MODELS = (Deno.env.get('AI_MODELS') ?? Deno.env.get('AI_MODEL') ?? 'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash,gemini-2.0-flash-lite')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const SYSTEM = [
  'Eres un nutricionista que estima raciones a partir de una foto y una descripción.',
  'Combina ambas: la FOTO te da la cantidad/porción que se ve, y la DESCRIPCIÓN del usuario te dice qué es y cómo está cocinado.',
  'En "reasoning" RAZONA en español (2-4 frases): qué alimentos identificas, su cantidad aproximada en gramos por componente, y cómo llegas a las calorías. Empieza con "Veo…"/"Parece…". Ten en cuenta aceites, salsas y rebozados, que suman bastante.',
  'Luego estima de forma APROXIMADA, para la ración COMPLETA que se ve (no por 100 g): el peso total en gramos, las calorías totales y los macros en gramos.',
  'Responde EXCLUSIVAMENTE un objeto JSON con estas claves exactas:',
  '{"reasoning": string, "label": string (nombre corto del plato en español), "grams": number (peso total estimado de la ración, en gramos), "kcal": number, "protein": number, "carbs": number, "fat": number, "confidence": "baja"|"media"|"alta"}.',
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

  const key = Deno.env.get('AI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'Falta AI_API_KEY en el servidor.' }, 500)

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
    let lastInfo = ''
    // Una llamada por modelo (sin reintento interno, para no quemar cuota). Si un
    // modelo falla, pasa al siguiente: cada uno tiene capacidad/cuota separada.
    for (const model of MODELS) {
      const r = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, temperature: 0.2, max_tokens: 1200, response_format: { type: 'json_object' }, messages }),
      })
      if (r.ok) {
        d = await r.json().catch(() => ({}))
        break
      }
      const raw = (await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160)
      lastInfo += `[${model} ${r.status}: ${raw}] `
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

    return json(
      {
        reasoning: String(parsed.reasoning ?? '').slice(0, 600),
        label: String(parsed.label ?? 'Comida').slice(0, 80),
        grams: num(parsed.grams),
        kcal: num(parsed.kcal),
        protein: num(parsed.protein),
        carbs: num(parsed.carbs),
        fat: num(parsed.fat),
        confidence: confidenceOf(parsed.confidence),
      },
      200,
    )
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

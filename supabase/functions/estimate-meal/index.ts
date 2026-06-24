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
const MODEL = Deno.env.get('AI_MODEL') ?? 'gemini-2.0-flash'

const SYSTEM = [
  'Eres un nutricionista que estima raciones a partir de una foto y una descripción.',
  'Combina ambas: la FOTO te da la cantidad/porción que se ve, y la DESCRIPCIÓN del usuario te dice qué es y cómo está cocinado.',
  'Estima de forma APROXIMADA las calorías totales y los macros (en gramos) de la ración COMPLETA que se ve (no por 100 g).',
  'Responde EXCLUSIVAMENTE un objeto JSON con estas claves exactas:',
  '{"label": string (nombre corto del plato en español), "kcal": number, "protein": number, "carbs": number, "fat": number, "confidence": "baja"|"media"|"alta"}.',
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

  const reqBody = JSON.stringify({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Descripción del usuario: "${note || '(sin descripción)'}". Estima la ración de la foto.` },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  })

  try {
    // El tier gratis devuelve 429/503 ("modelo saturado") de forma intermitente: reintenta.
    let d: { choices?: { message?: { content?: string } }[] } | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: reqBody,
      })
      if (r.ok) {
        d = await r.json().catch(() => ({}))
        break
      }
      // 429 = límite de ritmo: reintentar quemaría más cuota → aviso claro y salir.
      if (r.status === 429) {
        return json({ error: 'Demasiadas peticiones seguidas. Espera unos segundos y vuelve a intentarlo.' }, 429)
      }
      // 500/502/503 = sobrecarga transitoria del modelo: reintenta con espera.
      if ((r.status === 500 || r.status === 502 || r.status === 503) && attempt < 2) {
        await new Promise((res) => setTimeout(res, 700 * (attempt + 1)))
        continue
      }
      const err = await r.json().catch(() => ({}))
      return json({ error: err?.error?.message || `Error del modelo (${r.status})` }, 502)
    }
    if (!d) return json({ error: 'El modelo está saturado. Inténtalo de nuevo en unos segundos.' }, 503)

    const text: string = d?.choices?.[0]?.message?.content ?? ''
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = JSON.parse(text)
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      parsed = m ? JSON.parse(m[0]) : null
    }
    if (!parsed) return json({ error: 'Respuesta no interpretable.' }, 502)

    return json(
      {
        label: String(parsed.label ?? 'Comida').slice(0, 80),
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

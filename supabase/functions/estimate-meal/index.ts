// Edge Function (Deno): estima calorías y macros de una comida a partir de una
// foto + descripción, usando Claude (visión) con salida estructurada.
//
// Secreto requerido:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Despliegue:         supabase functions deploy estimate-meal
//
// La clave de Anthropic vive SOLO aquí (servidor); nunca llega al cliente.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

// Modelo por defecto. Para abaratar, cambia a 'claude-haiku-4-5'.
const MODEL = 'claude-opus-4-8'

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    label: { type: 'string' },
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    confidence: { type: 'string', enum: ['baja', 'media', 'alta'] },
  },
  required: ['label', 'kcal', 'protein', 'carbs', 'fat', 'confidence'],
}

const prompt = (note: string) =>
  `Eres un nutricionista. A partir de la foto del plato y la nota del usuario, estima de forma APROXIMADA las calorías totales y los macros (en gramos) de la ración que se ve en la imagen (no por 100 g).\n` +
  `Nota del usuario: "${note || '(sin nota)'}".\n` +
  `"label" = nombre corto del plato en español. "confidence" = tu confianza en la estimación. Devuelve solo el JSON del esquema.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return json({ error: 'Falta ANTHROPIC_API_KEY en el servidor.' }, 500)

  let body: { imageBase64?: string; mediaType?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido.' }, 400)
  }
  if (!body.imageBase64) return json({ error: 'Falta la imagen.' }, 400)

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: body.mediaType || 'image/jpeg', data: body.imageBase64 } },
              { type: 'text', text: prompt(body.note || '') },
            ],
          },
        ],
      }),
    })
    const d = await r.json()
    if (!r.ok) return json({ error: d?.error?.message || 'Error del modelo' }, 502)

    const text: string = (d.content || []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      parsed = m ? JSON.parse(m[0]) : null
    }
    if (!parsed) return json({ error: 'Respuesta no interpretable.' }, 502)
    return json(parsed, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

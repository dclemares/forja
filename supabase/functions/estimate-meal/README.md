# estimate-meal — estimación de comida por foto (IA)

Edge Function que recibe una foto + descripción y devuelve `{ label, kcal, protein, carbs, fat, confidence }`
usando un modelo de visión. Por defecto usa **Gemini (tier gratis)** de Google AI Studio.
La clave vive solo en el servidor; nunca llega al cliente.

El endpoint es **compatible-OpenAI**, así que cambiar de proveedor (Groq, Qwen, GLM…) es solo
cambiar tres secretos, sin tocar el código.

## Puesta en marcha (una vez)

1. **Clave gratis de Gemini**: entra en https://aistudio.google.com/apikey (sin tarjeta),
   crea una API key y guárdala como secreto:

   ```sh
   supabase secrets set AI_API_KEY=<tu_clave_de_gemini>
   ```

   Con esto ya apunta a Gemini por defecto. Opcionalmente puedes fijar modelo/endpoint:

   ```sh
   supabase secrets set AI_MODEL=gemini-2.5-flash
   supabase secrets set AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
   ```

2. Desplegar la función:

   ```sh
   supabase functions deploy estimate-meal
   ```

3. Activar el botón "Foto (IA)" en la app añadiendo a `.env.production` (y `.env.local` para dev):

   ```
   VITE_AI_PHOTO=1
   ```

   y volviendo a desplegar el front (push a `main`).

Sin estos pasos, la app funciona igual: el botón "Foto" simplemente no aparece y se usan
las otras vías (manual, buscador, código de barras, comidas).

## Cambiar de proveedor (plan B)

Todos exponen endpoint compatible-OpenAI. Para cambiar, ajusta los secretos:

| Proveedor | `AI_BASE_URL` | `AI_MODEL` (ejemplo) |
|---|---|---|
| Gemini (Google) | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.2-90b-vision-preview` |
| Qwen (Alibaba) | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `qwen-vl-plus` |
| Zhipu GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4v-flash` |

Verifica el nombre de modelo y el tier gratis de cada uno antes de cambiar
(lista útil: https://github.com/cheahjs/free-llm-api-resources).

## Coste y privacidad

- **Gratis** en el tier gratis de Gemini (~1.500 peticiones/día, sin tarjeta).
- La foto se reescala a ≤1024 px en el cliente antes de enviarse (menos payload).
- ⚠️ El tier gratis de Google puede usar los datos para mejorar sus modelos. Si no quieres eso,
  usa un proveedor con política distinta o pásate a un modelo en el navegador.

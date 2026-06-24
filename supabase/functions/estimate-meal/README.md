# estimate-meal — estimación de comida por foto (IA)

Edge Function que recibe una foto + descripción y devuelve
`{ reasoning, label, grams, kcal, protein, carbs, fat, confidence }` usando modelos de visión.

**Fallback multi-proveedor**: prueba los modelos de **Groq** y de **Gemini** en orden hasta
que uno responda. Son dos tiers GRATIS independientes, así que si a uno se le acaba la cuota,
salta al otro automáticamente. Las claves viven solo en el servidor; nunca llegan al cliente.

## Puesta en marcha

Basta con tener **al menos una** clave. Recomendado: las dos, para máxima fiabilidad.

1. **Groq (gratis, sin tarjeta)** — https://console.groq.com/keys → crea una API key:

   ```sh
   supabase secrets set GROQ_API_KEY=<tu_clave_de_groq>
   ```

2. **Gemini (gratis, sin tarjeta)** — https://aistudio.google.com/apikey:

   ```sh
   supabase secrets set GEMINI_API_KEY=<tu_clave_de_gemini>
   ```
   (Se sigue aceptando `AI_API_KEY` como clave de Gemini por compatibilidad.)

3. Desplegar:

   ```sh
   supabase functions deploy estimate-meal --project-ref <ref> --no-verify-jwt
   ```

4. Activar el botón "Foto (IA)": `VITE_AI_PHOTO=1` en `.env.production` y push a `main`.

Orden por defecto: **Groq primero** (rápido, pool fresco), **Gemini de respaldo**. Se puede
ajustar la lista de modelos con `GROQ_MODELS` / `GEMINI_MODELS` (CSV) sin tocar código.

## Modelos por defecto

| Proveedor | Modelos |
|---|---|
| Groq | `meta-llama/llama-4-scout-17b-16e-instruct`, `meta-llama/llama-4-maverick-17b-128e-instruct` |
| Gemini | `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash` |

## Notas

- La foto se reescala a ≤1024 px en el cliente antes de enviarse.
- En caso de error, la función devuelve el detalle real del proveedor para diagnóstico.
- ⚠️ Los tiers gratis pueden usar los datos para mejorar sus modelos y tienen límites de ritmo
  (por minuto y por día). Para uso personal (unas pocas fotos al día) van sobrados.

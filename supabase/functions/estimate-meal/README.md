# estimate-meal — estimación de comida por foto (IA)

Edge Function que recibe una foto + nota y devuelve `{ label, kcal, protein, carbs, fat, confidence }`
usando Claude (visión). La clave de Anthropic vive solo en el servidor.

## Puesta en marcha (una vez)

1. Conseguir una API key de Anthropic (https://console.anthropic.com) y guardarla como secreto:

   ```sh
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
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
las otras vías (manual, buscador, código de barras, ración rápida).

## Coste

Por defecto usa `claude-opus-4-8`. Para abaratar (~5×), cambia `MODEL` a `claude-haiku-4-5`
en `index.ts`. La foto se reescala a ≤1024 px en el cliente antes de enviarse.

# Página para recibir archivos de impresión

Proyecto independiente (no comparte nada con Cattleya). Los clientes suben archivos en `/` y se descargan desde `/admin.html`.

## Puesta en marcha (Cloudflare)
1. **R2 → Create bucket**: crea uno nuevo, por ejemplo `archivos-impresion`.
2. **Workers y Pages → Create → Pages**: sube/conecta esta carpeta como un proyecto nuevo.
3. En el proyecto: **Settings → Bindings → Add → R2 bucket**: nombre de variable `FILES`, bucket `archivos-impresion`.
4. **Settings → Variables and Secrets**: crea el secreto `ADMIN_KEY` (clave larga, mínimo 16 caracteres). Es la clave de `/admin.html`.
5. Vuelve a desplegar (los cambios de bindings/variables aplican en el siguiente despliegue).
6. Edita en `app.js` la línea `CFG`: pon el nombre del negocio.

## Recomendado
- **Borrado automático**: en el bucket → Settings → Object lifecycle rules → eliminar objetos a los 2 Días.
- **Anti-bots (opcional)**: crea un widget de Turnstile; pon la clave pública en `CFG.turnstile` (app.js) y la clave secreta como secreto `TURNSTILE_SECRET`.
- **Límite de peticiones**: en Security → WAF → Rate limiting rules, limita `/api/*`.

## Límites
50 MB por archivo, 10 archivos por envío; PDF, imágenes, Word, Excel, PowerPoint y TXT. Los archivos nunca se muestran en el sitio: solo se descargan desde el panel.

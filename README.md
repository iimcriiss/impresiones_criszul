# Página para recibir archivos de impresión

Los clientes suben archivos en `/` y reciben un código (ej. `K7M2-9QXA`). Tú los descargas en `/admin.html`, y puedes dejarles respuestas que recogen en `/recoger.html` con ese código.

## Estructura
- `index.html`, `recoger.html`, `admin.html` — las 3 páginas
- `assets/css/estilos.css` — todos los estilos (fondo, colores, modo oscuro)
- `assets/js/` — `comun.js` (utilidades), `enviar.js`, `recoger.js`, `panel.js`
- `assets/img/` — `fondo.jpg` (cámbiala por otra con el mismo nombre) e iconos
- `functions/_middleware.js` — cabeceras de seguridad para toda la API
- `functions/_lib/util.js` — código compartido (firmas, códigos, validación de archivos)
- `functions/api/` — `subir.js`, `recoger.js`, `admin.js`

## Puesta en marcha (Cloudflare)
1. **R2 → Create bucket**, por ejemplo `archivos-impresion`.
2. **Workers y Pages → Create → Pages**: sube/conecta esta carpeta.
3. **Settings → Bindings → R2 bucket**: variable `FILES`, bucket `archivos-impresion`.
4. **Settings → Variables and Secrets** (tipo *Secret*), dos claves **distintas y aleatorias**:
   - `ADMIN_KEY`: la clave de `/admin.html` (mínimo 16 caracteres).
   - `TICKET_SECRET`: firma los permisos de subida (30+ caracteres aleatorios). **Nueva: es obligatoria.**
   Para generarlas: `openssl rand -base64 32`
5. Vuelve a desplegar.
6. En `assets/js/enviar.js` pon el nombre del negocio en `CFG`.

> Al actualizar desde la versión anterior los códigos cambian (ahora son de 8 caracteres): despliega cuando no haya pedidos pendientes.

## Muy recomendado
- **Borrado automático**: bucket → Settings → Object lifecycle rules → eliminar objetos a los 2 días.
- **Límite de peticiones** (Security → WAF → Rate limiting) para `/api/admin` (ej. 10 por minuto por IP) y `/api/recoger` (ej. 30 por minuto).
- **Turnstile**: widget gratis; clave pública en `CFG.turnstile` (enviar.js) y secreta como secreto `TURNSTILE_SECRET`. Evita que bots llenen el almacenamiento.
- Los archivos de clientes pueden traer macros: abre Word/Excel en *Vista protegida* y desconfía de lo que no esperabas.

## Límites
50 MB por archivo, 10 archivos por envío; PDF, imágenes, Word, Excel, PowerPoint y TXT. El contenido se verifica en el servidor (no solo la extensión).

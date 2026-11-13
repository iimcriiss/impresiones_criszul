# Página para recibir archivos de impresión

Los clientes suben archivos en `/` y reciben un código (ej. `K7M2-9QXA`). Tú los descargas en `/admin.html`, y puedes dejarles respuestas que recogen en `/recoger.html` con ese código.

## Estructura
- `index.html`, `recoger.html`, `admin.html` — las 3 páginas
- `assets/css/estilos.css` — todos los estilos (fondo, colores, modo oscuro)
- `assets/js/` — `comun.js` (utilidades), `pre.js` (se carga en el `<head>`; evita que parpadee la pantalla del código), `gate.js` (pantalla del código de la tienda), `enviar.js`, `recoger.js`, `panel.js`, `ui.js`
- `assets/img/` — `fondo.jpg` (cámbiala por otra con el mismo nombre) e iconos
- `functions/_middleware.js` — cabeceras de seguridad para toda la API
- `functions/_lib/util.js` — código compartido (firmas, códigos, validación de archivos)
- `functions/api/` — `subir.js`, `recoger.js`, `admin.js`

## Cómo funciona la página de envío
- Si un archivo no se acepta (tipo no válido, vacío, muy pesado o ya hay 10), sale un aviso flotante arriba con el nombre y el motivo. Se cierra con la × o solo a los 8 segundos.
- Al subir, cada archivo muestra una barra verde que se va llenando; la lista no parpadea.
- Al terminar aparece el código del pedido y el botón **Subir más archivos**, que vuelve al formulario limpio (conserva el nombre). También está el acceso a **Descargar mis archivos**.
- El código de la tienda se recuerda 5 h 30 min en el navegador (`localStorage`, clave `acc`), así que al volver desde *Recoger* no aparece la pantalla de nuevo. El servidor sigue validando la cookie de 6 h; si ya no sirve, la pantalla vuelve a pedir el código.
- El panel (`admin.html`) tiene lista o cuadrícula, buscador y se actualiza solo cada 60 s. **Descargar todo** es el botón principal de cada pedido.

## Aspecto (fondo y contraste)
- Al inicio de `assets/css/estilos.css`: `--difuminado` (0px nítido, 20px muy borroso) y `--velo` (más alto = fondo más liso).
- Las tres páginas tienen su propio ajuste al final del archivo (bloques `body[data-pag=...]`): ahí se cambian el velo, el borde y la sombra de las tarjetas, en modo claro y oscuro.
- Al cambiar un `.css` o `.js`, sube el número `?v=` en los `.html` para que los navegadores no usen la copia vieja.

## Puesta en marcha (Cloudflare)
1. **R2 → Create bucket**, por ejemplo `archivos-impresion`.
2. **Workers y Pages → Create → Pages**: sube/conecta esta carpeta.
3. **Settings → Bindings → R2 bucket**: variable `FILES`, bucket `archivos-impresion`.
4. **Settings → Variables and Secrets** (tipo *Secret*), dos claves **distintas y aleatorias**:
   - `ADMIN_KEY`: la clave de `/admin.html` (mínimo 16 caracteres).
   - `TICKET_SECRET`: firma los permisos de subida (30+ caracteres aleatorios). **Nueva: es obligatoria.**
   Para generarlas: `openssl rand -base64 32`
   - `CODIGO_TIENDA`: código numérico de 6 dígitos que se pide en la pantalla de entrada (solo quien esté en el local lo sabe; **solo dígitos**, la pantalla no deja escribir letras). Si tiene otro largo, cambia `LARGO` en `assets/js/gate.js`. Para cambiarlo: edita el secreto y vuelve a desplegar. QR del mostrador: `https://TU-PAGINA.pages.dev/?c=123456`.
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

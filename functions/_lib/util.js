// Utilidades compartidas por todas las funciones de la API
export const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...h } });
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
export async function firma(texto, clave) {
  const k = await crypto.subtle.importKey('raw', enc.encode(clave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(texto)));
}
// Comparación en tiempo constante (compara hashes, así no depende del largo ni del contenido)
export async function iguales(a, b) {
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const p = new Uint8Array(x), q = new Uint8Array(y); let r = 0;
  for (let i = 0; i < p.length; i++) r |= p[i] ^ q[i];
  return r === 0;
}
// Código de pedido: 8 caracteres sin letras confusas (sin 0/1/I/O) = 40 bits de azar
const ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const nuevoCodigo = () => [...crypto.getRandomValues(new Uint8Array(8))].map(b => ABC[b & 31]).join('');
export const CODIGO = /^[2-9A-HJ-NP-Z]{8}$/;
export const normCodigo = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export const EXT = /\.(pdf|jpe?g|png|webp|heic|heif|docx?|xlsx?|pptx?|txt)$/i;
export const MAX = 50 * 1024 * 1024, MAX_ARCH = 10;
export const corto = (s, n) => String(s || '').slice(0, n);
export const dec = v => { try { return decodeURIComponent(v || ''); } catch { return ''; } };
export const limpiarNombre = s => corto(dec(s), 120).replace(/[\\\/\x00-\x1f]/g, '_');

// Verifica que el contenido real coincida con la extensión (no solo el nombre)
export async function formatoValido(env, key, nombre) {
  const o = await env.FILES.get(key, { range: { offset: 0, length: 512 } });
  if (!o) return false;
  const b = new Uint8Array(await o.arrayBuffer()), at = (i, s) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  switch (nombre.split('.').pop().toLowerCase()) {
    case 'pdf': return String.fromCharCode(...b).includes('%PDF-');
    case 'jpg': case 'jpeg': return b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    case 'png': return b[0] === 0x89 && at(1, 'PNG');
    case 'webp': return at(0, 'RIFF') && at(8, 'WEBP');
    case 'heic': case 'heif': return at(4, 'ftyp');
    case 'docx': case 'xlsx': case 'pptx': return at(0, 'PK');
    case 'doc': case 'xls': case 'ppt': return b[0] === 0xD0 && b[1] === 0xCF && b[2] === 0x11 && b[3] === 0xE0;
    case 'txt': return !b.includes(0);
    default: return false;
  }
}
export const descarga = (o, nombre) => new Response(o.body, { headers: { 'content-type': 'application/octet-stream', 'content-length': String(o.size), 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(nombre.replace(/[\r\n"]/g, '')), 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' } });

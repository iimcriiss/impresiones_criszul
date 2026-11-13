// Subida pública: POST = pide un permiso (ticket) · PUT = sube un archivo a R2 (binding FILES)
import { json, firma, iguales, nuevoCodigo, CODIGO, EXT, MAX, MAX_ARCH, corto, dec, limpiarNombre, formatoValido } from '../_lib/util.js';

// Acceso recordado: al poner bien el código de la tienda se guarda una cookie firmada (6 horas).
// Si cambias CODIGO_TIENDA, todas las cookies anteriores dejan de servir.
const HORAS_ACCESO = 6;
const limpio = x => String(x || '').trim().toUpperCase().replace(/\s+/g, '');
const firmaAcceso = (exp, env) => firma('acceso.' + exp + '.' + limpio(env.CODIGO_TIENDA), env.TICKET_SECRET);
async function conAcceso(request, env) {
  if (!env.CODIGO_TIENDA || !env.TICKET_SECRET) return false;
  const c = (request.headers.get('Cookie') || '').split(/;\s*/).find(x => x.startsWith('acc='));
  const [exp, sig] = c ? c.slice(4).split('.') : [];
  return !!c && Date.now() < +exp && await iguales(sig || '', await firmaAcceso(exp, env));
}

// GET = ¿este navegador ya tiene acceso? (así no se vuelve a pedir el código)
export async function onRequestGet({ request, env }) {
  return (await conAcceso(request, env)) ? json({ ok: true }) : json({ error: 'Falta el código de la tienda' }, 401);
}

export async function onRequestPost({ request, env }) {
  if (!env.TICKET_SECRET) return json({ error: 'El servicio no está configurado' }, 500);
  let b = {}; try { b = await request.json(); } catch {}
  if (env.TURNSTILE_SECRET) {
    try {
      const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', b.token || ''); f.append('remoteip', request.headers.get('CF-Connecting-IP') || '');
      const v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f })).json();
      if (!v.success) return json({ error: 'No pudimos verificar que eres una persona. Inténtalo de nuevo.' }, 403);
    } catch { return json({ error: 'No pudimos verificar. Inténtalo de nuevo.' }, 502); }
  }
  // Código de la tienda (opcional): si existe el secreto CODIGO_TIENDA, hay que escribirlo (o tener la cookie de acceso)
  let galleta = {};
  if (env.CODIGO_TIENDA) {
    if (b.codigo) {
      if (!(await iguales('t:' + limpio(b.codigo), 't:' + limpio(env.CODIGO_TIENDA)))) return json({ error: 'El código de la tienda no es correcto.' }, 403);
      const vence = Date.now() + HORAS_ACCESO * 3600 * 1000;
      galleta = { 'set-cookie': 'acc=' + vence + '.' + await firmaAcceso(vence, env) + '; HttpOnly; Secure; SameSite=Strict; Path=/api/subir; Max-Age=' + HORAS_ACCESO * 3600 };
    } else if (!(await conAcceso(request, env))) return json({ error: 'Escribe el código de la tienda.' }, 403);
  }
  const pedido = nuevoCodigo(), exp = Date.now() + 30 * 60 * 1000;
  return json({ pedido, ticket: pedido + '.' + exp + '.' + await firma(pedido + '.' + exp, env.TICKET_SECRET) }, 200, galleta);
}

export async function onRequestPut({ request, env }) {
  if (!env.TICKET_SECRET) return json({ error: 'El servicio no está configurado' }, 500);
  const [pedido, exp, sig] = (request.headers.get('x-ticket') || '').split('.');
  if (!CODIGO.test(pedido || '') || !(Date.now() < +exp) || !(await iguales(sig || '', await firma(pedido + '.' + exp, env.TICKET_SECRET))))
    return json({ error: 'El envío expiró. Recarga la página e inténtalo de nuevo.' }, 403);
  const i = Number(request.headers.get('x-indice'));
  if (!Number.isInteger(i) || i < 0 || i >= MAX_ARCH) return json({ error: 'Máximo 10 archivos por envío.' }, 400);
  const nombre = limpiarNombre(request.headers.get('x-nombre'));
  if (!EXT.test(nombre)) return json({ error: 'Ese tipo de archivo no se acepta.' }, 400);
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (!len) return json({ error: 'El archivo está vacío.' }, 400);
  if (len > MAX) return json({ error: 'El archivo pesa más de 50 MB.' }, 413);
  // La llave depende solo del número (0-9): es imposible pasar de 10 archivos, ni en paralelo
  const key = 'p/' + pedido + '/' + i;
  try {
    const o = await env.FILES.put(key, request.body, { httpMetadata: { contentType: 'application/octet-stream' },
      customMetadata: { n: nombre, c: corto(dec(request.headers.get('x-cliente')), 60), o: corto(dec(request.headers.get('x-nota')), 300) } });
    if (o.size > MAX || !(await formatoValido(env, key, nombre))) { await env.FILES.delete(key); return json({ error: 'El contenido no coincide con el tipo de archivo.' }, 400); }
  } catch { return json({ error: 'No se pudo guardar el archivo.' }, 500); }
  return json({ ok: true });
}

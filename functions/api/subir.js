// Subida pública: POST = pide un permiso (ticket) · PUT = sube un archivo a R2 (binding FILES)
import { json, firma, iguales, nuevoCodigo, CODIGO, EXT, MAX, MAX_ARCH, corto, dec, limpiarNombre, formatoValido } from '../_lib/util.js';

export async function onRequestPost({ request, env }) {
  if (!env.TICKET_SECRET) return json({ error: 'El servicio no está configurado' }, 500);
  if (env.TURNSTILE_SECRET) {
    let b = {}; try { b = await request.json(); } catch {}
    try {
      const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', b.token || ''); f.append('remoteip', request.headers.get('CF-Connecting-IP') || '');
      const v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f })).json();
      if (!v.success) return json({ error: 'No pudimos verificar que eres una persona. Inténtalo de nuevo.' }, 403);
    } catch { return json({ error: 'No pudimos verificar. Inténtalo de nuevo.' }, 502); }
  }
  const pedido = nuevoCodigo(), exp = Date.now() + 30 * 60 * 1000;
  return json({ pedido, ticket: pedido + '.' + exp + '.' + await firma(pedido + '.' + exp, env.TICKET_SECRET) });
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

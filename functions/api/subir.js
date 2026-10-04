// Subida pública: 1) POST pide un permiso (ticket) · 2) PUT sube un archivo a R2 (binding FILES)
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function firma(texto, clave) {
  const k = await crypto.subtle.importKey('raw', enc.encode(clave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(texto)));
}
const EXT = /\.(pdf|jpe?g|png|webp|heic|heif|docx?|xlsx?|pptx?|txt)$/i;
const MAX = 50 * 1024 * 1024, MAX_ARCH = 10;
const corto = (s, n) => String(s || '').slice(0, n);
const dec = v => { try { return decodeURIComponent(v || ''); } catch { return ''; } };
const otroOrigen = r => { const o = r.headers.get('Origin'); return o && o !== new URL(r.url).origin; };

export async function onRequestPost({ request, env }) {
  if (otroOrigen(request)) return json({ error: 'Origen no permitido' }, 403);
  if (!env.ADMIN_KEY) return json({ error: 'El servicio no está configurado' }, 500);
  if (env.TURNSTILE_SECRET) {
    let b = {}; try { b = await request.json(); } catch {}
    const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', b.token || ''); f.append('remoteip', request.headers.get('CF-Connecting-IP') || '');
    const v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f })).json();
    if (!v.success) return json({ error: 'No pudimos verificar que eres una persona. Recarga la página.' }, 403);
  }
  const pedido = hex(crypto.getRandomValues(new Uint8Array(6))), exp = Date.now() + 30 * 60 * 1000;
  return json({ pedido, ticket: pedido + '.' + exp + '.' + await firma(pedido + '.' + exp, env.ADMIN_KEY) });
}

export async function onRequestPut({ request, env }) {
  if (otroOrigen(request)) return json({ error: 'Origen no permitido' }, 403);
  const [pedido, exp, sig] = (request.headers.get('x-ticket') || '').split('.');
  if (!env.ADMIN_KEY || !/^[a-f0-9]{12}$/.test(pedido || '') || !(Date.now() < +exp) || sig !== await firma(pedido + '.' + exp, env.ADMIN_KEY))
    return json({ error: 'El envío expiró. Recarga la página e inténtalo de nuevo.' }, 403);
  const nombre = corto(dec(request.headers.get('x-nombre')), 120).replace(/[\\\/\x00-\x1f]/g, '_');
  if (!EXT.test(nombre)) return json({ error: 'Ese tipo de archivo no se acepta.' }, 400);
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (!len) return json({ error: 'El archivo está vacío.' }, 400);
  if (len > MAX) return json({ error: 'El archivo pesa más de 50 MB.' }, 413);
  const previos = await env.FILES.list({ prefix: 'p/' + pedido + '/', limit: MAX_ARCH + 1 });
  if (previos.objects.length >= MAX_ARCH) return json({ error: 'Máximo 10 archivos por envío.' }, 429);
  const h = n => dec(request.headers.get(n));
  await env.FILES.put('p/' + pedido + '/' + Date.now().toString(36) + '-' + nombre, request.body, {
    httpMetadata: { contentType: 'application/octet-stream' },
    customMetadata: { n: nombre, c: corto(h('x-cliente'), 60), t: corto(h('x-tel'), 30), o: corto(h('x-nota'), 300) }
  });
  return json({ ok: true });
}

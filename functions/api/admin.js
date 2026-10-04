// Panel privado: lista, descarga y borra los archivos. Necesita el secreto ADMIN_KEY (mínimo 16 caracteres).
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const enc = new TextEncoder();
const sha = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function autorizado(request, env) {
  if (!env.ADMIN_KEY || env.ADMIN_KEY.length < 16) return false;
  const [a, b] = await Promise.all([sha(request.headers.get('Authorization') || ''), sha('Bearer ' + env.ADMIN_KEY)]);
  let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]; return r === 0;
}

export async function onRequestGet({ request, env }) {
  if (!(await autorizado(request, env))) return json({ error: 'No autorizado' }, 401);
  const d = new URL(request.url).searchParams.get('d');
  if (d) {
    if (!d.startsWith('p/')) return json({ error: 'Archivo inválido' }, 400);
    const o = await env.FILES.get(d); if (!o) return json({ error: 'No existe' }, 404);
    const nombre = (o.customMetadata && o.customMetadata.n || 'archivo').replace(/[\r\n"]/g, '');
    return new Response(o.body, { headers: { 'content-type': 'application/octet-stream', 'content-length': String(o.size), 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(nombre), 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' } });
  }
  const out = []; let cursor;
  do {
    const l = await env.FILES.list({ prefix: 'p/', cursor, limit: 1000, include: ['customMetadata'] });
    for (const x of l.objects) out.push({ k: x.key, s: x.size, f: x.uploaded, m: x.customMetadata || {} });
    cursor = l.truncated ? l.cursor : null;
  } while (cursor && out.length < 3000);
  return json(out);
}

export async function onRequestPost({ request, env }) {
  const o = request.headers.get('Origin'); if (o && o !== new URL(request.url).origin) return json({ error: 'Origen no permitido' }, 403);
  if (!(await autorizado(request, env))) return json({ error: 'No autorizado' }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: 'Datos inválidos' }, 400); }
  const keys = Array.isArray(b.keys) ? b.keys.filter(k => typeof k === 'string' && k.startsWith('p/')).slice(0, 100) : [];
  if (b.accion !== 'borrar' || !keys.length) return json({ error: 'Acción inválida' }, 400);
  await env.FILES.delete(keys);
  return json({ ok: true });
}

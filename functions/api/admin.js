// Panel privado. La clave se cambia por una cookie de sesión HttpOnly (el JavaScript nunca la guarda).
import { json, firma, iguales, CODIGO, normCodigo, MAX, descarga, limpiarNombre } from '../_lib/util.js';
const HORAS = 8;
const cookie = (v, seg) => 'sid=' + v + '; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=' + seg;

async function autorizado(request, env) {
  if (!env.ADMIN_KEY || env.ADMIN_KEY.length < 16) return false;
  const c = (request.headers.get('Cookie') || '').split(/;\s*/).find(x => x.startsWith('sid='));
  const [exp, sig] = c ? c.slice(4).split('.') : [];
  return !!c && Date.now() < +exp && iguales(sig || '', await firma('sesion.' + exp, env.ADMIN_KEY));
}

export async function onRequestGet({ request, env }) {
  if (!(await autorizado(request, env))) return json({ error: 'No autorizado' }, 401);
  const d = new URL(request.url).searchParams.get('d');
  if (d) {
    if (!/^p\/[2-9A-HJ-NP-Z]{8}\/\d$/.test(d)) return json({ error: 'Archivo inválido' }, 400);
    const o = await env.FILES.get(d); if (!o) return json({ error: 'No existe' }, 404);
    return descarga(o, (o.customMetadata && o.customMetadata.n) || 'archivo');
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
  let b; try { b = await request.json(); } catch { return json({ error: 'Datos inválidos' }, 400); }
  if (b.accion === 'entrar') {
    if (!env.ADMIN_KEY || env.ADMIN_KEY.length < 16) return json({ error: 'El servicio no está configurado' }, 500);
    if (!(await iguales('k:' + String(b.clave || ''), 'k:' + env.ADMIN_KEY))) { await new Promise(r => setTimeout(r, 800)); return json({ error: 'Clave incorrecta' }, 401); }
    const exp = Date.now() + HORAS * 3600e3;
    return json({ ok: true }, 200, { 'set-cookie': cookie(exp + '.' + await firma('sesion.' + exp, env.ADMIN_KEY), HORAS * 3600) });
  }
  if (b.accion === 'salir') return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
  if (!(await autorizado(request, env))) return json({ error: 'No autorizado' }, 401);
  const c = normCodigo(b.pedido);
  if (b.accion !== 'borrar' || !CODIGO.test(c)) return json({ error: 'Acción inválida' }, 400);
  // Borra el pedido completo: lo que subió el cliente (p/) y lo que le dejaste (r/)
  for (const pre of ['p/', 'r/']) {
    const l = await env.FILES.list({ prefix: pre + c + '/', limit: 1000 });
    if (l.objects.length) await env.FILES.delete(l.objects.map(x => x.key));
  }
  return json({ ok: true });
}

export async function onRequestPut({ request, env }) {
  if (!(await autorizado(request, env))) return json({ error: 'No autorizado' }, 401);
  const codigo = normCodigo(request.headers.get('x-codigo')), nombre = limpiarNombre(request.headers.get('x-nombre'));
  if (!CODIGO.test(codigo)) return json({ error: 'Código inválido' }, 400);
  if (!nombre) return json({ error: 'Falta el nombre del archivo' }, 400);
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (!len) return json({ error: 'El archivo está vacío' }, 400);
  if (len > MAX) return json({ error: 'El archivo pesa más de 50 MB' }, 413);
  await env.FILES.put('r/' + codigo + '/' + Date.now().toString(36) + '-' + nombre, request.body, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { n: nombre } });
  return json({ ok: true });
}

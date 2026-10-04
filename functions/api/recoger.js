// Entrega al cliente lo que dejó el negocio, usando su código de pedido (6 caracteres)
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const d = q.get('d');
  if (d) {
    if (!/^r\/[a-f0-9]{6}\/[^\/]+$/.test(d)) return json({ error: 'Archivo inválido' }, 400);
    const o = await env.FILES.get(d); if (!o) return json({ error: 'No existe' }, 404);
    const nombre = (o.customMetadata && o.customMetadata.n || 'archivo').replace(/[\r\n"]/g, '');
    return new Response(o.body, { headers: { 'content-type': 'application/octet-stream', 'content-length': String(o.size), 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(nombre), 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' } });
  }
  const c = (q.get('c') || '').trim().toLowerCase();
  if (!/^[a-f0-9]{6}$/.test(c)) return json({ error: 'Código inválido' }, 400);
  const l = await env.FILES.list({ prefix: 'r/' + c + '/', limit: 20, include: ['customMetadata'] });
  return json(l.objects.map(x => ({ k: x.key, n: (x.customMetadata && x.customMetadata.n) || 'archivo', s: x.size })));
}
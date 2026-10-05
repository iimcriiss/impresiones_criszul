// Entrega al cliente lo que dejó el negocio, con su código de pedido (8 caracteres)
import { json, descarga, normCodigo, CODIGO } from '../_lib/util.js';

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams, d = q.get('d');
  if (d) {
    if (!/^r\/[2-9A-HJ-NP-Z]{8}\/[^\/]+$/.test(d)) return json({ error: 'Archivo inválido' }, 400);
    const o = await env.FILES.get(d); if (!o) return json({ error: 'No existe' }, 404);
    return descarga(o, (o.customMetadata && o.customMetadata.n) || 'archivo');
  }
  const c = normCodigo(q.get('c'));
  if (!CODIGO.test(c)) return json({ error: 'Código inválido' }, 400);
  const l = await env.FILES.list({ prefix: 'r/' + c + '/', limit: 20, include: ['customMetadata'] });
  return json(l.objects.map(x => ({ k: x.key, n: (x.customMetadata && x.customMetadata.n) || 'archivo', s: x.size })));
}

// Se aplica a TODA la API: cabeceras de seguridad, bloqueo de otros orígenes y errores controlados
import { json } from './_lib/util.js';
export async function onRequest({ request, next }) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    const o = request.headers.get('Origin');
    if (o && o !== new URL(request.url).origin) return json({ error: 'Origen no permitido' }, 403);
  }
  try {
    const r = await next(), h = new Headers(r.headers);
    h.set('x-content-type-options', 'nosniff'); h.set('referrer-policy', 'no-referrer'); h.set('cross-origin-resource-policy', 'same-origin');
    return new Response(r.body, { status: r.status, headers: h });
  } catch { return json({ error: 'Error del servidor' }, 500); }
}

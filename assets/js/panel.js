let datos = [], g = {}, bus = '';
async function api(m, body) {
  const r = await fetch('/api/admin', { method: m, headers: body ? { 'content-type': 'application/json' } : {}, body: body && JSON.stringify(body) });
  if (r.status === 401) throw Object.assign(new Error(await err(r, 'No autorizado')), { auth: true });
  if (!r.ok) throw new Error(await err(r, 'Error del servidor'));
  return r.json();
}
const bajar = k => { const a = document.createElement('a'); a.href = '/api/admin?d=' + encodeURIComponent(k); document.body.append(a); a.click(); a.remove(); };
const IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/></svg>';
function tarjeta(p) {
  return '<article class="card ped rv"><header><span class="chip">' + esc(cod(p.id)) + '</span><time>' + new Date(p.f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) + '</time></header>'
    + '<p><strong>' + (esc(p.m.c) || 'Sin nombre') + '</strong></p>' + (p.m.o ? '<p class="nota">' + esc(p.m.o) + '</p>' : '')
    + '<ul class="tiles">' + p.a.map(x => '<li class="tile"><div class="ext">' + esc(ext(x.m.n || '')) + '</div><div class="tx"><span class="nom">' + esc(x.m.n || x.k) + '</span><em>' + fmt(x.s) + '</em></div><button class="mini" data-d="' + esc(x.k) + '" aria-label="Descargar ' + esc(x.m.n || '') + '">' + IC + '</button></li>').join('') + '</ul>'
    + '<div class="acc"><button class="mini" data-r="' + esc(p.id) + '">Subir respuesta</button><button class="mini" data-t="' + esc(p.id) + '">Descargar todo</button><button class="mini del" data-b="' + esc(p.id) + '">Borrar</button></div></article>';
}
function pintar() {
  g = {}; for (const x of datos) (g[x.k.split('/')[1]] = g[x.k.split('/')[1]] || []).push(x);
  const ped = Object.keys(g).map(id => ({ id, a: g[id].sort((p, q) => p.k.localeCompare(q.k)), f: Math.max(...g[id].map(x => +new Date(x.f))), m: g[id][0].m })).sort((p, q) => q.f - p.f);
  const peso = datos.reduce((s, x) => s + x.s, 0);
  $('#stats').innerHTML = '<span><b>' + ped.length + '</b>pedidos</span><span><b>' + datos.length + '</b>archivos</span><span><b>' + fmt(peso) + '</b>en total</span>';
  const t = bus.toLowerCase(), vis = t ? ped.filter(p => (cod(p.id) + ' ' + (p.m.c || '') + ' ' + (p.m.o || '') + ' ' + p.a.map(x => x.m.n || '').join(' ')).toLowerCase().includes(t)) : ped;
  $('#lista').innerHTML = vis.length ? vis.map(tarjeta).join('') : '<p class="vacio">' + (ped.length ? 'Nada coincide con tu búsqueda.' : 'Aún no hay archivos. Cuando alguien envíe, aparecerán aquí.') + '</p>';
  [...$('#lista').children].forEach((c, i) => c.style.setProperty('--d', Math.min(i, 8)));
}
async function cargar() { datos = await api('GET'); pintar(); $('#loginbox').hidden = true; $('#panel').hidden = false; }
function subirRespuesta(id) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;
  inp.onchange = async () => {
    try {
      for (const f of inp.files) {
        const r = await fetch('/api/admin', { method: 'PUT', body: f, headers: { 'content-type': 'application/octet-stream', 'x-codigo': id, 'x-nombre': encodeURIComponent(f.name) } });
        if (!r.ok) throw new Error(await err(r, 'No se pudo subir ' + f.name));
      }
      toast('Listo. El cliente ya puede descargarlo con su código.');
    } catch (er) { toast(er.message, 1); }
  };
  inp.click();
}
$('#lista').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.d) return bajar(b.dataset.d);
    if (b.dataset.t) { for (const x of g[b.dataset.t]) { bajar(x.k); await new Promise(r => setTimeout(r, 700)); } return; }
    if (b.dataset.r) return subirRespuesta(b.dataset.r);
    if (b.dataset.b && confirm('¿Borrar este pedido y sus archivos? No se puede deshacer.')) { await api('POST', { accion: 'borrar', pedido: b.dataset.b }); await cargar(); toast('Pedido borrado.'); }
  } catch (er) { toast(er.message, 1); }
};
$('#buscar').oninput = e => { bus = e.target.value.trim(); pintar(); };
$('#login').onsubmit = async e => {
  e.preventDefault(); $('#err').textContent = '';
  try { await api('POST', { accion: 'entrar', clave: $('#clave').value }); $('#clave').value = ''; await cargar(); } catch (er) { $('#err').textContent = er.message; }
};
$('#act').onclick = () => cargar().then(() => toast('Actualizado.')).catch(er => toast(er.message, 1));
$('#sal').onclick = async () => { await api('POST', { accion: 'salir' }).catch(() => {}); location.reload(); };
// Vista: cuadrícula o lista (se recuerda la elección)
const V = { grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>Cuadrícula', lista: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Lista' };
let vista = 'grid'; try { vista = localStorage.getItem('vista') === 'lista' ? 'lista' : 'grid'; } catch {}
function aplicarVista() { $('#lista').classList.toggle('lista', vista === 'lista'); $('#vista').innerHTML = V[vista === 'lista' ? 'grid' : 'lista']; }
$('#vista').onclick = () => { vista = vista === 'lista' ? 'grid' : 'lista'; try { localStorage.setItem('vista', vista); } catch {} aplicarVista(); };
aplicarVista();
cargar().catch(() => {}); // si ya hay sesión abierta, entra directo

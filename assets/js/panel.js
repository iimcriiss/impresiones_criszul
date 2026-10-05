let datos = [], g = {};
async function api(m, body) {
  const r = await fetch('/api/admin', { method: m, headers: body ? { 'content-type': 'application/json' } : {}, body: body && JSON.stringify(body) });
  if (r.status === 401) throw Object.assign(new Error(await err(r, 'No autorizado')), { auth: true });
  if (!r.ok) throw new Error(await err(r, 'Error del servidor'));
  return r.json();
}
const bajar = k => { const a = document.createElement('a'); a.href = '/api/admin?d=' + encodeURIComponent(k); document.body.append(a); a.click(); a.remove(); };
function pintar() {
  g = {}; for (const x of datos) (g[x.k.split('/')[1]] = g[x.k.split('/')[1]] || []).push(x);
  const ped = Object.keys(g).map(id => ({ id, a: g[id].sort((p, q) => p.k.localeCompare(q.k)), f: Math.max(...g[id].map(x => +new Date(x.f))), m: g[id][0].m })).sort((p, q) => q.f - p.f);
  $('#lista').innerHTML = ped.length ? ped.map(p => '<article class="card ped"><header><b>' + esc(cod(p.id)) + '</b><span>' + new Date(p.f).toLocaleString('es-CO') + '</span></header>'
    + '<p><strong>' + (esc(p.m.c) || 'Sin nombre') + '</strong></p>' + (p.m.o ? '<p class="nota">' + esc(p.m.o) + '</p>' : '')
    + '<ul>' + p.a.map(x => '<li><span>' + esc(x.m.n || x.k) + '</span><em>' + fmt(x.s) + '</em><button class="mini" data-d="' + esc(x.k) + '">Descargar</button></li>').join('') + '</ul>'
    + '<div class="acc"><button class="mini" data-r="' + esc(p.id) + '">Subir respuesta</button><button class="mini" data-t="' + esc(p.id) + '">Descargar todo</button><button class="mini del" data-b="' + esc(p.id) + '">Borrar pedido</button></div></article>').join('')
    : '<p class="vacio">Aún no hay archivos. Cuando alguien envíe, aparecerán aquí.</p>';
}
async function cargar() { datos = await api('GET'); pintar(); $('#login').hidden = true; $('#panel').hidden = false; }
function subirRespuesta(id) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;
  inp.onchange = async () => {
    try {
      for (const f of inp.files) {
        const r = await fetch('/api/admin', { method: 'PUT', body: f, headers: { 'content-type': 'application/octet-stream', 'x-codigo': id, 'x-nombre': encodeURIComponent(f.name) } });
        if (!r.ok) throw new Error(await err(r, 'No se pudo subir ' + f.name));
      }
      alert('Listo. El cliente ya puede recogerlo con su código.');
    } catch (er) { alert(er.message); }
  };
  inp.click();
}
$('#lista').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.d) return bajar(b.dataset.d);
    if (b.dataset.t) { for (const x of g[b.dataset.t]) { bajar(x.k); await new Promise(r => setTimeout(r, 700)); } return; }
    if (b.dataset.r) return subirRespuesta(b.dataset.r);
    if (b.dataset.b && confirm('¿Borrar este pedido y sus archivos? No se puede deshacer.')) { await api('POST', { accion: 'borrar', pedido: b.dataset.b }); await cargar(); }
  } catch (er) { alert(er.message); }
};
$('#login').onsubmit = async e => {
  e.preventDefault(); $('#err').textContent = '';
  try { await api('POST', { accion: 'entrar', clave: $('#clave').value }); $('#clave').value = ''; await cargar(); } catch (er) { $('#err').textContent = er.message; }
};
$('#act').onclick = () => cargar().catch(er => alert(er.message));
$('#sal').onclick = async () => { await api('POST', { accion: 'salir' }).catch(() => {}); location.reload(); };
cargar().catch(() => {}); // si ya hay sesión abierta, entra directo

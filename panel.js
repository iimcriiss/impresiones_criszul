const $ = s => document.querySelector(s);
let clave = sessionStorage.getItem('k') || '', datos = [], g = {};
const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(m, body) {
  const r = await fetch('/api/admin', { method: m, headers: Object.assign({ Authorization: 'Bearer ' + clave }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) throw new Error('Clave incorrecta');
  if (!r.ok) throw new Error('Error del servidor');
  return r.json();
}
async function bajar(k, nombre) {
  const r = await fetch('/api/admin?d=' + encodeURIComponent(k), { headers: { Authorization: 'Bearer ' + clave } });
  if (!r.ok) return alert('No se pudo descargar ' + nombre);
  const url = URL.createObjectURL(await r.blob()), a = document.createElement('a');
  a.href = url; a.download = nombre || 'archivo'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function pintar() {
  g = {}; for (const x of datos) (g[x.k.split('/')[1]] = g[x.k.split('/')[1]] || []).push(x);
  const ped = Object.keys(g).map(id => ({ id, a: g[id], f: Math.max.apply(null, g[id].map(x => +new Date(x.f))), m: g[id][0].m })).sort((p, q) => q.f - p.f);
  $('#lista').innerHTML = ped.length ? ped.map(p => '<article class="ped"><header><b>' + p.id.slice(0, 6).toUpperCase() + '</b><span>' + new Date(p.f).toLocaleString('es-CO') + '</span></header>'
    + '<p><strong>' + (esc(p.m.c) || 'Sin nombre') + '</strong>' + (p.m.t ? ' · <a href="tel:' + esc(p.m.t.replace(/[^\d+]/g, '')) + '">' + esc(p.m.t) + '</a>' : '') + '</p>'
    + (p.m.o ? '<p class="nota">' + esc(p.m.o) + '</p>' : '')
    + '<ul>' + p.a.map(x => '<li><span>' + esc(x.m.n || x.k) + '</span><em>' + fmt(x.s) + '</em><button data-d="' + esc(x.k) + '">Descargar</button></li>').join('') + '</ul>'
    + '<div class="acc"><button data-r="' + p.id + '">Subir respuesta</button><button data-t="' + p.id + '">Descargar todo</button><button class="del" data-b="' + p.id + '">Borrar pedido</button></div></article>').join('')
    : '<p class="vacio">Aún no hay archivos. Cuando alguien envíe, aparecerán aquí.</p>';
}

async function cargar() { datos = await api('GET'); pintar(); $('#login').hidden = true; $('#panel').hidden = false; }
function subirRespuesta(id) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;
  inp.onchange = async () => {
    try {
      for (const f of inp.files) {
        const r = await fetch('/api/admin', { method: 'PUT', body: f, headers: { Authorization: 'Bearer ' + clave, 'content-type': 'application/octet-stream', 'x-codigo': id.slice(0, 6), 'x-nombre': encodeURIComponent(f.name) } });
        if (!r.ok) throw new Error('No se pudo subir ' + f.name);
      }
      alert('Listo. El cliente ya puede recogerlo con su código.');
    } catch (er) { alert(er.message); }
  };
  inp.click();
}
$('#lista').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.d) { const x = datos.find(y => y.k === b.dataset.d); return bajar(x.k, x.m.n); }
    if (b.dataset.t) { for (const x of g[b.dataset.t]) await bajar(x.k, x.m.n); return; }
        if (b.dataset.r) return subirRespuesta(b.dataset.r);
    if (b.dataset.b && confirm('¿Borrar este pedido y sus archivos? No se puede deshacer.')) { await api('POST', { accion: 'borrar', keys: g[b.dataset.b].map(x => x.k) }); await cargar(); }
  } catch (er) { alert(er.message); }
};
$('#login').onsubmit = async e => {
  e.preventDefault(); clave = $('#clave').value; $('#err').textContent = '';
  try { await cargar(); sessionStorage.setItem('k', clave); } catch (er) { $('#err').textContent = er.message; }
};
$('#act').onclick = () => cargar().catch(er => alert(er.message));
$('#sal').onclick = () => { sessionStorage.removeItem('k'); location.reload(); };
if (clave) cargar().catch(() => sessionStorage.removeItem('k'));

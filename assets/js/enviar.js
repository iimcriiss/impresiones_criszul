const CFG = { negocio: 'Impresiones Criszul', turnstile: '0x4AAAAAAFN7qJ9dj6ZUCcQd' }; // ← nombre del negocio · clave pública de Turnstile (opcional)
const MAX = 50 * 1048576, MAX_ARCH = 10, OK = /\.(pdf|jpe?g|png|webp|heic|heif|docx?|xlsx?|pptx?|txt)$/i;
const val = s => $(s).value.trim(), msg = t => { $('#msg').textContent = t; };
let files = [], token = '', sesion = null, enviando = false;
document.title = 'Enviar archivos · ' + CFG.negocio; $('#neg').textContent = CFG.negocio;

if (CFG.turnstile) {
  const d = document.createElement('div'); d.className = 'cf-turnstile'; d.dataset.sitekey = CFG.turnstile; d.dataset.callback = 'tsOk'; $('#ts').append(d);
  d.dataset.appearance = 'interaction-only'; 
  window.tsOk = t => { token = t; };
  const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; document.head.append(s);
}
const libre = () => [...Array(MAX_ARCH).keys()].find(i => !files.some(f => f.i === i));

const rotulo = () => files.length ? 'Enviar ' + files.length + (files.length > 1 ? ' archivos' : ' archivo') : 'Enviar';
// Cada archivo tiene su <li> propio que se crea una sola vez y se actualiza en sitio (sin parpadeo)
function crear(f) {
  const li = document.createElement('li'), e = document.createElement('div'), n = document.createElement('div'), em = document.createElement('em'), b = document.createElement('button'), br = document.createElement('div'), i = document.createElement('i');
  e.className = 'ext'; e.textContent = ext(f.file.name); n.className = 'nom'; n.textContent = f.file.name;
  b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Quitar ' + f.file.name); b.onclick = () => { files.splice(files.indexOf(f), 1); render(); };
  br.className = 'barra'; br.hidden = true; br.append(i);
  li.append(e, n, em, b, br); f.el = { li, em, br, i };
  setTimeout(() => { f.vis = true; }, 450);
}
function pinta(f) {
  if (!f.el) crear(f);
  const { li, em, br, i } = f.el;
  li.className = 'arch' + (f.err ? ' err' : f.ok ? ' done' : '') + (enviando ? ' bloq' : '') + (f.vis ? ' ya' : '');
  em.textContent = f.st;
  br.hidden = f.p == null; if (f.p != null) i.style.width = Math.round(f.p * 100) + '%';
}
function render() {
  if (!enviando) $('#go').textContent = rotulo();
  const ul = $('#ls');
  [...ul.children].forEach(li => { if (!files.some(f => f.el && f.el.li === li)) li.remove(); });
  files.forEach(f => { pinta(f); if (f.el.li.parentNode !== ul) ul.append(f.el.li); });
}
const TIPOS = 'PDF, fotos (JPG, PNG, WEBP, HEIC), Word, Excel, PowerPoint o TXT';
// Aviso flotante bien visible con los archivos que no se pudieron agregar y por qué
let avisoT;
function rechazos(lista, tipo) {
  document.querySelectorAll('.aviso').forEach(e => e.remove()); clearTimeout(avisoT);
  if (!lista.length) return;
  const r = document.createElement('div'); r.className = 'aviso'; r.setAttribute('role', 'alert');
  const t = document.createElement('p'); t.className = 'rt'; t.textContent = lista.length > 1 ? 'No se pudieron agregar ' + lista.length + ' archivos' : 'No se pudo agregar este archivo';
  const ul = document.createElement('ul');
  lista.forEach(([n, m]) => { const li = document.createElement('li'), b = document.createElement('b'); b.textContent = n; li.append(b, ' · ' + m); ul.append(li); });
  const x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '×'; x.setAttribute('aria-label', 'Cerrar aviso');
  const cerrar = () => { r.classList.add('out'); setTimeout(() => r.remove(), 300); };
  x.onclick = cerrar;
  r.append(t, ul, x);
  if (tipo) { const a = document.createElement('p'); a.className = 'ayu'; a.textContent = 'Sí puedes enviar: ' + TIPOS + '.'; r.append(a); }
  document.body.append(r); avisoT = setTimeout(cerrar, 8000);
  dz.classList.remove('mal'); void dz.offsetWidth; dz.classList.add('mal');
}
function add(arr) {
  msg(''); const no = []; let tipo = false;
  for (const f of arr) {
    if (!OK.test(f.name)) { no.push([f.name, 'ese tipo de archivo no se acepta']); tipo = true; continue; }
    if (!f.size) { no.push([f.name, 'el archivo está vacío']); continue; }
    if (f.size > MAX) { no.push([f.name, 'pesa más de 50 MB (' + fmt(f.size) + ')']); continue; }
    if (files.length >= MAX_ARCH) { no.push([f.name, 'ya llegaste al máximo de 10 archivos']); continue; }
    files.push({ file: f, st: fmt(f.size), i: libre() });
  }
  rechazos(no, tipo); render();
}
$('#file').onchange = e => { add([...e.target.files]); e.target.value = ''; };
const dz = $('#drop');
dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); };
dz.ondragleave = () => dz.classList.remove('on');
dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); add([...e.dataTransfer.files]); };

// XMLHttpRequest solo para poder mostrar la barra de progreso
const subir = f => new Promise((ok, ko) => {
  const x = new XMLHttpRequest(); x.open('PUT', '/api/subir');
  const h = { 'content-type': 'application/octet-stream', 'x-ticket': sesion.ticket, 'x-indice': f.i, 'x-nombre': encodeURIComponent(f.file.name), 'x-cliente': encodeURIComponent(val('#n')), 'x-nota': encodeURIComponent(val('#o')) };
  for (const k in h) x.setRequestHeader(k, h[k]);
  x.upload.onprogress = e => { if (e.lengthComputable) { f.p = e.loaded / e.total; f.st = Math.round(f.p * 100) + '%'; pinta(f); } };
  x.onload = () => x.status < 300 ? ok() : ko(new Error((() => { try { return JSON.parse(x.responseText).error; } catch {} })() || 'No se pudo subir.'));
  x.onerror = () => ko(new Error('Sin conexión. Inténtalo de nuevo.'));
  x.send(f.file);
});

$('#f').onsubmit = async e => {
  e.preventDefault(); if (enviando) return; msg('');
  if (!val('#n')) return msg('Escribe tu nombre.');
  if (!files.length) return msg('Elige al menos un archivo.');
  if (CFG.turnstile && !token && !sesion) return msg('Confirma que no eres un robot.');
  enviando = true; $('#go').disabled = true; $('#go').textContent = 'Enviando…'; files.forEach(pinta);
  try {
    if (!sesion) {
      const r = await fetch('/api/subir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      if (!r.ok) { if (window.turnstile) turnstile.reset(); token = ''; throw new Error(await err(r, 'No se pudo iniciar el envío.')); }
      sesion = await r.json();
    }
    let fallos = 0;
    for (const f of files) {
      if (f.ok) continue; f.err = false; f.p = 0; f.st = '0%'; pinta(f);
      try { await subir(f); f.ok = true; f.p = 1; f.st = 'Listo'; } catch (er) { fallos++; f.err = true; f.p = null; f.st = er.message; }
      pinta(f);
    }
    if (fallos) throw new Error('No se enviaron ' + fallos + ' archivo(s). Toca Enviar para reintentar.');
    $('#cod').textContent = cod(sesion.pedido); $('#f').hidden = true; $('#exito').hidden = false; sesion = null;
  } catch (er) { msg(er.message); }
  finally { enviando = false; $('#go').disabled = false; render(); }
};
$('#mas').onclick = () => {
  files = []; sesion = null; token = ''; if (window.turnstile) try { turnstile.reset(); } catch {}
  $('#o').value = ''; msg(''); $('#copiar').textContent = 'Copiar código';
  $('#exito').hidden = true; $('#f').hidden = false; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
};
$('#copiar').onclick = async () => { try { await navigator.clipboard.writeText($('#cod').textContent); $('#copiar').textContent = '¡Copiado!'; } catch {} };

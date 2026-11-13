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
function render() {
  if (!enviando) $('#go').textContent = rotulo();
  const ul = $('#ls'); ul.innerHTML = '';
  files.forEach((f, k) => {
    const li = document.createElement('li'); li.className = 'arch' + (f.err ? ' err' : f.ok ? ' done' : '');
    const e = document.createElement('div'); e.className = 'ext'; e.textContent = ext(f.file.name);
    const n = document.createElement('div'); n.className = 'nom'; n.textContent = f.file.name;
    const em = document.createElement('em'); em.textContent = f.st; li.append(e, n, em);
    if (!enviando && !f.ok) { const b = document.createElement('button'); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Quitar ' + f.file.name); b.onclick = () => { files.splice(k, 1); render(); }; li.append(b); }
    if (f.p != null) { const br = document.createElement('div'), i = document.createElement('i'); br.className = 'barra'; i.style.width = Math.round(f.p * 100) + '%'; br.append(i); li.append(br); }
    ul.append(li);
  });
}
const TIPOS = 'PDF, fotos (JPG, PNG, WEBP, HEIC), Word, Excel, PowerPoint o TXT';
// Aviso visible junto a la zona de carga con los archivos que no se pudieron agregar y por qué
function rechazos(lista, tipo) {
  const r = $('#rech'); r.innerHTML = '';
  if (!lista.length) { r.hidden = true; return; }
  const t = document.createElement('p'); t.className = 'rt'; t.textContent = lista.length > 1 ? 'No se pudieron agregar ' + lista.length + ' archivos' : 'No se pudo agregar este archivo';
  const ul = document.createElement('ul');
  lista.forEach(([n, m]) => { const li = document.createElement('li'), b = document.createElement('b'); b.textContent = n; li.append(b, ' · ' + m); ul.append(li); });
  const x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '×'; x.setAttribute('aria-label', 'Cerrar aviso'); x.onclick = () => { r.hidden = true; };
  r.append(t, ul, x);
  if (tipo) { const a = document.createElement('p'); a.className = 'ayu'; a.textContent = 'Sí puedes enviar: ' + TIPOS + '.'; r.append(a); }
  r.hidden = false; dz.classList.remove('mal'); void dz.offsetWidth; dz.classList.add('mal');
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
  x.upload.onprogress = e => { if (e.lengthComputable) { f.p = e.loaded / e.total; f.st = Math.round(f.p * 100) + '%'; render(); } };
  x.onload = () => x.status < 300 ? ok() : ko(new Error((() => { try { return JSON.parse(x.responseText).error; } catch {} })() || 'No se pudo subir.'));
  x.onerror = () => ko(new Error('Sin conexión. Inténtalo de nuevo.'));
  x.send(f.file);
});

$('#f').onsubmit = async e => {
  e.preventDefault(); if (enviando) return; msg('');
  if (!val('#n')) return msg('Escribe tu nombre.');
  if (!files.length) return msg('Elige al menos un archivo.');
  if (CFG.turnstile && !token && !sesion) return msg('Confirma que no eres un robot.');
  enviando = true; $('#go').disabled = true; $('#go').textContent = 'Enviando…';
  try {
    if (!sesion) {
      const r = await fetch('/api/subir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      if (!r.ok) { if (window.turnstile) turnstile.reset(); token = ''; throw new Error(await err(r, 'No se pudo iniciar el envío.')); }
      sesion = await r.json();
    }
    let fallos = 0;
    for (const f of files) {
      if (f.ok) continue; f.err = false; f.p = 0; f.st = '0%'; render();
      try { await subir(f); f.ok = true; f.p = 1; f.st = 'Listo'; } catch (er) { fallos++; f.err = true; f.p = null; f.st = er.message; }
      render();
    }
    if (fallos) throw new Error('No se enviaron ' + fallos + ' archivo(s). Toca Enviar para reintentar.');
    $('#cod').textContent = cod(sesion.pedido); $('#f').hidden = true; $('#exito').hidden = false; sesion = null;
  } catch (er) { msg(er.message); }
  finally { enviando = false; $('#go').disabled = false; render(); }
};
$('#copiar').onclick = async () => { try { await navigator.clipboard.writeText($('#cod').textContent); $('#copiar').textContent = '¡Copiado!'; } catch {} };

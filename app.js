const CFG = { negocio: 'Impresiones Criszul', turnstile: '' }; // ← nombre del negocio · clave pública de Turnstile (opcional)
const MAX = 50 * 1048576, MAX_ARCH = 10, OK = /\.(pdf|jpe?g|png|webp|heic|heif|docx?|xlsx?|pptx?|txt)$/i;
const $ = s => document.querySelector(s), val = s => $(s).value.trim();
const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const msg = t => { $('#msg').textContent = t; };
let files = [], token = '', sesion = null, enviando = false;
document.title = 'Enviar archivos · ' + CFG.negocio; $('#neg').textContent = CFG.negocio;

if (CFG.turnstile) {
  $('#ts').innerHTML = '<div class="cf-turnstile" data-sitekey="' + CFG.turnstile + '" data-callback="tsOk"></div>';
  window.tsOk = t => { token = t; };
  const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; document.head.append(s);
}

function render() {
  const ul = $('#ls'); ul.innerHTML = '';
  files.forEach((f, i) => {
    const li = document.createElement('li'), s = document.createElement('span'), em = document.createElement('em');
    li.className = f.err ? 'err' : f.ok ? 'done' : ''; s.textContent = f.file.name; em.textContent = f.st; li.append(s, em);
    if (!enviando && !f.ok) { const b = document.createElement('button'); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Quitar ' + f.file.name); b.onclick = () => { files.splice(i, 1); render(); }; li.append(b); }
    ul.append(li);
  });
}
function add(arr) {
  msg('');
  for (const f of arr) {
    if (!OK.test(f.name)) { msg('«' + f.name + '»: ese tipo de archivo no se acepta.'); continue; }
    if (!f.size) continue;
    if (f.size > MAX) { msg('«' + f.name + '» pesa más de 50 MB.'); continue; }
    if (files.length >= MAX_ARCH) { msg('Máximo 10 archivos por envío.'); break; }
    files.push({ file: f, st: fmt(f.size) });
  }
  render();
}
$('#file').onchange = e => { add([...e.target.files]); e.target.value = ''; };
const dz = $('#drop');
dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); };
dz.ondragleave = () => dz.classList.remove('on');
dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); add([...e.dataTransfer.files]); };

$('#f').onsubmit = async e => {
  e.preventDefault(); if (enviando) return; msg('');
  if (!val('#n')) return msg('Escribe tu nombre.');
  if (!files.length) return msg('Elige al menos un archivo.');
  if (CFG.turnstile && !token && !sesion) return msg('Confirma que no eres un robot.');
  enviando = true; $('#go').disabled = true; $('#go').textContent = 'Enviando…';
  try {
    if (!sesion) {
      const r = await fetch('/api/subir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      const t = await r.json().catch(() => ({})); if (!r.ok) throw new Error(t.error || 'No se pudo iniciar el envío.'); sesion = t;
    }
    let fallos = 0;
    for (const f of files) {
      if (f.ok) continue; f.err = false; f.st = 'Subiendo…'; render();
      try {
        const u = await fetch('/api/subir', { method: 'PUT', body: f.file, headers: { 'content-type': 'application/octet-stream', 'x-ticket': sesion.ticket, 'x-nombre': encodeURIComponent(f.file.name), 'x-cliente': encodeURIComponent(val('#n')), 'x-tel': encodeURIComponent(val('#t')), 'x-nota': encodeURIComponent(val('#o')) } });
        if (!u.ok) throw new Error((await u.json().catch(() => ({}))).error || 'No se pudo subir.');
        f.ok = true; f.st = 'Listo';
      } catch (er) { fallos++; f.err = true; f.st = er.message; }
      render();
    }
    if (fallos) throw new Error('No se enviaron ' + fallos + ' archivo(s). Toca Enviar para reintentar.');
    $('#cod').textContent = sesion.pedido.slice(0, 6).toUpperCase(); $('#f').hidden = true; $('#exito').hidden = false; sesion = null;
  } catch (er) { msg(er.message); }
  finally { enviando = false; $('#go').disabled = false; $('#go').textContent = 'Enviar'; render(); }
};

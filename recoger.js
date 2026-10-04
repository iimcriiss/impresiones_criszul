const $ = s => document.querySelector(s);
const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const msg = t => { $('#msg').textContent = t; };

$('#f').onsubmit = async e => {
  e.preventDefault(); msg(''); $('#res').hidden = true;
  const c = $('#c').value.trim().toLowerCase();
  if (!/^[a-f0-9]{6}$/.test(c)) return msg('El código tiene 6 caracteres (letras A-F y números).');
  $('#go').disabled = true; $('#go').textContent = 'Buscando…';
  try {
    const r = await fetch('/api/recoger?c=' + encodeURIComponent(c));
    if (!r.ok) throw new Error('No se pudo consultar. Inténtalo de nuevo.');
    const lista = await r.json();
    if (!lista.length) return msg('Todavía no hay nada para este código. Si ya te avisaron, revisa que esté bien escrito.');
    const ul = $('#ls'); ul.innerHTML = '';
    for (const x of lista) {
      const li = document.createElement('li'), s = document.createElement('span'), em = document.createElement('em'), b = document.createElement('button');
      s.textContent = x.n; em.textContent = fmt(x.s); b.type = 'button'; b.textContent = 'Descargar';
      b.onclick = () => { location.href = '/api/recoger?d=' + encodeURIComponent(x.k); };
      li.append(s, em, b); ul.append(li);
    }
    $('#res').hidden = false;
  } catch (er) { msg(er.message); }
  finally { $('#go').disabled = false; $('#go').textContent = 'Buscar'; }
};
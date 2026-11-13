const msg = (t, info) => { const m = $('#msg'); m.textContent = t; m.className = info ? 'info' : ''; };
// Escribe el código con guion solo: K7M2-9QXA, y busca apenas se completan los 8 caracteres
$('#c').oninput = e => {
  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  e.target.value = v.length > 4 ? v.slice(0, 4) + '-' + v.slice(4) : v;
  if (v.length === 8 && !$('#go').disabled) $('#f').requestSubmit();
};
$('#f').onsubmit = async e => {
  e.preventDefault(); msg(''); $('#res').hidden = true;
  const c = $('#c').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== 8) return msg('El código tiene 8 caracteres, por ejemplo K7M2-9QXA.');
  $('#go').disabled = true; $('#go').textContent = 'Buscando…';
  try {
    const r = await fetch('/api/recoger?c=' + encodeURIComponent(c));
    if (!r.ok) throw new Error(await err(r, 'No se pudo consultar. Inténtalo de nuevo.'));
    const lista = await r.json();
    if (!lista.length) { msg('Todavía no hay nada listo para este código. Si ya te avisaron, revisa que esté bien escrito.', true); return; }
    const ul = $('#ls'); ul.innerHTML = '';
    lista.forEach((x, i) => {
      const li = document.createElement('li'), t = document.createElement('div'), n = document.createElement('span'), em = document.createElement('em'), a = document.createElement('a'), e2 = document.createElement('div');
      li.className = 'tile'; li.style.setProperty('animation-delay', i * 60 + 'ms'); t.className = 'tx'; n.className = 'nom'; n.textContent = x.n; em.textContent = fmt(x.s);
      e2.className = 'ext'; e2.textContent = ext(x.n); a.className = 'mini pri'; a.textContent = 'Descargar'; a.href = '/api/recoger?d=' + encodeURIComponent(x.k);
      t.append(n, em); li.append(e2, t, a); ul.append(li);
    });
    $('#res').hidden = false; $('#res').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (er) { msg(er.message); }
  finally { $('#go').disabled = false; $('#go').textContent = 'Buscar mis archivos'; }
};

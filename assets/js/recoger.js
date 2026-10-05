const msg = t => { $('#msg').textContent = t; };
$('#c').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); };
$('#f').onsubmit = async e => {
  e.preventDefault(); msg(''); $('#res').hidden = true;
  const c = $('#c').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== 8) return msg('El código tiene 8 caracteres, por ejemplo K7M2-9QXA.');
  $('#go').disabled = true; $('#go').textContent = 'Buscando…';
  try {
    const r = await fetch('/api/recoger?c=' + encodeURIComponent(c));
    if (!r.ok) throw new Error(await err(r, 'No se pudo consultar. Inténtalo de nuevo.'));
    const lista = await r.json();
    if (!lista.length) { msg('Todavía no hay nada para este código. Si ya te avisaron, revisa que esté bien escrito.'); if (window.ayudaPulso) ayudaPulso(); return; }
    const ul = $('#ls'); ul.innerHTML = '';
    lista.forEach((x, i) => {
      const li = document.createElement('li'), t = document.createElement('div'), n = document.createElement('span'), em = document.createElement('em'), a = document.createElement('a'), e2 = document.createElement('div');
      li.className = 'tile'; li.style.setProperty('animation-delay', i * 60 + 'ms'); t.className = 'tx'; n.className = 'nom'; n.textContent = x.n; em.textContent = fmt(x.s);
      e2.className = 'ext'; e2.textContent = ext(x.n); a.className = 'mini'; a.textContent = 'Descargar'; a.href = '/api/recoger?d=' + encodeURIComponent(x.k);
      t.append(n, em); li.append(e2, t, a); ul.append(li);
    });
    $('#res').hidden = false;
  } catch (er) { msg(er.message); }
  finally { $('#go').disabled = false; $('#go').textContent = 'Buscar'; }
};

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
    if (!lista.length) return msg('Todavía no hay nada para este código. Si ya te avisaron, revisa que esté bien escrito.');
    const ul = $('#ls'); ul.innerHTML = '';
    for (const x of lista) {
      const li = document.createElement('li'), a = document.createElement('a'), em = document.createElement('em'), n = document.createElement('div');
      li.className = 'arch'; n.className = 'nom'; n.textContent = x.n; em.textContent = fmt(x.s);
      a.className = 'mini'; a.textContent = 'Descargar'; a.href = '/api/recoger?d=' + encodeURIComponent(x.k);
      const e2 = document.createElement('div'); e2.className = 'ext'; e2.textContent = ext(x.n);
      li.append(e2, n, a, em); ul.append(li);
    }
    $('#res').hidden = false;
  } catch (er) { msg(er.message); }
  finally { $('#go').disabled = false; $('#go').textContent = 'Buscar'; }
};

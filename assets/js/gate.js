// Pantalla de acceso: pide el código de la tienda antes de mostrar el formulario.
// Si llegas desde el QR (/?c=CLAVE) entra directo, sin mostrar la ventana ni la clave.
(() => {
  const g = $('#gate'); if (!g) return;
  const inp = $('#tienda'), btn = $('#gok'), main = document.querySelector('main');
  const aviso = t => { $('#gmsg').textContent = t; };
  const c = new URLSearchParams(location.search).get('c');
  if (c) { history.replaceState(null, '', location.pathname); g.classList.add('fuera'); }   // quita la clave de la barra y oculta la ventana
  main.inert = true; if (!c) inp.focus();
  const esperar = async () => { for (let i = 0; i < 24 && CFG.turnstile && !token; i++) await new Promise(r => setTimeout(r, 250)); };
  async function entrar(dado) {
    const codigo = (dado || inp.value).trim(); aviso('');
    if (!codigo) return aviso('Escribe el código de la tienda.');
    btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      await esperar();
      if (CFG.turnstile && !token) throw new Error('No pudimos verificar. Recarga la página e inténtalo de nuevo.');
      const r = await fetch('/api/subir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, codigo }) });
      if (!r.ok) { if (window.turnstile) turnstile.reset(); token = ''; throw new Error(await err(r, 'No se pudo verificar el código.')); }
      sesion = await r.json();            // el formulario reutiliza este permiso
      g.classList.add('fuera'); main.inert = false; setTimeout(() => g.remove(), 400); $('#n').focus();
    } catch (e) { g.classList.remove('fuera'); aviso(c && dado ? 'Este QR ya no es válido. Pide el código en el local.' : e.message); inp.focus(); }
    finally { btn.disabled = false; btn.textContent = 'Continuar'; }
  }
  btn.onclick = () => entrar(); inp.onkeydown = e => { if (e.key === 'Enter') entrar(); };
  if (c) entrar(c.slice(0, 30));
})();

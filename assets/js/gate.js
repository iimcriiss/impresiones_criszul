// Pantalla de acceso: pide el código de la tienda antes de mostrar el formulario.
// Usa el mismo permiso (ticket) que el envío: el servidor es quien comprueba el código.
(() => {
  const g = $('#gate'); if (!g) return;
  const LARGO = 6;   // cuántos números tiene el código de la tienda (4 o 6); al completarlos entra solo
  const inp = $('#tienda'), btn = $('#gok'), main = document.querySelector('main');
  const aviso = t => { $('#gmsg').textContent = t; };
  const abrir = () => { g.classList.add('fuera'); main.inert = false; setTimeout(() => g.remove(), 400); };
  main.inert = true; inp.maxLength = LARGO; inp.focus();
  const esperar = async () => { for (let i = 0; i < 24 && CFG.turnstile && !token; i++) await new Promise(r => setTimeout(r, 250)); };
  async function entrar() {
    aviso(''); if (!inp.value.trim()) return aviso('Escribe el código de la tienda.');
    btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      await esperar();
      if (CFG.turnstile && !token) throw new Error('No pudimos verificar. Recarga la página e inténtalo de nuevo.');
      const r = await fetch('/api/subir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, codigo: inp.value.trim() }) });
      if (!r.ok) { if (window.turnstile) turnstile.reset(); token = ''; throw new Error(await err(r, 'No se pudo verificar el código.')); }
      sesion = await r.json();            // el formulario reutiliza este permiso
      abrir(); $('#n').focus();
    } catch (e) { aviso(e.message); inp.value = ''; inp.focus(); }
    finally { btn.disabled = false; btn.textContent = 'Continuar'; }
  }
  btn.onclick = entrar; inp.onkeydown = e => { if (e.key === 'Enter') entrar(); };
  inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(0, LARGO); aviso(''); if (inp.value.length === LARGO) entrar(); };
  const c = new URLSearchParams(location.search).get('c');   // enlace/QR del local: /?c=CODIGO
  if (c) { inp.value = c.replace(/\D/g, '').slice(0, LARGO); entrar(); }
  else fetch('/api/subir').then(r => { if (r.ok) abrir(); }).catch(() => {});   // si ya entró hace poco, no se pide otra vez
})();

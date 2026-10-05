// Animaciones ligeras (solo transform/opacity) + ayuda interactiva. No toca la lógica de envío ni la seguridad.
(() => {
  document.querySelectorAll('.rv').forEach((e, i) => e.style.setProperty('--d', Math.min(i, 8)));
  const ex = document.getElementById('exito');
  if (ex) new MutationObserver(() => { if (!ex.hidden) confeti(); }).observe(ex, { attributes: true, attributeFilter: ['hidden'] });
  function confeti() {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const col = ['#d6283d', '#ee4a61', '#ffb3c0', '#ffd166', '#fff0e6'], fr = document.createDocumentFragment();
    for (let i = 0; i < 18; i++) { const s = document.createElement('i'); s.className = 'cf'; s.style.background = col[i % 5]; s.style.setProperty('--x', (Math.random() * 320 - 160) + 'px'); s.style.setProperty('--y', (Math.random() * 260 + 60) + 'px'); s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); fr.append(s); }
    document.body.append(fr); setTimeout(() => document.querySelectorAll('.cf').forEach(e => e.remove()), 1600);
  }

  if (document.body.dataset.pag === 'admin') return;
  const AYUDA = { whatsapp: '' }; // opcional: número con indicativo, ej. '573001234567'. Vacío = no se muestra (así no das tu número)
  const N = {
    ini: { t: '¡Hola! 👋 Soy el asistente de ayuda. ¿Qué te pasó?', o: [['No me salen mis archivos', 'a'], ['No sé cuál es mi código', 'b'], ['Ya pagué y dejé todo, ¿y ahora?', 'c'], ['No me deja enviar', 'd'], ['¿Qué archivos puedo enviar?', 'e']] },
    a: { t: 'Revisa primero: el código tiene 8 letras o números (ej. K7M2-9QXA) y nunca lleva 0, 1, I ni O.\n\nAdemás, aquí solo aparece lo que el negocio ya te dejó listo; los archivos que tú enviaste no se muestran.\n\n¿Ya te avisaron que estaba listo?', o: [['Sí, y no sale', 'a2'], ['Todavía no me avisan', 'a3']] },
    a2: { t: 'Entonces puede ser un detalle del código o del negocio. Acércate con tu nombre, tu código y lo que enviaste (o el concepto del pago) y te lo entregan directo.', fin: 1 },
    a3: { t: 'Tranquilo, aparece en cuanto el negocio lo deje listo. Intenta de nuevo en un rato con el mismo código.', fin: 1 },
    b: { t: 'Es el código de 8 caracteres que salió al terminar de enviar (ej. K7M2-9QXA). Si lo perdiste, dile al encargado tu nombre, lo que enviaste y el concepto: lo busca en su panel.', fin: 1 },
    c: { t: 'Perfecto. Si ya enviaste tus archivos y pagaste, no tienes que hacer nada más: el negocio los imprime. Guarda tu código y, si te dejan algo para descargar, lo encuentras con él.', o: [['No aparece al buscar', 'a'], ['Todo bien, gracias', 'z']] },
    d: { t: 'Prueba esto:\n1) Recarga la página.\n2) Cada archivo debe pesar menos de 50 MB y máximo 10.\n3) Usa PDF, fotos, Word, Excel, PowerPoint o TXT.\n\nSi dice que el envío expiró, recarga y envía de nuevo.', fin: 1 },
    e: { t: 'PDF, fotos (JPG, PNG, WEBP, HEIC), Word, Excel, PowerPoint y TXT. Hasta 10 archivos de 50 MB cada uno.', fin: 1 },
    z: { t: '¡Listo! Que tengas un lindo día 🍓', fin: 1 }
  };
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; };
  const fab = el('button', 'ayuda-fab'); fab.type = 'button'; fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>'; fab.append('¿Ayuda?');
  let box = null, chat = null;
  function nodo(k) {
    const n = N[k], b = el('div', 'bur bot esc'); b.innerHTML = '<i></i><i></i><i></i>'; chat.append(b); chat.scrollTop = 9e4;
    setTimeout(() => {
      b.className = 'bur bot'; b.textContent = n.t;
      const o = el('div', 'opc');
      (n.o || []).forEach(([l, s]) => { const x = el('button', '', l); x.type = 'button'; x.onclick = () => { o.remove(); chat.append(el('div', 'bur yo', l)); nodo(s); }; o.append(x); });
      if (n.fin) {
        if (AYUDA.whatsapp) { const w = el('a', '', 'Escribir al negocio'); w.href = 'https://wa.me/' + AYUDA.whatsapp; w.target = '_blank'; w.rel = 'noopener'; o.append(w); }
        const v = el('button', '', 'Volver al inicio'); v.type = 'button'; v.onclick = () => { o.remove(); nodo('ini'); }; o.append(v);
      }
      chat.append(o); chat.scrollTop = 9e4;
    }, 450);
  }
  function abrir(k) {
    if (!box) {
      box = el('section', 'ayuda-box'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Ayuda');
      const h = el('header', '', 'Ayuda'), x = el('button', '', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = cerrar; h.append(x);
      chat = el('div', 'chat'); chat.setAttribute('aria-live', 'polite'); box.append(h, chat); document.body.append(box); nodo(k || 'ini');
    } else if (k) nodo(k);
    box.hidden = false; fab.setAttribute('aria-expanded', 'true'); fab.classList.remove('pulsa');
  }
  function cerrar() { if (box) box.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
  fab.onclick = () => (box && !box.hidden) ? cerrar() : abrir();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box && !box.hidden) cerrar(); });
  document.body.append(fab);
  window.abrirAyuda = abrir;
  window.ayudaPulso = () => { fab.classList.remove('pulsa'); void fab.offsetWidth; fab.classList.add('pulsa'); };
})();

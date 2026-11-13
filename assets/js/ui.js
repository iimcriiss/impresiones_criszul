// Animaciones ligeras (solo transform/opacity). No toca la lógica de envío ni la seguridad.
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

})();

// Se ejecuta antes de pintar la página: si el acceso se verificó hace poco, la pantalla del código ni se muestra.
try { if (+localStorage.getItem('acc') > Date.now()) document.documentElement.classList.add('acceso'); } catch (e) {}

// ==========================================
// AccessPlay - Módulo de Seguridad Anti-Hackers
// ==========================================

(function() {
  // 1. Bloquear click derecho (menú contextual)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });

  // 2. Bloquear atajos de teclado (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, etc.)
  document.addEventListener('keydown', function(e) {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (Inspeccionar)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J (Consola)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (Ver código fuente)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (Inspeccionar elemento)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Trampa de Debugger Constante
  // Si logran abrir la consola de alguna otra forma, esto congelará su navegador.
  setInterval(function() {
    (function() {
      return false;
    }['constructor']('debugger')());
  }, 100);

})();

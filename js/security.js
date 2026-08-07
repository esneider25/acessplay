// ==========================================
// AccessPlay - Módulo de Seguridad
// ==========================================

// Función global para prevenir XSS sanitizando texto ingresado por usuarios
window.escapeHTML = function(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
};

const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/IK/Documents/GitHub/recargashark';
const destDir = 'C:/Users/IK/Desktop/proyectos web/accesplay plantilla pro';

const filesToRestore = [
  'css/admin.css',
  'css/styles.css',
  'js/admin.js',
  'js/app.js',
  'js/components.js',
  'js/data.js',
  'js/usuario.js',
  'usuario.html',
  'admin.html',
  'index.html'
];

filesToRestore.forEach(f => {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf8');
    
    // 1. Exact HTML block replacements FIRST
    content = content.replace(/<span class="logo-icon">🦈<\/span>\s*<span class="logo-text">Recarga<span>Shark<\/span><\/span>/g, '<span class="logo-icon">🤖</span>\n          <span class="logo-text">Access<span style="color: #fbbf24;">Play</span></span>');
    content = content.replace(/Recarga<span>Shark<\/span>/g, 'Access<span style="color: #fbbf24;">Play</span>');
    content = content.replace(/RecargaShark/g, 'AccessPlay');
    content = content.replace(/Recarga Shark/gi, 'Access Play');
    
    // 2. Generic name replacements
    content = content.replace(/Shark/g, 'AccessPlay');
    content = content.replace(/shark/g, 'accessplay');
    
    // 3. Emojis
    content = content.replace(/🦈/g, '🤖');
    
    // 4. Colors
    content = content.replace(/#00e5c3/gi, '#0ea5e9'); // Main accent (Cyan/Green -> Blue)
    content = content.replace(/#10b981/gi, '#0ea5e9'); // Success/buttons -> Blue
    content = content.replace(/#059669/gi, '#0284c7'); // Gradient end -> Darker blue
    
    fs.writeFileSync(dest, content, 'utf8');
    console.log('Restored and updated: ' + f);
  } else {
    console.log('Missing src: ' + src);
  }
});

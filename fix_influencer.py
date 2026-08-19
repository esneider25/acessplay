import re
with open('c:/Users/IK/Documents/GitHub/acessplay/js/usuario.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

replacement = '''window.openInfluencerModal = function() {
  const rules = (window.SITE_SETTINGS && window.SITE_SETTINGS.influencerRules) 
    ? window.SITE_SETTINGS.influencerRules 
    : [
      'Deben tener una base de seguidores real (al menos 1,000 en su red principal) y subir contenido de videojuegos regularmente.',
      'Tienen que colocar su link de referido en sus biografías o descripciones.',
      'Se espera que mencionen a AccessPlay en sus videos o directos al menos un par de veces al mes.',
      'Cero toxicidad, sin promover el uso de hacks, y no deben promocionar competencia directa simultáneamente.',
      'Las cuentas que generen referidos falsos (multicuentas) serán bloqueadas y perderán sus puntos y rol.'
    ];
  
  const rulesHtml = rules.map(r => `<li>${escapeHTML(r)}</li>`).join('');

  Swal.fire({
    title: '<span style="color:var(--accent); font-weight:800; font-size: 1.4rem;"><i class="ph-fill ph-sparkle"></i> Programa de Influencers</span>',
    html: `
      <div style="text-align: left; font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary);">
        <p style="margin-bottom: 15px;">Al convertirte en <strong>Influencer de AccessPlay</strong>, tu límite de referidos se ampliará considerablemente, recibirás una insignia VIP en tu perfil y podrás monetizar a tu audiencia.</p>
        <p style="margin-bottom: 10px;"><strong>Normas básicas:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 20px; font-size: 0.85rem; color: var(--text-muted);">
          ${rulesHtml}
        </ul>
        <form id="influencer-app-form" style="display:flex; flex-direction:column; gap: 12px; margin-top: 10px;">
          <div>
            <label style="font-size: 0.75rem; color: var(--accent); font-weight: bold; margin-bottom: 4px; display: block;">Red Social Principal (URL)</label>
            <input type="url" id="inf-social" class="admin-form-input" placeholder="Ej: tiktok.com/@tu_usuario" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white;" required>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--accent); font-weight: bold; margin-bottom: 4px; display: block;">Cantidad de Seguidores</label>
            <select id="inf-followers" class="admin-form-input" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white;" required>
              <option value="">Selecciona una opción...</option>
              <option value="1k-5k">1,000 a 5,000</option>
              <option value="5k-15k">5,000 a 15,000</option>
              <option value="15k-50k">15,000 a 50,000</option>
              <option value="+50k">Más de 50,000</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--accent); font-weight: bold; margin-bottom: 4px; display: block;">¿De qué juegos creas contenido?</label>
            <input type="text" id="inf-game" class="admin-form-input" placeholder="Ej: Free Fire, Valorant, COD..." style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white;" required>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--accent); font-weight: bold; margin-bottom: 4px; display: block;">¿Por qué quieres ser Influencer?</label>
            <textarea id="inf-reason" class="admin-form-input" rows="3" placeholder="Cuéntanos brevemente..." style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; resize: none;" required></textarea>
          </div>'''

# We will use a regex to replace everything from `window.openInfluencerModal = function() {` down to `</textarea>\n          </div>`
pattern = re.compile(r'window\.openInfluencerModal = function\(\) \{.*?</textarea>\n\s*</div>', re.DOTALL)
new_text = pattern.sub(replacement.replace('$', '\\$'), text)

with open('c:/Users/IK/Documents/GitHub/acessplay/js/usuario.js', 'w', encoding='utf-8') as f:
    f.write(new_text.replace('\\$', '$'))
print('Success')

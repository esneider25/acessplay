const fs = require('fs');
const map = {
  'Ã¡':'á','Ã©':'é','Ã­':'í','Ã³':'ó','Ãº':'ú','Ã±':'ñ','Ã ':'Á','Ã‰':'É','Ã\x8D':'Í','Ã“':'Ó','Ãš':'Ú','Ã‘':'Ñ',
  'Â¿':'¿','Â¡':'¡','Ã¼':'ü','Ãœ':'Ü',
  'ðŸŽ®':'🎮','ðŸ’³':'💳','âš¡':'⚡','âœ…':'✅','âœ”':'✔','ðŸ“‹':'📋','ðŸ †':'🏆','ðŸŽ ':'🎁','ðŸ“¸':'📸',
  'ðŸ’¾':'💾','ðŸš«':'🚫','ðŸ–¼ï¸ ':'🖼️','âš ï¸ ':'⚠️','ðŸ—‘ï¸ ':'🗑️','ðŸ‘¾':'👾','ðŸ¤ ':'🤠','ðŸ¥·':'🥶',
  'ðŸ¤–':'🤖','ðŸ¦¸â€ â™‚ ':'🦸‍♂️','ðŸ§Ÿ':'🧟','ðŸ§™â€ â™‚ ':'🧙‍♂️','ðŸ§›':'🧛','ðŸ¦¹':'🦹','ðŸ‘½':'👽','â€”':'—'
};

let files = ['js/torneos.js', 'js/usuario.js', 'js/admin/withdrawals.js'];
for (let f of files) {
  if (!fs.existsSync(f)) continue;
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  for (let [k,v] of Object.entries(map)) {
    t = t.split(k).join(v);
  }
  fs.writeFileSync(f, t, 'utf8');
  console.log('Cleaned ' + f);
}

const fs = require('fs');

const replacements = {
  'ðŸŽ®': '🎮',
  'ðŸ’³': '💳',
  'âš¡': '⚡',
  'âœ…': '✅',
  'âœ”': '✔',
  'ðŸ“‹': '📋',
  'ðŸ †': '🏆',
  'ðŸŽ ': '🎁',
  'ðŸ“¸': '📸',
  'ðŸ’¾': '💾',
  'ðŸš«': '🚫',
  'ðŸ–¼ï¸ ': '🖼️',
  'âš ï¸ ': '⚠️',
  'ðŸ—‘ï¸ ': '🗑️',
  'ðŸ‘¾': '👾',
  'ðŸ¤ ': '🤠',
  'ðŸ¥·': '🥶',
  'ðŸ¤–': '🤖',
  'ðŸ¦¸â€ â™‚ ': '🦸‍♂️',
  'ðŸ§Ÿ': '🧟',
  'ðŸ§™â€ â™‚ ': '🧙‍♂️',
  'ðŸ§›': '🧛',
  'ðŸ¦¹': '🦹',
  'ðŸ‘½': '👽'
};

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [mojibake, correct] of Object.entries(replacements)) {
    content = content.split(mojibake).join(correct);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

fixFile('js/torneos.js');
fixFile('js/admin/withdrawals.js');

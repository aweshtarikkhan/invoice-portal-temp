const fs = require('fs');

const file = 'src/pages/PipelinePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'if (stage) { patch.probability = stage.win_probability; if (stage.is_won) patch.status = "won"; else if (stage.is_lost) patch.status = "lost"; else patch.status = "open"; }',
  'if (stage) patch.probability = stage.win_probability;'
);

fs.writeFileSync(file, content);
console.log('Reverted patch.status logic in PipelinePage.tsx');

const fs = require('fs');

const file = 'src/pages/PipelinePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the syntax error I introduced earlier
content = content.replace(
  /onChange=\{\(e\) => setForm\(\{ \.\.\.form, expected_close_date: e\.target\.value \} min=\{new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]\}\}\}/,
  'onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} min={new Date().toISOString().split("T")[0]}'
);

// Add status to patch in moveTo
content = content.replace(
  /if \(stage\) patch\.probability = stage\.win_probability;/g,
  'if (stage) { patch.probability = stage.win_probability; if (stage.is_won) patch.status = "won"; else if (stage.is_lost) patch.status = "lost"; else patch.status = "open"; }'
);

fs.writeFileSync(file, content);
console.log('Fixed PipelinePage.tsx');

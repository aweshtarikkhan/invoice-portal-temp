const fs = require('fs');
let code = fs.readFileSync('src/pages/AttendancePage.tsx', 'utf8');

const startDeductStr = '// Deduct leave balances';
const startIdx = code.indexOf(startDeductStr);

if (startIdx > -1) {
  // Find the exact setSaving(false) that comes AFTER the deduction logic
  const searchEndStr = 'setSaving(false);';
  const endIdx = code.indexOf(searchEndStr, startIdx);
  
  if (endIdx > -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
    
    code = code.replace(
      /toast\(\{ title: "Attendance saved", description: `\$\{rows\.length\} record\(s\) saved\.\$\{ deductRows\.length > 0 \? ` \$\{deductRows\.length\} leave balance\(s\) deducted\.` : "" \}` \}\);/,
      'toast({ title: "Attendance saved", description: `${rows.length} record(s) saved.` });'
    );
    
    fs.writeFileSync('src/pages/AttendancePage.tsx', code, 'utf8');
    console.log('Fixed correctly');
  }
}

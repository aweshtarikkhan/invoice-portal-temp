const fs = require('fs');
let code = fs.readFileSync('src/pages/AttendancePage.tsx', 'utf8');

const startDeduct = code.indexOf('// Deduct leave balances');
const endDeductStr = 'setSaving(false);';
const endDeduct = code.indexOf(endDeductStr);

if (startDeduct > -1 && endDeduct > -1) {
  code = code.substring(0, startDeduct) + code.substring(endDeduct);
  
  code = code.replace(
    /toast\(\{ title: "Attendance saved", description: `\$\{rows\.length\} record\(s\) saved\.\$\{ deductRows\.length > 0 \? ` \$\{deductRows\.length\} leave balance\(s\) deducted\.` : "" \}` \}\);/,
    'toast({ title: "Attendance saved", description: `${rows.length} record(s) saved.` });'
  );
  
  fs.writeFileSync('src/pages/AttendancePage.tsx', code, 'utf8');
  console.log('Removed deduction from AttendancePage');
} else {
  console.log('Could not find deduction logic');
}

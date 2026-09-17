const fs = require('fs');

const p = "c:\\Users\\awesh\\Desktop\\Satah Invoice - Copy\\billflow-pro-94-22f845cd\\src\\pages\\AttendancePage.tsx";
let content = fs.readFileSync(p, 'utf8');

// Remove Leaves Trigger
content = content.replace(/[ \t]*<TabsTrigger value="leaves"[\s\S]*?<\/TabsTrigger>\n?/g, "");

// Remove Salaries Trigger
content = content.replace(/[ \t]*<TabsTrigger value="salaries"[\s\S]*?<\/TabsTrigger>\n?/g, "");

// Remove Leaves Content Block
// Find <TabsContent value="leaves"> and the NEXT <TabsContent
const leavesContentStart = content.indexOf('<TabsContent value="leaves">');
if (leavesContentStart !== -1) {
  const nextContentStart = content.indexOf('<TabsContent value="regularizations">', leavesContentStart);
  if (nextContentStart !== -1) {
    content = content.substring(0, leavesContentStart) + content.substring(nextContentStart);
  }
}

// Remove Salaries Content Block
// Find <TabsContent value="salaries" and the NEXT <TabsContent
const salariesContentStart = content.indexOf('<TabsContent value="salaries"');
if (salariesContentStart !== -1) {
  const nextContentStart = content.indexOf('<TabsContent value="holidays"', salariesContentStart);
  if (nextContentStart !== -1) {
    content = content.substring(0, salariesContentStart) + content.substring(nextContentStart);
  }
}

fs.writeFileSync(p, content, 'utf8');
console.log("Removed leaves and salaries tabs.");

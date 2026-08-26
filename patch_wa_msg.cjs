const fs = require('fs');

let content = fs.readFileSync('src/lib/whatsapp.ts', 'utf8');

const compileOld = `export function compileWhatsappMessage(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(\`{{\${key}}}\`, 'g');
    result = result.replace(regex, value === null || value === undefined ? '' : String(value));
  }
  
  // Clean up any unreplaced placeholders
  result = result.replace(/{{[^}]+}}/g, '');
  return result.trim();
}`;

const compileNew = `export function compileWhatsappMessage(template: string, data: Record<string, any>): string {
  let result = template;
  
  const bracketMappings: Record<string, any> = {
    '\\\\[Client Name\\\\]': data.client_name,
    '\\\\[Invoice Number\\\\]': data.document_no,
    '\\\\[Estimate Number\\\\]': data.document_no,
    '\\\\[PO Number\\\\]': data.document_no,
    '\\\\[Bill Number\\\\]': data.document_no,
    '\\\\[Total Amount\\\\]': data.total,
    '\\\\[Due Date\\\\]': data.due_date,
    '\\\\[Portal Link\\\\]': data.portal_link,
    '\\\\[Company Name\\\\]': data.org_name,
  };
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(\`{{\${key}}}\`, 'g');
    result = result.replace(regex, value === null || value === undefined ? '' : String(value));
  }

  for (const [key, value] of Object.entries(bracketMappings)) {
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, value === null || value === undefined ? '' : String(value));
  }
  
  // Clean up any unreplaced placeholders
  result = result.replace(/{{[^}]+}}/g, '');
  result = result.replace(/\\[Client Name\\]|\\[Invoice Number\\]|\\[Estimate Number\\]|\\[PO Number\\]|\\[Bill Number\\]|\\[Total Amount\\]|\\[Due Date\\]|\\[Portal Link\\]|\\[Company Name\\]/g, '');
  
  return result.trim();
}`;

content = content.replace(compileOld, compileNew);

fs.writeFileSync('src/lib/whatsapp.ts', content, 'utf8');
console.log('patched whatsapp lib');

const fs = require('fs');

const file = 'src/pages/PartnerWithUsPage.tsx';
let c = fs.readFileSync(file, 'utf8');

// I will just use string replacement on the exact structure.
// The end of the main component return is right before `function CheckIcon(props: any) {`
c = c.replace(
  '        </div>\r\n\r\n      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\nfunction CheckIcon',
  '        </div>\r\n\r\n      </div>\r\n    </div>\r\n      </main>\n      <PublicFooter />\n    </div>\n  );\n}\n\nfunction CheckIcon'
);

// I will also fix the nested `min-h-screen`
c = c.replace(
  '      <main className="flex-grow">\r\n    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">',
  '      <main className="flex-grow">\r\n    <div className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">'
);

fs.writeFileSync(file, c);
console.log('Fixed PartnerWithUsPage.tsx structure');

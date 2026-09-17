const fs = require('fs');

let c = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

c = c.replace(
  '          </Card>\r\n        </div>\r\n      );\r\n    }',
  '          </Card>\r\n          </main>\r\n        </div>\r\n      );\r\n    }'
);
c = c.replace(
  '          </Card>\n        </div>\n      );\n    }',
  '          </Card>\n          </main>\n        </div>\n      );\n    }'
);

fs.writeFileSync('src/pages/LoginPage.tsx', c);
console.log('Fixed employeeBlocked return logic');

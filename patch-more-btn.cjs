const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// 1. Add DropdownMenu imports
if (!code.includes('DropdownMenuContent')) {
  code = code.replace(
    'import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";',
    'import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";'
  );
}

// 2. Add extra icons to imports
if (!code.includes('PackagePlus')) {
  code = code.replace(
    /FilePlus2, Receipt, CreditCard, UserPlus, UserCircle, Briefcase, Mail, Activity/,
    'FilePlus2, Receipt, CreditCard, UserPlus, UserCircle, Briefcase, Mail, Activity, PackagePlus, FileSpreadsheet, Building2, BookOpen'
  );
}

// 3. Replace "More" button with DropdownMenu
const oldMoreBtn = '<QuickAction icon={Activity} label="More" onClick={() => {}} />';
const newMoreBtn = `
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div>
                      <QuickAction icon={Activity} label="More" onClick={() => {}} />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/bills/new')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-slate-500" />
                      <span>Create Bill</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/vendors')}>
                      <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                      <span>Add Vendor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/items')}>
                      <PackagePlus className="w-4 h-4 mr-2 text-slate-500" />
                      <span>Add Item/Product</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/journal')}>
                      <BookOpen className="w-4 h-4 mr-2 text-slate-500" />
                      <span>Record Journal</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
`;

code = code.replace(oldMoreBtn, newMoreBtn);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('More button patched');

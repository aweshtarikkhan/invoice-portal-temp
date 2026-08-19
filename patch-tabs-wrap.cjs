const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const regex = /<Card className="lg:col-span-2 shadow-sm border-slate-200">\s*<CardHeader className="flex flex-row items-center justify-between pb-2">\s*<CardTitle className="text-base font-semibold">Revenue vs Expenses<\/CardTitle>\s*<Tabs defaultValue="revenue" className="w-\[400px\]">\s*<TabsList className="grid w-full grid-cols-4">\s*<TabsTrigger value="revenue">Revenue<\/TabsTrigger>\s*<TabsTrigger value="expenses">Expenses<\/TabsTrigger>\s*<TabsTrigger value="collections">Collections<\/TabsTrigger>\s*<TabsTrigger value="profit">Profit<\/TabsTrigger>\s*<\/TabsList>\s*<\/Tabs>\s*<\/CardHeader>\s*<CardContent>/m;

const replacement = `<Card className="lg:col-span-2 shadow-sm border-slate-200">
          <Tabs defaultValue="revenue" className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle>
              <TabsList className="grid w-[400px] grid-cols-4">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
                <TabsTrigger value="profit">Profit</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  
  // also add closing </Tabs> before </Card>
  const closingRegex = /<\/TabsContent>\s*<\/CardContent>\s*<\/Card>/;
  code = code.replace(closingRegex, '</TabsContent>\n            </CardContent>\n          </Tabs>\n          </Card>');
  
  fs.writeFileSync('src/pages/DashboardPage.tsx', code);
  console.log('Successfully wrapped with Tabs');
} else {
  console.log('Regex did not match');
}

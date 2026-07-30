const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(
  'const GSTReportsPage = lazy(() => import("./pages/GSTReportsPage"));',
  'const GSTReportsPage = lazy(() => import("./pages/GSTReportsPage"));\nconst TdsTcsReportsPage = lazy(() => import("./pages/TdsTcsReportsPage"));'
);
appTsx = appTsx.replace(
  '<Route path="/reports/gst" element={<GSTReportsPage />} />',
  '<Route path="/reports/gst" element={<GSTReportsPage />} />\n              <Route path="/reports/tds-tcs" element={<TdsTcsReportsPage />} />'
);
fs.writeFileSync('src/App.tsx', appTsx);

let reportsTsx = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');
const newCard = `
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/reports/tds-tcs")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-semibold">TDS/TCS Returns</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track TDS deducted and TCS collected across your sales and purchases, and export them for filing.
            </p>
            <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => navigate("/reports/tds-tcs")}>
              View TDS/TCS Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
`;
if (!reportsTsx.includes('TDS/TCS Returns')) {
  reportsTsx = reportsTsx.replace(
    '</CardContent>\n        </Card>',
    '</CardContent>\n        </Card>\n' + newCard
  );
  fs.writeFileSync('src/pages/ReportsPage.tsx', reportsTsx);
}

console.log('App.tsx and ReportsPage.tsx updated');

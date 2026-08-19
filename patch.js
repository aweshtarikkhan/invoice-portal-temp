const fs = require('fs');
const file = 'src/pages/DashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { Button } from "@/components/ui/button";',
  'import { Button } from "@/components/ui/button";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";'
);

content = content.replace(
  'ShoppingCart,',
  'ShoppingCart, Phone, Mail, IndianRupee, ArrowUpRight, ArrowDownRight,'
);

const newStates = `
  const [dateFilter, setDateFilter] = useState("last30");
  const [analyticsData, setAnalyticsData] = useState<any>({
    sales: { currSales: 0, prevSales: 0, currPending: 0, currOverdue: 0, currReceived: 0, prevReceived: 0 },
    purchases: { currGenerated: 0, currPending: 0, currGiven: 0 },
    hr: { totalEmployees: 0, presentToday: 0, onLeaveToday: 0 },
    crm: { currLeads: 0, currCalls: 0, currApproached: 0 }
  });
`;

content = content.replace(
  'const dashboardRef = useRef<HTMLDivElement>(null);',
  'const dashboardRef = useRef<HTMLDivElement>(null);\n' + newStates
);

const newUseEffect = `
  useEffect(() => {
    if (!org?.id) return;
    const fetchAnalytics = async () => {
      const today = new Date();
      let start = new Date();
      let end = new Date();
      let prevStart = new Date();
      let prevEnd = new Date();

      if (dateFilter === "today") {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
        prevEnd = new Date(end); prevEnd.setDate(prevEnd.getDate() - 1);
      } else if (dateFilter === "yesterday") {
        start.setDate(start.getDate() - 1); start.setHours(0,0,0,0);
        end.setDate(end.getDate() - 1); end.setHours(23,59,59,999);
        prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
        prevEnd = new Date(end); prevEnd.setDate(prevEnd.getDate() - 1);
      } else if (dateFilter === "last7") {
        start.setDate(start.getDate() - 7); start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
        prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23,59,59,999);
      } else if (dateFilter === "last30") {
        start.setDate(start.getDate() - 30); start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 30);
        prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23,59,59,999);
      } else if (dateFilter === "thisMonth") {
        start.setDate(1); start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        prevStart = new Date(start); prevStart.setMonth(prevStart.getMonth() - 1);
        prevEnd = new Date(start); prevEnd.setDate(0); prevEnd.setHours(23,59,59,999);
      }

      const inRange = (dStr, s, e) => {
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= s && d <= e;
      };

      const { data: invs } = await supabase.from("invoices").select("total, balance_due, issue_date, created_at, due_date, status").eq("org_id", org.id).neq("status", "void").neq("status", "draft");
      const { data: pymts } = await supabase.from("payments").select("amount, payment_date").eq("org_id", org.id);
      
      let currSales = 0, prevSales = 0, currPending = 0, currOverdue = 0, currReceived = 0, prevReceived = 0;
      (invs || []).forEach(i => {
        const d = i.issue_date || i.created_at;
        if (inRange(d, start, end)) currSales += Number(i.total);
        if (inRange(d, prevStart, prevEnd)) prevSales += Number(i.total);
        currPending += Number(i.balance_due);
        if (i.due_date && new Date(i.due_date) < new Date() && i.status !== "paid") {
          currOverdue += Number(i.balance_due);
        }
      });
      
      (pymts || []).forEach(p => {
        if (inRange(p.payment_date, start, end)) currReceived += Number(p.amount);
        if (inRange(p.payment_date, prevStart, prevEnd)) prevReceived += Number(p.amount);
      });

      const { data: bills } = await supabase.from("bills").select("total, balance_due, bill_date, created_at").eq("org_id", org.id);
      let currGenerated = 0, currPurPending = 0, currGiven = 0;
      (bills || []).forEach(b => {
        const d = b.bill_date || b.created_at;
        if (inRange(d, start, end)) {
          currGenerated += Number(b.total);
          currGiven += (Number(b.total) - Number(b.balance_due));
        }
        currPurPending += Number(b.balance_due);
      });

      const todayStr = today.toISOString().split("T")[0];
      const { data: emps } = await supabase.from("employees").select("id").eq("org_id", org.id).eq("status", "active");
      const { data: att } = await supabase.from("attendance").select("id").eq("org_id", org.id).eq("date", todayStr).eq("status", "present");
      const { data: leaves } = await supabase.from("leaves").select("start_date, end_date").eq("org_id", org.id).eq("status", "approved");
      
      let onLeaveCount = 0;
      (leaves || []).forEach(l => {
        const ls = new Date(l.start_date); ls.setHours(0,0,0,0);
        const le = new Date(l.end_date); le.setHours(23,59,59,999);
        if (today >= ls && today <= le) onLeaveCount++;
      });

      const { data: leads } = await supabase.from("leads").select("created_at").eq("org_id", org.id);
      const { data: acts } = await supabase.from("activities").select("created_at, type").eq("org_id", org.id);
      
      let currLeads = 0, currCalls = 0, currApproached = 0;
      (leads || []).forEach(l => {
        if (inRange(l.created_at, start, end)) currLeads++;
      });
      (acts || []).forEach(a => {
        if (inRange(a.created_at, start, end)) {
          if (a.type === "call") currCalls++;
          if (a.type === "email" || a.type === "whatsapp") currApproached++;
        }
      });

      setAnalyticsData({
        sales: { currSales, prevSales, currPending, currOverdue, currReceived, prevReceived },
        purchases: { currGenerated, currPending: currPurPending, currGiven },
        hr: { totalEmployees: emps?.length || 0, presentToday: att?.length || 0, onLeaveToday: onLeaveCount },
        crm: { currLeads, currCalls, currApproached }
      });
    };
    fetchAnalytics();
  }, [org?.id, dateFilter]);

  const calcTrend = (curr, prev) => {
    if (prev === 0) return curr > 0 ? { val: 100, isUp: true } : { val: 0, isUp: true };
    const pct = ((curr - prev) / prev) * 100;
    return { val: Math.abs(pct), isUp: pct >= 0 };
  };
`;

content = content.replace(
  'useEffect(() => {',
  newUseEffect + '\n  useEffect(() => {'
);

const analyticsUI = `
      {/* Analytics Blocks */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("Overview Analytics")}</h2>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Block 1: Sales */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold">Sales & Collections</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Sales</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(analyticsData.sales.currSales)}</p>
                  {(() => {
                    const t = calcTrend(analyticsData.sales.currSales, analyticsData.sales.prevSales);
                    return (
                      <span className={\`text-[10px] font-semibold flex items-center \${t.isUp ? 'text-emerald-500' : 'text-rose-500'}\`}>
                        {t.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.val.toFixed(1)}%
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Payment Received</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(analyticsData.sales.currReceived)}</p>
                  {(() => {
                    const t = calcTrend(analyticsData.sales.currReceived, analyticsData.sales.prevReceived);
                    return (
                      <span className={\`text-[10px] font-semibold flex items-center \${t.isUp ? 'text-emerald-500' : 'text-rose-500'}\`}>
                        {t.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.val.toFixed(1)}%
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Pending</p>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-1">{fmt(analyticsData.sales.currPending)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Overdue Amount</p>
                <p className="text-lg font-semibold text-rose-600 dark:text-rose-400 mt-1">{fmt(analyticsData.sales.currOverdue)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Block 2: Purchases */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold">Purchases & Expenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Bills Generated</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{fmt(analyticsData.purchases.currGenerated)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Payment Given</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{fmt(analyticsData.purchases.currGiven)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 font-medium">Payment Pending to Vendors</p>
                <p className="text-lg font-semibold text-rose-600 dark:text-rose-400 mt-1">{fmt(analyticsData.purchases.currPending)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Block 3: HR */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold">HR & Team (Today)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-row justify-between items-center px-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{analyticsData.hr.totalEmployees}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Total Employees</p>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{analyticsData.hr.presentToday}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Present Today</p>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{analyticsData.hr.onLeaveToday}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">On Leave</p>
              </div>
            </CardContent>
          </Card>

          {/* Block 4: CRM */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                <Phone className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold">CRM & Marketing</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{analyticsData.crm.currLeads}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">New Leads</p>
              </div>
              <div>
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{analyticsData.crm.currCalls}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">Cold Calls</p>
              </div>
              <div>
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{analyticsData.crm.currApproached}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">Marketing</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
`

content = content.replace('<FeatureTilesGrid />', '<FeatureTilesGrid />\n' + analyticsUI);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched');

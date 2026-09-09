const fs = require('fs');
const file = 'src/pages/CRMCalendarPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to inject a query for 'leads' using 'created_at' and display them on the calendar.
// Let's find the fetchCalendarData function and replace it.

const newFetch = `
  const fetchCalendarData = async () => {
    setLoading(true);
    let start, end;
    
    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    // Fetch activities
    const { data: actData } = await (supabase as any)
      .from("activities")
      .select("*, leads(first_name, last_name, company)")
      .eq("org_id", org!.id)
      .gte("due_at", startStr)
      .lte("due_at", endStr);
      
    // Fetch opportunities
    const { data: oppData } = await (supabase as any)
      .from("opportunities")
      .select("*, leads(first_name, last_name, company)")
      .eq("org_id", org!.id)
      .gte("expected_close_date", startStr)
      .lte("expected_close_date", endStr);

    // Fetch leads created in this period
    const { data: leadsData } = await (supabase as any)
      .from("leads")
      .select("*")
      .eq("org_id", org!.id)
      .gte("created_at", startStr)
      .lte("created_at", endStr);

    const items: any[] = [];
    
    if (actData) {
      actData.forEach((a: any) => {
        items.push({
          id: \`act_\${a.id}\`,
          type: 'activity',
          date: a.due_at,
          title: a.subject,
          subTitle: a.leads ? \`\${a.leads.first_name} \${a.leads.last_name}\` : '',
          activity_type: a.activity_type,
          status: a.completed_at ? 'completed' : 'open'
        });
      });
    }

    if (oppData) {
      oppData.forEach((o: any) => {
        items.push({
          id: \`opp_\${o.id}\`,
          type: 'opportunity',
          date: o.expected_close_date,
          title: o.title,
          subTitle: o.leads ? \`\${o.leads.first_name} \${o.leads.last_name}\` : '',
          amount: o.amount,
          status: 'open'
        });
      });
    }

    if (leadsData) {
      leadsData.forEach((l: any) => {
        items.push({
          id: \`lead_\${l.id}\`,
          type: 'lead',
          date: l.created_at,
          title: \`New Lead: \${l.first_name} \${l.last_name}\`,
          subTitle: l.company || l.source || '',
          status: 'open'
        });
      });
    }

    setCalendarItems(items);
    setLoading(false);
  };
`;

// Replace the old fetchCalendarData with the new one
content = content.replace(/const fetchCalendarData = async \(\) => \{[\s\S]*?setLoading\(false\);\n  \};/, newFetch.trim());

// Also update getIcon to include 'lead'
const newGetIcon = `
  const getIcon = (item: any) => {
    if (item.type === 'opportunity') return <DollarSign className="w-3 h-3 mr-1" />;
    if (item.type === 'lead') return <UserPlus className="w-3 h-3 mr-1" />;
    switch(item.activity_type) {
      case 'call': return <Phone className="w-3 h-3 mr-1" />;
      case 'email': return <Mail className="w-3 h-3 mr-1" />;
      case 'meeting': return <CalendarIcon className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };
`;
content = content.replace(/const getIcon = \(item: any\) => \{[\s\S]*?\};\n/, newGetIcon.trim() + '\n');

// Make sure UserPlus is imported from lucide-react
if (!content.includes('UserPlus')) {
  content = content.replace('Clock, DollarSign', 'Clock, DollarSign, UserPlus');
}

// Add 'lead' color styling in rendering
content = content.replace(
  "item.type === 'opportunity' ? 'bg-amber-50 border-amber-200 text-amber-700' :",
  "item.type === 'opportunity' ? 'bg-amber-50 border-amber-200 text-amber-700' :\n                        item.type === 'lead' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :"
);

fs.writeFileSync(file, content);
console.log('CRMCalendarPage patched to include leads created_at');

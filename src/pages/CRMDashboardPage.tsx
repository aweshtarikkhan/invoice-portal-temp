import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO, isAfter, isBefore, addDays, startOfMonth, startOfDay, endOfDay, addMonths } from "date-fns";
import { 
  Users, Target, TrendingUp, DollarSign, Trophy, Percent, 
  Phone, Mail, Calendar, Clock, AlertCircle, ArrowRight,
  Briefcase, Activity, BarChart3, PieChart, LineChart
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CRMDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const org = useAppStore((s) => s.organization);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    openDeals: 0,
    pipelineValue: 0,
    weightedRevenue: 0,
    wonThisMonth: 0,
    conversionRate: 0,
  });

  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [overdueActivities, setOverdueActivities] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [topDeals, setTopDeals] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>({ expectedThisMonth: 0, expectedNextMonth: 0 });
  const [teamMetrics, setTeamMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (org?.id) {
      fetchDashboardData();
    }
  }, [org?.id]);

  const fetchDashboardData = async () => {
    if (!org?.id) return;
    setLoading(true);

    try {
      // Fetch Leads
      const { data: leads } = await (supabase as any).from("leads").select("*").eq("org_id", org.id);

      // Fetch Opportunities
      const { data: opportunities } = await (supabase as any).from("opportunities").select("*").eq("org_id", org.id);

      // Fetch Pipeline Stages
      const { data: pipelineStages } = await (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("order_index", { ascending: true });

      // Fetch Activities
      const { data: activities } = await (supabase as any).from("activities").select("*, leads(first_name, last_name, company)").eq("org_id", org.id);
      
      // Fetch Org Members for Team Metrics
      const { data: members } = await (supabase as any).from("org_members").select("user_id, role, users(full_name, email)").eq("org_id", org.id);

      // Process Leads
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l: any) => l.status === "converted").length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const sourceMap: Record<string, number> = {};
      leads?.forEach((l: any) => {
        const source = l.source || "Unknown";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      });
      const sources = Object.entries(sourceMap)
        .map(([name, count]) => ({ name, count, percentage: (count / totalLeads) * 100 }))
        .sort((a, b) => b.count - a.count);

      const recent = [...(leads || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // Process Opportunities & Pipeline
      let openDeals = 0;
      let pipelineValue = 0;
      let weightedRevenue = 0;
      let wonThisMonth = 0;
      
      const now = new Date();
      const monthStart = startOfMonth(now);
      const nextMonthStart = addMonths(monthStart, 1);
      const nextNextMonthStart = addMonths(nextMonthStart, 1);
      
      let expThisMonth = 0;
      let expNextMonth = 0;

      const stageMap: Record<string, any> = {};
      pipelineStages?.forEach((s: any) => {
        stageMap[s.id] = { ...s, count: 0, amount: 0 };
      });

      const openOpp = opportunities?.filter((o: any) => o.status !== "won" && o.status !== "lost") || [];
      const top5Deals = [...openOpp]
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5);

      opportunities?.forEach((o: any) => {
        const amount = o.amount || 0;
        const prob = o.probability || 0;
        
        if (o.status === "won") {
          const wonDate = o.closed_at ? new Date(o.closed_at) : new Date(o.updated_at);
          if (isAfter(wonDate, monthStart) || wonDate.getTime() === monthStart.getTime()) {
            wonThisMonth++;
          }
        } else if (o.status !== "lost") {
          openDeals++;
          pipelineValue += amount;
          weightedRevenue += (amount * prob) / 100;
          
          if (o.expected_close_date) {
             const closeDate = parseISO(o.expected_close_date);
             if (closeDate >= monthStart && closeDate < nextMonthStart) {
                 expThisMonth += (amount * prob) / 100;
             } else if (closeDate >= nextMonthStart && closeDate < nextNextMonthStart) {
                 expNextMonth += (amount * prob) / 100;
             }
          }

          if (o.stage_id && stageMap[o.stage_id]) {
            stageMap[o.stage_id].count++;
            stageMap[o.stage_id].amount += amount;
          }
        }
      });
      
      setForecast({ expectedThisMonth: expThisMonth, expectedNextMonth: expNextMonth });

      const maxFunnelAmount = Math.max(...Object.values(stageMap).map((s: any) => s.amount), 1);
      const funnel = Object.values(stageMap).map((s: any) => ({ ...s, maxFunnelAmount }));

      // Process Activities
      const today = startOfDay(now);
      const next7Days = addDays(today, 7);
      
      const upcoming = activities?.filter((a: any) => {
        if (a.status === "completed") return false;
        if (!a.due_date) return false;
        const due = parseISO(a.due_date);
        return isAfter(due, today) && isBefore(due, next7Days);
      }).sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 8) || [];

      const overdue = activities?.filter((a: any) => {
        if (a.status === "completed") return false;
        if (!a.due_date) return false;
        const due = parseISO(a.due_date);
        return isBefore(due, today);
      }).sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()).slice(0, 5) || [];
      
      // Process Team Metrics
      const tMetrics = (members || []).map((m: any) => {
        const userId = m.user_id;
        const uLeads = leads?.filter((l: any) => l.owner_id === userId).length || 0;
        const uOpps = opportunities?.filter((o: any) => o.owner_id === userId && o.status === "won").length || 0;
        const uActs = activities?.filter((a: any) => a.created_by === userId && a.status === "completed").length || 0;
        const rev = opportunities?.filter((o: any) => o.owner_id === userId && o.status === "won").reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0;
        
        return {
           name: m.users?.full_name || m.users?.email?.split("@")[0] || "Unknown",
           leads: uLeads,
           wonDeals: uOpps,
           activities: uActs,
           revenue: rev
        };
      }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
      
      setTeamMetrics(tMetrics);

      setMetrics({
        totalLeads,
        openDeals,
        pipelineValue,
        weightedRevenue,
        wonThisMonth,
        conversionRate,
      });

      setFunnelData(funnel);
      setLeadSources(sources);
      setRecentLeads(recent);
      setTopDeals(top5Deals);
      setUpcomingActivities(upcoming);
      setOverdueActivities(overdue);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const currencyCode = org?.currency_code || "INR";

  const kpis = [
    { label: "Total Leads", value: metrics.totalLeads.toLocaleString(), icon: Users, color: "from-blue-600/20 to-blue-900/10", textColor: "text-blue-500" },
    { label: "Open Deals", value: metrics.openDeals.toLocaleString(), icon: Target, color: "from-indigo-600/20 to-indigo-900/10", textColor: "text-indigo-500" },
    { label: "Pipeline Value", value: formatCurrency(metrics.pipelineValue, currencyCode), icon: DollarSign, color: "from-emerald-600/20 to-emerald-900/10", textColor: "text-emerald-500" },
    { label: "Weighted Rev", value: formatCurrency(metrics.weightedRevenue, currencyCode), icon: TrendingUp, color: "from-purple-600/20 to-purple-900/10", textColor: "text-purple-500" },
    { label: "Won This Month", value: metrics.wonThisMonth.toLocaleString(), icon: Trophy, color: "from-amber-600/20 to-amber-900/10", textColor: "text-amber-500" },
    { label: "Conversion Rate", value: `${metrics.conversionRate.toFixed(1)}%`, icon: Percent, color: "from-pink-600/20 to-pink-900/10", textColor: "text-pink-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Activity className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Business CRM Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your sales pipeline and activities.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className={`bg-gradient-to-br ${kpi.color} border-slate-800`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-300">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.textColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pipeline Funnel */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No open deals in pipeline.</div>
              ) : (
                <div className="space-y-4">
                  {funnelData.map((stage, i) => {
                    const widthPct = Math.max((stage.amount / stage.maxFunnelAmount) * 100, 5);
                    return (
                      <div key={i} className="flex flex-col space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-300">{stage.name}</span>
                          <span className="text-slate-400">
                            {stage.count} deals ({formatCurrency(stage.amount, currencyCode)})
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Sales Forecasting */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-emerald-400" />
                Sales Forecasting
              </CardTitle>
              <CardDescription className="text-slate-400">Weighted projected revenue based on expected close dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-1">Expected This Month</div>
                  <div className="text-2xl font-bold text-emerald-400">{formatCurrency(forecast.expectedThisMonth, currencyCode)}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-1">Expected Next Month</div>
                  <div className="text-2xl font-bold text-blue-400">{formatCurrency(forecast.expectedNextMonth, currencyCode)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Deals */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Top Open Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDeals.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-4">No open deals.</div>
                  ) : (
                    topDeals.map(deal => (
                      <div key={deal.id} className="flex justify-between items-center cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg -mx-2 transition-colors" onClick={() => navigate(`/opportunities/${deal.id}`)}>
                        <div className="truncate">
                          <div className="font-medium text-slate-200 truncate">{deal.name}</div>
                          <div className="text-xs text-slate-400 truncate">{deal.company}</div>
                        </div>
                        <div className="text-right whitespace-nowrap ml-2">
                          <div className="font-semibold text-emerald-400">{formatCurrency(deal.amount, currencyCode)}</div>
                          <div className="text-xs text-slate-500">{deal.probability}% prob.</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Lead Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadSources.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-4">No source data available.</div>
                  ) : (
                    leadSources.map((source, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{source.name}</span>
                          <span className="text-slate-400">{source.count} ({source.percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${source.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Team Performance */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-400 border-b border-slate-800">
                     <tr>
                       <th className="pb-2 font-medium">Team Member</th>
                       <th className="pb-2 font-medium text-center">Leads</th>
                       <th className="pb-2 font-medium text-center">Activities</th>
                       <th className="pb-2 font-medium text-center">Deals Won</th>
                       <th className="pb-2 font-medium text-right">Revenue Won</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50">
                     {teamMetrics.map((tm, idx) => (
                       <tr key={idx} className="hover:bg-slate-800/30">
                         <td className="py-3 text-slate-200 font-medium">{tm.name}</td>
                         <td className="py-3 text-center text-slate-300">{tm.leads}</td>
                         <td className="py-3 text-center text-slate-300">{tm.activities}</td>
                         <td className="py-3 text-center text-emerald-400">{tm.wonDeals}</td>
                         <td className="py-3 text-right text-emerald-400 font-semibold">{formatCurrency(tm.revenue, currencyCode)}</td>
                       </tr>
                     ))}
                     {teamMetrics.length === 0 && (
                       <tr><td colSpan={5} className="py-4 text-center text-slate-500">No team data available.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          
          {/* Overdue Activities */}
          {overdueActivities.length > 0 && (
            <Card className="border-rose-900/50 bg-rose-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-rose-400 flex items-center gap-2 text-base">
                  <AlertCircle className="w-4 h-4" />
                  Overdue Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueActivities.map(act => (
                    <div key={act.id} className="flex gap-3 text-sm border-b border-rose-900/30 last:border-0 pb-2 last:pb-0">
                      <div className="mt-0.5 text-rose-500">
                        {act.activity_type === 'call' ? <Phone className="w-4 h-4" /> : 
                         act.activity_type === 'email' ? <Mail className="w-4 h-4" /> : 
                         <Calendar className="w-4 h-4" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-medium text-rose-200 truncate">{act.title}</div>
                        <div className="text-xs text-rose-400 truncate">
                          Due: {act.due_date ? format(parseISO(act.due_date), "MMM d, yyyy") : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Activities */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-blue-400" />
                Upcoming Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingActivities.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-2">No upcoming activities for the next 7 days.</div>
                ) : (
                  upcomingActivities.map(act => (
                    <div key={act.id} className="flex gap-3 text-sm border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                      <div className="mt-0.5 text-blue-400">
                        {act.activity_type === 'call' ? <Phone className="w-4 h-4" /> : 
                         act.activity_type === 'email' ? <Mail className="w-4 h-4" /> : 
                         <Calendar className="w-4 h-4" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-medium text-slate-200 truncate">{act.title}</div>
                        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                          <span>{act.leads?.first_name} {act.leads?.last_name}</span>
                          <span>{act.due_date ? format(parseISO(act.due_date), "MMM d") : ''}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button variant="ghost" className="w-full mt-2 text-blue-400 hover:text-blue-300 hover:bg-slate-800" onClick={() => navigate('/calendar')}>
                View Calendar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-emerald-400" />
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-2">No leads added recently.</div>
                ) : (
                  recentLeads.map(lead => (
                    <div key={lead.id} className="flex justify-between items-center cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
                      <div className="overflow-hidden mr-2">
                        <div className="font-medium text-slate-200 truncate">{lead.first_name} {lead.last_name}</div>
                        <div className="text-xs text-slate-400 truncate">{lead.company || lead.email}</div>
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-800">
                        {lead.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO, isAfter, isBefore, addDays, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { 
  Users, Target, TrendingUp, DollarSign, Trophy, Percent, 
  Phone, Mail, Calendar, Clock, AlertCircle, ArrowRight,
  Briefcase, Activity, BarChart3, PieChart
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
      const { data: leads } = await (supabase as any)
        .from("leads")
        .select("*")
        .eq("org_id", org.id);

      // Fetch Opportunities
      const { data: opportunities } = await (supabase as any)
        .from("opportunities")
        .select("*")
        .eq("org_id", org.id);

      // Fetch Pipeline Stages
      const { data: pipelineStages } = await (supabase as any)
        .from("pipeline_stages")
        .select("*")
        .eq("org_id", org.id)
        .order("order_index", { ascending: true });

      // Fetch Activities
      const { data: activities } = await (supabase as any)
        .from("activities")
        .select("*")
        .eq("org_id", org.id);

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

      // Process Opportunities
      const now = new Date();
      const monthStart = startOfMonth(now);

      let openDeals = 0;
      let pipelineValue = 0;
      let weightedRevenue = 0;
      let wonThisMonth = 0;

      const funnelMap: Record<string, { count: number; amount: number; name: string; color: string; order: number }> = {};
      
      pipelineStages?.forEach((stage: any) => {
        funnelMap[stage.id] = {
          count: 0,
          amount: 0,
          name: stage.name,
          color: stage.color || "#3b82f6",
          order: stage.order_index
        };
      });

      opportunities?.forEach((opp: any) => {
        const isWon = opp.stage === 'won' || opp.status === 'won';
        const isLost = opp.stage === 'lost' || opp.status === 'lost';
        const isOpen = !isWon && !isLost;

        if (isOpen) {
          openDeals++;
          pipelineValue += (opp.amount || 0);
          weightedRevenue += ((opp.amount || 0) * (opp.probability || 0)) / 100;
        }

        if (isWon) {
          const wonDate = opp.updated_at ? parseISO(opp.updated_at) : parseISO(opp.created_at);
          if (isAfter(wonDate, monthStart)) {
            wonThisMonth++;
          }
        }

        if (opp.pipeline_stage_id && funnelMap[opp.pipeline_stage_id] && isOpen) {
          funnelMap[opp.pipeline_stage_id].count++;
          funnelMap[opp.pipeline_stage_id].amount += (opp.amount || 0);
        }
      });

      const funnelList = Object.values(funnelMap)
        .sort((a, b) => a.order - b.order)
        .filter(f => f.count > 0);

      const maxFunnelAmount = Math.max(...funnelList.map(f => f.amount), 1);

      // Process Activities
      const uncompletedActivities = activities?.filter((a: any) => !a.completed_at) || [];
      const upcoming = uncompletedActivities
        .filter((a: any) => a.due_at && isAfter(parseISO(a.due_at), now) && isBefore(parseISO(a.due_at), addDays(now, 7)))
        .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
        .slice(0, 8);

      const overdue = uncompletedActivities
        .filter((a: any) => a.due_at && isBefore(parseISO(a.due_at), now))
        .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
        .slice(0, 5);

      // Recent & Top
      const recentL = [...(leads || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const topD = [...(opportunities || [])]
        .filter((o: any) => o.stage !== 'won' && o.stage !== 'lost' && o.status !== 'won' && o.status !== 'lost')
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5);

      setMetrics({
        totalLeads,
        openDeals,
        pipelineValue,
        weightedRevenue,
        wonThisMonth,
        conversionRate,
      });

      setFunnelData(funnelList.map(f => ({ ...f, maxFunnelAmount })));
      setLeadSources(sources);
      setUpcomingActivities(upcoming);
      setOverdueActivities(overdue);
      setRecentLeads(recentL);
      setTopDeals(topD);

    } catch (error) {
      console.error("Failed to fetch CRM dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currencyCode = org?.currency_code || 'INR';

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const kpis = [
    { label: "Total Leads", value: metrics.totalLeads.toLocaleString(), icon: Users, color: "from-blue-600/20 to-blue-900/10", textColor: "text-blue-500" },
    { label: "Open Deals", value: metrics.openDeals.toLocaleString(), icon: Briefcase, color: "from-purple-600/20 to-purple-900/10", textColor: "text-purple-500" },
    { label: "Pipeline Value", value: formatCurrency(metrics.pipelineValue, currencyCode), icon: DollarSign, color: "from-emerald-600/20 to-emerald-900/10", textColor: "text-emerald-500" },
    { label: "Weighted Revenue", value: formatCurrency(metrics.weightedRevenue, currencyCode), icon: TrendingUp, color: "from-cyan-600/20 to-cyan-900/10", textColor: "text-cyan-500" },
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Sales & CRM Dashboard</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Pipeline Funnel */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Pipeline by Stage
              </CardTitle>
              <CardDescription>Open opportunities grouped by pipeline stage</CardDescription>
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

          {/* Lead Source Breakdown */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-400" />
                Lead Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadSources.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No leads found.</div>
              ) : (
                <div className="space-y-4">
                  {leadSources.map((source, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-300 truncate" title={source.name}>
                        {source.name}
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full" 
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm text-slate-400">
                        {source.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Deals */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Top Open Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topDeals.length === 0 ? (
                <div className="text-center py-6 text-slate-500">No open deals found.</div>
              ) : (
                <div className="space-y-3">
                  {topDeals.map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-800/60">
                      <div>
                        <div className="font-medium text-slate-200">{deal.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Created {format(parseISO(deal.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-emerald-400">
                          {formatCurrency(deal.amount || 0, currencyCode)}
                        </div>
                        <Badge variant="outline" className="mt-1 text-[10px] border-slate-700 text-slate-300">
                          {deal.probability || 0}% Win
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Overdue Activities */}
          {overdueActivities.length > 0 && (
            <Card className="bg-red-950/20 border-red-900/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5" />
                  Overdue Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-red-950/30 rounded-lg border border-red-900/40">
                      <div className="mt-0.5 text-red-400">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-200 truncate">{activity.subject}</p>
                        <p className="text-xs text-red-400/80 mt-1">
                          Due: {format(parseISO(activity.due_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Activities */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-blue-400" />
                Upcoming Activities (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingActivities.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No upcoming activities.</div>
              ) : (
                <div className="space-y-3">
                  {upcomingActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-800/60">
                      <div className="mt-0.5 text-slate-400">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{activity.subject}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(activity.due_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-pink-400" />
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No recent leads.</div>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-800/60 hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium text-xs">
                          {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                          {!lead.first_name && !lead.last_name && (lead.company_name?.[0] || '?')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">
                            {lead.first_name || lead.last_name ? `${lead.first_name || ''} ${lead.last_name || ''}` : lead.company_name}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            {lead.company_name && (lead.first_name || lead.last_name) ? lead.company_name : lead.email || lead.phone || 'No contact info'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px] whitespace-nowrap bg-slate-800 border-slate-700 text-slate-300">
                        {lead.status?.replace('_', ' ') || 'New'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

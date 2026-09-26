import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";
import { exportFullPagePDF } from "@/lib/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import {
  DollarSign,
  BarChart3,
  Download,
  FileText,
  Target,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  ExternalLink,
  Layers,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { format, parseISO } from "date-fns";

const STAGE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];

export default function CRMReportsPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const currency = org?.currency_code || "INR";

  const [loading, setLoading] = useState(true);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);

  useEffect(() => {
    if (org?.id) {
      fetchData();
    }
  }, [org?.id]);

  const fetchData = async () => {
    if (!org?.id) return;
    setLoading(true);

    try {
      const [
        { data: leads },
        { data: opps },
        { data: stages },
        { data: clients },
      ] = await Promise.all([
        (supabase as any).from("leads").select("*").eq("org_id", org.id),
        (supabase as any).from("opportunities").select("*").eq("org_id", org.id),
        (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("sort_order", { ascending: true }),
        (supabase as any).from("clients").select("id, name, display_name").eq("org_id", org.id),
      ]);

      setLeadsList(leads || []);
      setOpportunities(opps || []);
      setPipelineStages(stages || []);
      setClientsList(clients || []);
    } catch (error) {
      console.error("Error fetching CRM reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper map for fast stage lookup
  const stageLookup = useMemo(() => {
    return new Map(pipelineStages.map((s: any) => [s.id, s]));
  }, [pipelineStages]);

  // Stage classification helpers
  const isWonStage = (stage: any) => stage?.is_won || stage?.name?.toLowerCase().includes("won");
  const isLostStage = (stage: any) => stage?.is_lost || stage?.name?.toLowerCase().includes("lost");

  // Filtered Opportunities
  const wonOpportunities = useMemo(() => {
    return opportunities.filter((o: any) => {
      const stage = stageLookup.get(o.stage_id);
      return o.status === "won" || isWonStage(stage);
    });
  }, [opportunities, stageLookup]);

  const lostOpportunities = useMemo(() => {
    return opportunities.filter((o: any) => {
      const stage = stageLookup.get(o.stage_id);
      return o.status === "lost" || isLostStage(stage);
    });
  }, [opportunities, stageLookup]);

  // Open Opportunities: Active deals in any non-won and non-lost stage
  const openOpportunities = useMemo(() => {
    return opportunities.filter((o: any) => {
      const stage = stageLookup.get(o.stage_id);
      if (o.status === "won" || o.status === "lost") return false;
      if (isWonStage(stage) || isLostStage(stage)) return false;
      return true;
    });
  }, [opportunities, stageLookup]);

  // Calculated Metrics
  const wonValue = useMemo(() => {
    return wonOpportunities.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [wonOpportunities]);

  const openPipelineValue = useMemo(() => {
    return openOpportunities.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [openOpportunities]);

  const weightedPipelineValue = useMemo(() => {
    return openOpportunities.reduce((sum, o) => {
      const stage = stageLookup.get(o.stage_id);
      const prob = o.probability !== undefined && o.probability !== null 
        ? Number(o.probability) 
        : (stage?.win_probability || 0);
      return sum + ((Number(o.amount) || 0) * prob) / 100;
    }, 0);
  }, [openOpportunities, stageLookup]);

  const totalClosed = wonOpportunities.length + lostOpportunities.length;
  const winRate = totalClosed > 0 
    ? (wonOpportunities.length / totalClosed) * 100 
    : (opportunities.length > 0 ? (wonOpportunities.length / opportunities.length) * 100 : 0);

  // Pipeline Data for Chart and Stages Breakdown
  const pipelineChartData = useMemo(() => {
    return pipelineStages.map((s: any, idx: number) => {
      const stageDeals = opportunities.filter((o: any) => o.stage_id === s.id);
      const totalAmount = stageDeals.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      return {
        id: s.id,
        name: s.name,
        count: stageDeals.length,
        amount: totalAmount,
        color: s.color || STAGE_COLORS[idx % STAGE_COLORS.length],
        win_probability: s.win_probability,
        is_won: s.is_won,
        is_lost: s.is_lost,
      };
    });
  }, [pipelineStages, opportunities]);

  // Top 5 Open Opportunities sorted by value descending
  const topOpportunities = useMemo(() => {
    return [...openOpportunities]
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      .slice(0, 5);
  }, [openOpportunities]);

  // Lead Sources Breakdown
  const leadSourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leadsList.forEach((l: any) => {
      const source = (l.source || "Other / Direct").trim();
      map[source] = (map[source] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [leadsList]);

  // Contact Name Resolver
  const getContactInfo = (opp: any) => {
    if (opp.lead_id) {
      const lead = leadsList.find((l: any) => l.id === opp.lead_id);
      if (lead) return { name: lead.name, company: lead.company, type: "Lead" };
    }
    if (opp.client_id) {
      const client = clientsList.find((c: any) => c.id === opp.client_id);
      if (client) return { name: client.display_name || client.name, company: null, type: "Client" };
    }
    return { name: "Direct Prospect", company: null, type: "General" };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-slate-500 font-medium text-sm">Loading CRM Analytics & Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10" id="crm-report-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CRM Reports & Analytics</h1>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              Live Pipeline
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Monitor sales pipeline health, deal conversion velocity, and open revenue opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            All Reports
          </Button>
          <Button
            onClick={() => exportFullPagePDF("crm-report-page", "CRM_Performance_Report")}
            className="shrink-0 bg-primary hover:bg-primary/90 text-white shadow-sm"
            size="sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Full Report (PDF)
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Won Revenue */}
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Won Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(wonValue, currency)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {wonOpportunities.length} deals closed won
            </p>
          </CardContent>
        </Card>

        {/* Active Pipeline Value */}
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Active Pipeline Value
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(openPipelineValue, currency)}
            </div>
            <p className="text-xs text-blue-600 font-medium mt-1">
              {openOpportunities.length} active opportunities open
            </p>
          </CardContent>
        </Card>

        {/* Weighted Pipeline Forecast */}
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Weighted Forecast
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(weightedPipelineValue, currency)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Probability-adjusted expected revenue
            </p>
          </CardContent>
        </Card>

        {/* Win Rate & Total Leads */}
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Win Rate & Leads
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Across {leadsList.length} total sales leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Distribution & Stage Breakdown */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Pipeline Stages Chart (8 cols) */}
        <Card className="lg:col-span-8 border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Pipeline Stages Distribution
              </CardTitle>
              <CardDescription>Number of active deals and deal flow across each pipeline stage</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pipeline")}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Open Kanban <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-slate-100">{data.name}</p>
                            <p className="text-slate-300">Deals: <span className="font-semibold text-white">{data.count}</span></p>
                            <p className="text-slate-300">Total Value: <span className="font-semibold text-emerald-400">{formatCurrency(data.amount, currency)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stage Value Breakdown Table (4 cols) */}
        <Card className="lg:col-span-4 border-slate-200 shadow-xs flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Stage Breakdown
            </CardTitle>
            <CardDescription>Deals and aggregate pipeline values</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3">
            {pipelineChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No pipeline stages configured.</p>
            ) : (
              pipelineChartData.map((stage) => (
                <div key={stage.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-bold text-slate-800 truncate">{stage.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium pl-4">
                      {stage.count} {stage.count === 1 ? "Deal" : "Deals"}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-900">
                      {formatCurrency(stage.amount, currency)}
                    </div>
                    {stage.win_probability !== undefined && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {stage.win_probability}% prob.
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Open Opportunities Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Top Open Opportunities
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs">
                {openOpportunities.length} Active Deals
              </Badge>
            </div>
            <CardDescription>
              Highest value active opportunities currently progressing through your sales funnel
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => {
                if (!openOpportunities.length) return;
                const headers = ["Deal Name", "Contact / Lead", "Stage", "Amount", "Win Probability", "Expected Close"];
                const rows = openOpportunities.map((opp) => {
                  const contact = getContactInfo(opp);
                  const stage = stageLookup.get(opp.stage_id);
                  return [
                    opp.title || "Untitled Deal",
                    `${contact.name}${contact.company ? ` (${contact.company})` : ""}`,
                    stage?.name || "Unassigned",
                    opp.amount || 0,
                    `${opp.probability || stage?.win_probability || 0}%`,
                    opp.expected_close_date ? format(parseISO(opp.expected_close_date), "MMM d, yyyy") : "Not set",
                  ];
                });
                exportTableToCSV(headers, rows, "open_opportunities_report");
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => {
                if (!openOpportunities.length) return;
                const headers = ["Deal Name", "Contact / Lead", "Stage", "Amount", "Win Prob.", "Expected Close"];
                const rows = openOpportunities.map((opp) => {
                  const contact = getContactInfo(opp);
                  const stage = stageLookup.get(opp.stage_id);
                  return [
                    opp.title || "Untitled Deal",
                    `${contact.name}${contact.company ? ` (${contact.company})` : ""}`,
                    stage?.name || "Unassigned",
                    formatCurrency(opp.amount || 0, currency),
                    `${opp.probability || stage?.win_probability || 0}%`,
                    opp.expected_close_date ? format(parseISO(opp.expected_close_date), "MMM d, yyyy") : "Not set",
                  ];
                });
                exportTableToPDF("Active CRM Opportunities Report", headers, rows, "open_opportunities_report");
              }}
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">Opportunity / Deal</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Client / Lead</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Stage</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Deal Value</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-center">Win Probability</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Expected Close</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Briefcase className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-700">No open opportunities found</p>
                        <p className="text-xs text-slate-400">All current opportunities are either won, lost, or not yet created.</p>
                        <Button size="sm" variant="outline" onClick={() => navigate("/pipeline")} className="mt-2 text-xs">
                          Go to Pipeline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  topOpportunities.map((opp) => {
                    const stage = stageLookup.get(opp.stage_id);
                    const contact = getContactInfo(opp);
                    const prob = opp.probability !== undefined && opp.probability !== null 
                      ? opp.probability 
                      : (stage?.win_probability || 0);

                    return (
                      <TableRow key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Title */}
                        <TableCell className="font-semibold text-slate-900 text-xs sm:text-sm">
                          <button
                            onClick={() => navigate(`/pipeline/${opp.id}`)}
                            className="text-left hover:text-primary hover:underline font-bold text-slate-800"
                          >
                            {opp.title || "Untitled Deal"}
                          </button>
                        </TableCell>

                        {/* Contact / Lead */}
                        <TableCell className="text-xs">
                          <span className="font-medium text-slate-800 block">{contact.name}</span>
                          {contact.company && (
                            <span className="text-[11px] text-slate-500">{contact.company}</span>
                          )}
                        </TableCell>

                        {/* Stage */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[11px] font-semibold px-2 py-0.5"
                            style={{
                              backgroundColor: `${stage?.color || "#3b82f6"}15`,
                              borderColor: `${stage?.color || "#3b82f6"}40`,
                              color: stage?.color || "#3b82f6",
                            }}
                          >
                            {stage?.name || "Unassigned"}
                          </Badge>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right font-black text-slate-900 text-xs sm:text-sm">
                          {formatCurrency(Number(opp.amount) || 0, currency)}
                        </TableCell>

                        {/* Probability */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-xs font-bold text-slate-700">{prob}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, prob))}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Expected Close */}
                        <TableCell className="text-xs text-slate-600">
                          {opp.expected_close_date ? (
                            <div className="flex items-center gap-1 text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{format(parseISO(opp.expected_close_date), "MMM d, yyyy")}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Not scheduled</span>
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/pipeline/${opp.id}`)}
                            className="h-8 px-2.5 text-xs text-slate-700 hover:text-primary"
                          >
                            View Deal
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Sources & Acquisition Channels */}
      {leadSourceData.length > 0 && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Lead Generation Sources
            </CardTitle>
            <CardDescription>Breakdown of client inquiries and prospects by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {leadSourceData.map((src, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-600 truncate">{src.name}</p>
                  <p className="text-lg font-black text-slate-900">{src.count}</p>
                  <p className="text-[10px] text-slate-400">
                    {leadsList.length > 0 ? ((src.count / leadsList.length) * 100).toFixed(0) : 0}% of total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";
import { exportFullPagePDF } from "@/lib/pdfUtils";
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  addDays,
  startOfMonth,
  startOfDay,
  endOfDay,
  addMonths,
  isToday,
} from "date-fns";
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  ListTodo,
  CalendarCheck2,
  IndianRupee,
  TrendingUp,
  Trophy,
  Percent,
  BarChart3,
  Calendar,
  AlertCircle,
  ArrowRight,
  Plus,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
  PieChart,
  LineChart,
  Building2,
  ExternalLink,
  LifeBuoy,
  Download,
  FileText,
  Briefcase,
  Layers,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ManagementMetrics {
  totalLeads: number;
  newLeads: number;
  followUpsDue: number;
  convertedLeads: number;
  openTickets: number;
  closedTickets: number;
  pendingTasks: number;
  completedTasks: number;
  conversionRate: number;
  winRate: number;
  pipelineValue: number;
  weightedRevenue: number;
  wonDealsCount: number;
  wonRevenue: number;
  openDeals: number;
}

const STAGE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];

export default function CRMReportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const org = useAppStore((s) => s.organization);
  const currencyCode = org?.currency_code || "INR";

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [metrics, setMetrics] = useState<ManagementMetrics>({
    totalLeads: 0,
    newLeads: 0,
    followUpsDue: 0,
    convertedLeads: 0,
    openTickets: 0,
    closedTickets: 0,
    pendingTasks: 0,
    completedTasks: 0,
    conversionRate: 0,
    winRate: 0,
    pipelineValue: 0,
    weightedRevenue: 0,
    wonDealsCount: 0,
    wonRevenue: 0,
    openDeals: 0,
  });

  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [stageChartData, setStageChartData] = useState<any[]>([]);
  const [openOpportunities, setOpenOpportunities] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [forecast, setForecast] = useState<{ expectedThisMonth: number; expectedNextMonth: number }>({
    expectedThisMonth: 0,
    expectedNextMonth: 0,
  });
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (org?.id) {
      fetchDashboardData();
    }
  }, [org?.id]);

  const fetchDashboardData = async () => {
    if (!org?.id) return;
    setLoading(true);

    try {
      const [
        { data: leadsData },
        { data: oppsData },
        { data: stagesData },
        { data: actsData },
        { data: ticketsData },
        { data: clientsData },
        { data: crmTeamData },
        { data: membersData },
        { data: profilesData },
      ] = await Promise.all([
        (supabase as any).from("leads").select("*").eq("org_id", org.id),
        (supabase as any).from("opportunities").select("*").eq("org_id", org.id),
        (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("sort_order", { ascending: true }),
        (supabase as any).from("activities").select("*, leads(name, company)").eq("org_id", org.id),
        (supabase as any).from("tickets").select("*, clients(display_name, email, phone), leads(name, email, phone)").eq("org_id", org.id).order("created_at", { ascending: false }),
        (supabase as any).from("clients").select("id, name, display_name").eq("org_id", org.id),
        (supabase as any).from("crm_team").select("*").eq("org_id", org.id).eq("is_active", true),
        supabase.from("organization_members").select("user_id, role").eq("org_id", org.id),
        supabase.from("profiles").select("user_id, full_name, email").eq("org_id", org.id),
      ]);

      const leads = leadsData || [];
      const opportunities = oppsData || [];
      const stages = stagesData || [];
      const activities = actsData || [];
      const tickets = ticketsData || [];
      const clients = clientsData || [];
      const crmTeam = crmTeamData || [];
      const members = membersData || [];
      const profiles = profilesData || [];
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setClientsList(clients);
      setLeadsList(leads);
      setPipelineStages(stages);

      // 1. Process Leads
      const totalLeads = leads.length;
      const newLeads = leads.filter((l: any) => (l.status || "").toLowerCase() === "new").length;
      const convertedLeads = leads.filter((l: any) => {
        const s = (l.status || "").toLowerCase();
        return s === "converted" || s === "won";
      }).length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Lead Sources Breakdown
      const sourceMap: Record<string, number> = {};
      leads.forEach((l: any) => {
        let src = l.source ? String(l.source).trim() : "Direct / Referral";
        src = src.charAt(0).toUpperCase() + src.slice(1).replace(/_/g, " ");
        sourceMap[src] = (sourceMap[src] || 0) + 1;
      });
      const sources = Object.entries(sourceMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const recentLeadsList = [...leads]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // 2. Process Activities (Tasks & Follow-ups)
      const now = new Date();
      const endOfToday = endOfDay(now);

      let pendingTasks = 0;
      let completedTasks = 0;
      let followUpsDue = 0;

      activities.forEach((a: any) => {
        const isCompleted = Boolean(
          a.completed_at || (a.status && a.status.toLowerCase() === "completed")
        );
        if (isCompleted) {
          completedTasks++;
        } else {
          pendingTasks++;
          const dueDateStr = a.due_at || a.due_date;
          const isFollowUpType = (a.activity_type || "").toLowerCase().includes("follow");
          const isDueTodayOrPast = dueDateStr ? isBefore(parseISO(dueDateStr), endOfToday) : false;
          if (isFollowUpType || isDueTodayOrPast) {
            followUpsDue++;
          }
        }
      });

      const upcomingActs = activities
        .filter((a: any) => {
          const isCompleted = Boolean(
            a.completed_at || (a.status && a.status.toLowerCase() === "completed")
          );
          return !isCompleted;
        })
        .sort((a: any, b: any) => {
          const dateA = a.due_at || a.due_date ? new Date(a.due_at || a.due_date).getTime() : 0;
          const dateB = b.due_at || b.due_date ? new Date(b.due_at || b.due_date).getTime() : 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA - dateB;
        })
        .slice(0, 6);

      // 3. Process Tickets
      let openTickets = 0;
      let closedTickets = 0;

      tickets.forEach((t: any) => {
        const s = (t.status || "").toLowerCase();
        if (["closed", "resolved"].includes(s)) {
          closedTickets++;
        } else {
          openTickets++;
        }
      });

      const recentTicketsList = tickets.slice(0, 5);

      // 4. Process Opportunities & Pipeline
      const stageMap: Record<string, any> = {};
      stages.forEach((s: any, idx: number) => {
        stageMap[s.id] = {
          ...s,
          count: 0,
          amount: 0,
          color: s.color || STAGE_COLORS[idx % STAGE_COLORS.length],
        };
      });

      let openDeals = 0;
      let pipelineValue = 0;
      let weightedRevenue = 0;
      let wonDealsCount = 0;
      let wonRevenue = 0;
      let lostDealsCount = 0;

      const monthStart = startOfMonth(now);
      const nextMonthStart = addMonths(monthStart, 1);
      const nextNextMonthStart = addMonths(nextMonthStart, 1);

      let expThisMonth = 0;
      let expNextMonth = 0;

      const openOppList: any[] = [];

      opportunities.forEach((o: any) => {
        const amount = Number(o.amount) || 0;
        const prob = Number(o.probability) || 0;
        const stage = o.stage_id ? stageMap[o.stage_id] : null;

        const isWon =
          stage?.is_won ||
          (stage?.name && stage.name.toLowerCase().includes("won")) ||
          prob === 100;
        const isLost =
          stage?.is_lost ||
          (stage?.name && stage.name.toLowerCase().includes("lost"));

        if (isWon) {
          wonDealsCount++;
          wonRevenue += amount;
        } else if (isLost) {
          lostDealsCount++;
        } else {
          openDeals++;
          pipelineValue += amount;
          weightedRevenue += (amount * prob) / 100;
          openOppList.push(o);

          if (o.expected_close_date) {
            try {
              const closeDate = parseISO(o.expected_close_date);
              if (closeDate >= monthStart && closeDate < nextMonthStart) {
                expThisMonth += (amount * prob) / 100;
              } else if (closeDate >= nextMonthStart && closeDate < nextNextMonthStart) {
                expNextMonth += (amount * prob) / 100;
              }
            } catch {
              // ignore
            }
          }
        }

        // Tally stage stats for chart
        if (o.stage_id && stageMap[o.stage_id]) {
          stageMap[o.stage_id].count++;
          stageMap[o.stage_id].amount += amount;
        }
      });

      const totalClosed = wonDealsCount + lostDealsCount;
      const winRate =
        totalClosed > 0
          ? (wonDealsCount / totalClosed) * 100
          : opportunities.length > 0
          ? (wonDealsCount / opportunities.length) * 100
          : 0;

      // Pipeline stages chart data
      const chartData = stages.map((s: any, idx: number) => {
        const st = stageMap[s.id] || { count: 0, amount: 0 };
        return {
          id: s.id,
          name: s.name,
          count: st.count,
          amount: st.amount,
          color: s.color || STAGE_COLORS[idx % STAGE_COLORS.length],
          win_probability: s.win_probability,
          is_won: s.is_won,
          is_lost: s.is_lost,
        };
      });

      // Sort top open opportunities by amount desc
      const sortedOpenOpps = [...openOppList].sort(
        (a: any, b: any) => (Number(b.amount) || 0) - (Number(a.amount) || 0)
      );

      // 5. Team Performance Leaderboard
      const teamMap = new Map<string, any>();
      crmTeam.forEach((t: any) => {
        teamMap.set(t.id, {
          id: t.id,
          name: t.name,
          role: t.role || "Sales Executive",
          leads: 0,
          activities: 0,
          wonDeals: 0,
          revenue: 0,
        });
      });

      members.forEach((m: any) => {
        if (!teamMap.has(m.user_id)) {
          const prof = profileMap.get(m.user_id);
          teamMap.set(m.user_id, {
            id: m.user_id,
            name: prof?.full_name || prof?.email?.split("@")[0] || "Team Member",
            role: m.role || "Member",
            leads: 0,
            activities: 0,
            wonDeals: 0,
            revenue: 0,
          });
        }
      });

      leads.forEach((l: any) => {
        const owner = l.owner_id || l.assigned_to;
        if (owner && teamMap.has(owner)) {
          teamMap.get(owner).leads++;
        }
      });

      activities.forEach((a: any) => {
        const isCompleted = Boolean(
          a.completed_at || (a.status && a.status.toLowerCase() === "completed")
        );
        const owner = a.owner_id || a.created_by;
        if (isCompleted && owner && teamMap.has(owner)) {
          teamMap.get(owner).activities++;
        }
      });

      opportunities.forEach((o: any) => {
        const stage = o.stage_id ? stageMap[o.stage_id] : null;
        const isWon =
          stage?.is_won ||
          (stage?.name && stage.name.toLowerCase().includes("won")) ||
          Number(o.probability) === 100;
        if (isWon && o.owner_id && teamMap.has(o.owner_id)) {
          teamMap.get(o.owner_id).wonDeals++;
          teamMap.get(o.owner_id).revenue += Number(o.amount) || 0;
        }
      });

      const leaderboard = Array.from(teamMap.values())
        .filter((t: any) => t.leads > 0 || t.activities > 0 || t.wonDeals > 0 || t.revenue > 0)
        .sort((a: any, b: any) => b.revenue - a.revenue || b.wonDeals - a.wonDeals || b.leads - a.leads)
        .slice(0, 6);

      setMetrics({
        totalLeads,
        newLeads,
        followUpsDue,
        convertedLeads,
        openTickets,
        closedTickets,
        pendingTasks,
        completedTasks,
        conversionRate,
        winRate,
        pipelineValue,
        weightedRevenue,
        wonDealsCount,
        wonRevenue,
        openDeals,
      });

      setStageChartData(chartData);
      setOpenOpportunities(sortedOpenOpps);
      setLeadSources(sources);
      setRecentLeads(recentLeadsList);
      setUpcomingActivities(upcomingActs);
      setRecentTickets(recentTicketsList);
      setForecast({
        expectedThisMonth: expThisMonth,
        expectedNextMonth: expNextMonth,
      });
      setTeamLeaderboard(leaderboard);
    } catch (err: any) {
      console.error("CRMDashboard fetch error:", err);
      toast({
        title: "Failed to load CRM report",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper map for fast stage lookup
  const stageLookup = useMemo(() => {
    return new Map(pipelineStages.map((s: any) => [s.id, s]));
  }, [pipelineStages]);

  // Contact Name Resolver for Deals
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

  // Handle Full Page PDF Export
  const handleExportFullPDF = async () => {
    try {
      setIsExporting(true);
      await exportFullPagePDF("crm-report-page", `CRM_Executive_Report_${format(new Date(), "yyyy-MM-dd")}`);
      toast({ title: "Report downloaded", description: "CRM Executive Report exported as PDF successfully." });
    } catch (e: any) {
      console.error("PDF export failed:", e);
      toast({ title: "Export failed", description: e.message || "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Open Opportunities Table to CSV
  const handleExportOppsCSV = () => {
    if (!openOpportunities.length) {
      toast({ title: "No data to export", description: "No open opportunities available." });
      return;
    }
    const headers = ["Deal Name", "Contact / Client", "Stage", "Deal Value", "Win Probability", "Expected Close"];
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
    toast({ title: "CSV Downloaded", description: "Open opportunities exported to CSV successfully." });
  };

  // Export Open Opportunities Table to PDF
  const handleExportOppsPDF = () => {
    if (!openOpportunities.length) {
      toast({ title: "No data to export", description: "No open opportunities available." });
      return;
    }
    const headers = ["Deal Name", "Contact / Client", "Stage", "Amount", "Win Prob.", "Expected Close"];
    const rows = openOpportunities.map((opp) => {
      const contact = getContactInfo(opp);
      const stage = stageLookup.get(opp.stage_id);
      return [
        opp.title || "Untitled Deal",
        `${contact.name}${contact.company ? ` (${contact.company})` : ""}`,
        stage?.name || "Unassigned",
        formatCurrency(opp.amount || 0, currencyCode),
        `${opp.probability || stage?.win_probability || 0}%`,
        opp.expected_close_date ? format(parseISO(opp.expected_close_date), "MMM d, yyyy") : "Not set",
      ];
    });
    exportTableToPDF("Active CRM Opportunities Report", headers, rows, "open_opportunities_report");
    toast({ title: "PDF Downloaded", description: "Opportunities report exported to PDF successfully." });
  };

  // 8 Specific Management Dashboard Overview Metrics
  const managementCards = [
    {
      title: "Total Leads",
      value: metrics.totalLeads,
      subtitle: "All registered prospects",
      icon: Users,
      bgColor: "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/50",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      action: () => navigate("/leads"),
    },
    {
      title: "New Leads",
      value: metrics.newLeads,
      subtitle: "Fresh inquiries to qualify",
      icon: UserPlus,
      bgColor: "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/50",
      badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
      action: () => navigate("/leads"),
    },
    {
      title: "Follow-ups Due",
      value: metrics.followUpsDue,
      subtitle: "Due today or overdue",
      icon: Clock,
      bgColor: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/50",
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      action: () => navigate("/activities"),
    },
    {
      title: "Converted Leads",
      value: metrics.convertedLeads,
      subtitle: `${metrics.conversionRate.toFixed(1)}% conversion rate`,
      icon: CheckCircle2,
      bgColor: "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      action: () => navigate("/leads"),
    },
    {
      title: "Open Tickets",
      value: metrics.openTickets,
      subtitle: "Pending client requests",
      icon: Ticket,
      bgColor: "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/50",
      badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      action: () => navigate("/tickets"),
    },
    {
      title: "Closed Tickets",
      value: metrics.closedTickets,
      subtitle: "Resolved support issues",
      icon: ShieldCheck,
      bgColor: "bg-teal-50/70 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-900/50",
      badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
      action: () => navigate("/tickets"),
    },
    {
      title: "Pending Tasks",
      value: metrics.pendingTasks,
      subtitle: "Active CRM activities",
      icon: ListTodo,
      bgColor: "bg-purple-50/70 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/50",
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
      action: () => navigate("/activities"),
    },
    {
      title: "Completed Tasks",
      value: metrics.completedTasks,
      subtitle: "Finished sales actions",
      icon: CalendarCheck2,
      bgColor: "bg-sky-50/70 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-900/50",
      badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
      action: () => navigate("/activities"),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      id="crm-report-page"
      className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950/20"
    >
      {/* 1. Header with Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <BarChart3 className="h-7 w-7 text-primary" />
              CRM Report
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              Live Pipeline
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time management overview of leads, deal pipeline, client tickets, sales velocity, and team performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFullPDF}
            disabled={isExporting}
            className="border-slate-200 dark:border-slate-800"
          >
            <Download className="h-4 w-4 mr-1.5 text-primary" />
            {isExporting ? "Exporting..." : "Export Report (PDF)"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/pipeline")}
            className="border-slate-200 dark:border-slate-800"
          >
            <BarChart3 className="h-4 w-4 mr-1.5 text-indigo-500" /> Pipeline Kanban
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/tickets?add=1")}
            className="border-slate-200 dark:border-slate-800"
          >
            <Ticket className="h-4 w-4 mr-1.5 text-rose-500" /> + New Ticket
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/leads?add=1")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> + New Lead
          </Button>
        </div>
      </div>

      {/* 2. Management Dashboard Overview (8 Core Requested Metrics) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Management Dashboard Overview
            </h2>
            <p className="text-xs text-muted-foreground">
              Key indicators across prospect acquisition, customer care, and operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {managementCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card
                key={idx}
                onClick={card.action}
                className={`relative overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/40 cursor-pointer bg-white dark:bg-slate-900 ${card.bgColor}`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {card.title}
                    </span>
                    <div className={`p-2 rounded-lg ${card.badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {card.value.toLocaleString()}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. Pipeline Financial & Performance Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Active Pipeline Value
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.pipelineValue, currencyCode)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.openDeals} open deals in funnel
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Weighted Forecast
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(metrics.weightedRevenue, currencyCode)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Probability-adjusted revenue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Won Deals Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(metrics.wonRevenue, currencyCode)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.wonDealsCount} deals closed won
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Win Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.winRate.toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Closed deals success rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Lead Conversion
            </CardTitle>
            <div className="p-2 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
              {metrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.convertedLeads} of {metrics.totalLeads} leads converted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Interactive Pipeline Stages: Recharts Distribution & Breakdown List */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Pipeline Stages Interactive Bar Chart (8 cols) */}
        <Card className="lg:col-span-8 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Pipeline Stages Distribution
              </CardTitle>
              <CardDescription>
                Deal volume and monetary value moving through each sales stage
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pipeline")}
              className="text-xs text-primary font-medium"
            >
              Open Kanban <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              {stageChartData.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  No pipeline stages configured.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
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
                              <p className="text-slate-300">
                                Deals: <span className="font-semibold text-white">{data.count}</span>
                              </p>
                              <p className="text-slate-300">
                                Total Value:{" "}
                                <span className="font-semibold text-emerald-400">
                                  {formatCurrency(data.amount, currencyCode)}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {stageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stage Value Breakdown List (4 cols) */}
        <Card className="lg:col-span-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Stage Breakdown
            </CardTitle>
            <CardDescription>Deals and aggregate pipeline values</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-2.5">
            {stageChartData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">No pipeline stages configured.</p>
            ) : (
              stageChartData.map((stage) => (
                <div
                  key={stage.id}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{stage.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium pl-4">
                      {stage.count} {stage.count === 1 ? "Deal" : "Deals"}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(stage.amount, currencyCode)}
                    </div>
                    {stage.win_probability !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-medium">
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

      {/* 5. Sales Forecasting */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-500" />
            Sales Forecasting
          </CardTitle>
          <CardDescription>
            Probability-weighted projected revenue based on opportunity expected close dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Expected This Month
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(forecast.expectedThisMonth, currencyCode)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Scheduled close dates for {format(new Date(), "MMMM yyyy")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/20">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Expected Next Month
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(forecast.expectedNextMonth, currencyCode)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Scheduled close dates for {format(addMonths(new Date(), 1), "MMMM yyyy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Top Active Opportunities Table (Complete with CSV & PDF Export from CRM Reports) */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Top Open Opportunities
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs">
                {openOpportunities.length} Active Deals
              </Badge>
            </div>
            <CardDescription>
              Highest value active opportunities progressing through your sales funnel
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={handleExportOppsCSV}
            >
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={handleExportOppsPDF}
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-primary" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-850">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Opportunity / Deal</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Client / Lead</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Stage</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">Deal Value</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Win Probability</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Close</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Briefcase className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No open opportunities found</p>
                        <p className="text-xs text-muted-foreground">All opportunities are currently won, lost, or pending creation.</p>
                        <Button size="sm" variant="outline" onClick={() => navigate("/pipeline")} className="mt-2 text-xs">
                          Go to Pipeline Kanban
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  openOpportunities.slice(0, 8).map((opp: any) => {
                    const stage = stageLookup.get(opp.stage_id);
                    const contact = getContactInfo(opp);
                    const prob =
                      opp.probability !== undefined && opp.probability !== null
                        ? opp.probability
                        : stage?.win_probability || 0;

                    return (
                      <TableRow key={opp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          <button
                            onClick={() => navigate(`/pipeline`)}
                            className="text-left hover:text-primary hover:underline font-bold text-slate-800 dark:text-slate-200"
                          >
                            {opp.title || "Untitled Deal"}
                          </button>
                        </TableCell>

                        <TableCell className="text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">{contact.name}</span>
                          {contact.company && (
                            <span className="text-[11px] text-muted-foreground">{contact.company}</span>
                          )}
                        </TableCell>

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

                        <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {formatCurrency(Number(opp.amount) || 0, currencyCode)}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{prob}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, prob))}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {opp.expected_close_date ? (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{format(parseISO(opp.expected_close_date), "MMM d, yyyy")}</span>
                            </div>
                          ) : (
                            <span className="italic text-[11px]">Not scheduled</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/pipeline`)}
                            className="h-8 px-2.5 text-xs text-primary"
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

      {/* 7. Action Items Grid (Follow-ups Due, Support Tickets Queue, Recent Leads) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Urgent Follow-ups & Due Activities Queue */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Follow-ups & Due Tasks
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              {metrics.followUpsDue} due
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingActivities.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No pending activities or follow-ups scheduled.
                </div>
              ) : (
                upcomingActivities.map((act: any) => {
                  const dueDateStr = act.due_at || act.due_date;
                  const isOverdue = dueDateStr ? isBefore(parseISO(dueDateStr), startOfDay(new Date())) : false;
                  const isDueToday = dueDateStr ? isToday(parseISO(dueDateStr)) : false;

                  return (
                    <div
                      key={act.id}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isOverdue
                          ? "bg-rose-50/40 border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/40"
                          : isDueToday
                          ? "bg-amber-50/40 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40"
                          : "bg-slate-50/60 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800"
                      }`}
                      onClick={() => navigate("/activities")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden">
                          <div className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                            {act.subject || act.title || "Untitled Activity"}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {act.leads?.name ? `Lead: ${act.leads.name}` : act.activity_type || "Task"}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] shrink-0 ${
                            isOverdue
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                              : isDueToday
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {isOverdue ? "Overdue" : isDueToday ? "Today" : dueDateStr ? format(parseISO(dueDateStr), "MMM d") : "No Date"}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => navigate("/activities")}
            >
              View All Activities <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Support Tickets Queue */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-rose-500" />
              Support Tickets Queue
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
              {metrics.openTickets} open
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No support tickets logged.
                </div>
              ) : (
                recentTickets.map((ticket: any) => {
                  const statusStr = (ticket.status || "open").toLowerCase();
                  const isClosed = ["closed", "resolved"].includes(statusStr);
                  const clientName =
                    ticket.clients?.display_name ||
                    ticket.leads?.name ||
                    "Client";

                  return (
                    <div
                      key={ticket.id}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      onClick={() => navigate("/tickets")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            {ticket.ticket_number && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                {ticket.ticket_number}
                              </span>
                            )}
                            <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                              {ticket.subject}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-1">
                            {clientName} • {format(new Date(ticket.created_at), "MMM d")}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize shrink-0 ${
                            isClosed
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                          }`}
                        >
                          {ticket.status || "open"}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => navigate("/tickets")}
            >
              View Support Desk <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Leads Feed */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Recent Leads
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary h-7 px-2"
              onClick={() => navigate("/leads?add=1")}
            >
              + Add Lead
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No leads registered yet.
                </div>
              ) : (
                recentLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => navigate("/leads")}
                  >
                    <div className="overflow-hidden mr-2">
                      <div className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                        {lead.name || "Unnamed Lead"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {lead.company || lead.email || lead.phone || "No details"}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize shrink-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {lead.status || "new"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => navigate("/leads")}
            >
              View All Leads <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 8. Lead Acquisition Sources & Sales Team Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Grid */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" />
              Lead Generation Sources
            </CardTitle>
            <CardDescription>Breakdown of prospect inquiries across acquisition channels</CardDescription>
          </CardHeader>
          <CardContent>
            {leadSources.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No lead source data available.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {leadSources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-1"
                  >
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{src.name}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{src.count}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {src.percentage.toFixed(0)}% of total
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance Table */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Sales Team Productivity
              </CardTitle>
              <CardDescription>
                Leaderboard by assigned leads, completed tasks, and closed revenue
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => navigate("/crm-team")}
            >
              Manage Team <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="pb-2.5 font-semibold">Member</th>
                    <th className="pb-2.5 font-semibold text-center">Leads</th>
                    <th className="pb-2.5 font-semibold text-center">Tasks Done</th>
                    <th className="pb-2.5 font-semibold text-center">Deals Won</th>
                    <th className="pb-2.5 font-semibold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {teamLeaderboard.map((tm: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {tm.name}
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          {tm.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-slate-700 dark:text-slate-300">
                        {tm.leads}
                      </td>
                      <td className="py-2.5 text-center text-slate-700 dark:text-slate-300">
                        {tm.activities}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {tm.wonDeals}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(tm.revenue, currencyCode)}
                      </td>
                    </tr>
                  ))}
                  {teamLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                        No team member activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

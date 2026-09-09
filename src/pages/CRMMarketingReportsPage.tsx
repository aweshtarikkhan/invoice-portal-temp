import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { Users, DollarSign, Target, Activity, BarChart3, PieChart, Download, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, parseISO } from "date-fns";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CRMMarketingReportsPage() {
  const org = useAppStore((s) => s.organization);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    wonOpportunitiesValue: 0,
    activeCampaigns: 0,
    leadConversionRate: 0,
  });

  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [leadsSourceData, setLeadsSourceData] = useState<any[]>([]);
  const [topOpportunities, setTopOpportunities] = useState<any[]>([]);

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
        { data: opportunities },
        { data: campaigns },
        { data: pipelineStages }
      ] = await Promise.all([
        (supabase as any).from("leads").select("*").eq("org_id", org.id),
        (supabase as any).from("opportunities").select("*").eq("org_id", org.id),
        (supabase as any).from("campaigns").select("*").eq("org_id", org.id),
        (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("order_index", { ascending: true })
      ]);

      // Metrics
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l: any) => l.status === "converted").length || 0;
      const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const wonOpportunities = opportunities?.filter((o: any) => o.status === "won") || [];
      const wonOpportunitiesValue = wonOpportunities.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

      // Active Campaigns
      const activeCampaigns = campaigns?.filter((c: any) => c.status !== "completed" && c.status !== "draft").length || 0;

      setMetrics({
        totalLeads,
        wonOpportunitiesValue,
        activeCampaigns,
        leadConversionRate,
      });

      // Pipeline Data
      const stageMap: Record<string, any> = {};
      pipelineStages?.forEach((s: any) => {
        stageMap[s.id] = { name: s.name, count: 0 };
      });
      
      opportunities?.forEach((o: any) => {
        if (o.stage_id && stageMap[o.stage_id]) {
          stageMap[o.stage_id].count += 1;
        }
      });
      
      setPipelineData(Object.values(stageMap));

      // Leads by Source
      const sourceMap: Record<string, number> = {};
      leads?.forEach((l: any) => {
        const source = l.source || "Unknown";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      });
      const sourceData = Object.entries(sourceMap).map(([name, value]) => ({
        name,
        value,
      }));
      setLeadsSourceData(sourceData);

      // Top 5 Open Opportunities
      const openOpp = opportunities?.filter((o: any) => {
          if (o.status === "won" || o.status === "lost") return false;
          if (!o.expected_close_date) return true;
          return new Date(o.expected_close_date).getTime() >= new Date().setHours(0,0,0,0);
        }) || [];
      const top5 = openOpp
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5);
      setTopOpportunities(top5);

    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotion Reports</h1>
        <p className="text-muted-foreground">Analyze your promotional campaigns, lead conversions, and outreach performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Opportunities</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.wonOpportunitiesValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leadConversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Pipeline Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={leadsSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadsSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top 5 Open Opportunities</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!topOpportunities.length) return;
                const headers = ["Opportunity Name", "Amount", "Probability", "Expected Close Date"];
                const rows = topOpportunities.map(opp => [
                  opp.title || opp.name || '',
                  opp.amount || 0,
                  `${opp.probability || 0}%`,
                  opp.expected_close_date ? format(parseISO(opp.expected_close_date), 'MMM d, yyyy') : '-'
                ]);
                exportTableToCSV(headers, rows, "top_opportunities");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!topOpportunities.length) return;
                const headers = ["Opportunity Name", "Amount", "Probability", "Expected Close Date"];
                const rows = topOpportunities.map(opp => [
                  opp.title || opp.name || '',
                  formatCurrency(opp.amount || 0),
                  `${opp.probability || 0}%`,
                  opp.expected_close_date ? format(parseISO(opp.expected_close_date), 'MMM d, yyyy') : '-'
                ]);
                exportTableToPDF("Top 5 Open Opportunities", headers, rows, "top_opportunities");
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Expected Close Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topOpportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    No open opportunities found.
                  </TableCell>
                </TableRow>
              ) : (
                topOpportunities.map((opp) => (
                  <TableRow key={opp.id}>
                    <TableCell className="font-medium">{opp.title || opp.name}</TableCell>
                    <TableCell>{formatCurrency(opp.amount || 0)}</TableCell>
                    <TableCell>{opp.probability || 0}%</TableCell>
                    <TableCell>
                      {opp.expected_close_date ? format(parseISO(opp.expected_close_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

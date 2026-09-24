import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { exportFullPagePDF } from "@/lib/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Activity, PieChart, Download } from "lucide-react";
import {
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#64748b", "#84cc16"];

export default function PromotionReportsPage() {
  const org = useAppStore((s) => s.organization);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activeCampaigns: 0,
    leadConversionRate: 0,
  });

  const [leadsSourceData, setLeadsSourceData] = useState<any[]>([]);

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
        { data: campaigns },
      ] = await Promise.all([
        (supabase as any).from("leads").select("*").eq("org_id", org.id),
        (supabase as any).from("campaigns").select("*").eq("org_id", org.id),
      ]);

      // Metrics
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l: any) => l.status === "converted").length || 0;
      const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Active Campaigns
      const activeCampaigns = campaigns?.filter((c: any) => c.status !== "completed" && c.status !== "draft").length || 0;

      setMetrics({
        totalLeads,
        activeCampaigns,
        leadConversionRate,
      });

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
    <div className="space-y-6" id="promotion-report-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotion Reports</h1>
          <p className="text-muted-foreground">Analyze your promotional campaigns, lead conversions, and outreach performance.</p>
        </div>
        <Button onClick={() => exportFullPagePDF('promotion-report-page', 'promotion_full_report')} className="shrink-0" variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report (PDF)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Leads by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={leadsSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
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
  );
}

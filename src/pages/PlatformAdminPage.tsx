import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, Building2, BarChart3, Settings2, TrendingUp,
  Users2, CreditCard, Mail, Phone, FileText, UserCircle,
  Calendar, Globe, ChevronDown, ChevronUp, Hash, MessageSquare,
  CheckCircle2, IndianRupee
} from "lucide-react";
import { ADMIN_FEATURE_GROUPS } from "@/store/feature-store";
import { PlansManager } from "@/components/admin/PlansManager";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { PlatformSettingsManager } from "@/components/admin/PlatformSettingsManager";
import { LandingPageReviewsManager } from "@/components/admin/LandingPageReviewsManager";



interface UserData {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  org_id: string | null;
  org_name: string | null;
  role: string | null;
  created_at: string;
  last_sign_in: string | null;
}

interface OrgData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  currency_code: string;
  gst_enabled: boolean;
  gst_number: string | null;
  created_at: string;
  member_count: number;
  invoice_count: number;
  owner: { email: string; name: string } | null;
  subscription: {
    plan_name: string;
    enabled_features: string[];
  } | null;
}

interface DashboardData {
  users_count: number;
  orgs_count: number;
  admins: { id: string; email: string }[];
  users: UserData[];
  organizations: OrgData[];
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-700 text-slate-200",
  basic: "bg-blue-900/60 text-blue-300",
  pro: "bg-purple-900/60 text-purple-300",
  premium: "bg-pink-900/60 text-pink-300",
  bundle: "bg-amber-900/60 text-amber-300",
  hrms: "bg-emerald-900/60 text-emerald-300",
  crm: "bg-cyan-900/60 text-cyan-300",
  marketing: "bg-rose-900/60 text-rose-300",
  plan_outreach: "bg-teal-900/60 text-teal-300",
};

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  plan_2: "Sales & Inventory",
  plan_3: "Business Suite",
  plan_4: "HRMS",
  plan_5: "CRM",
  plan_6: "Marketing",
  plan_outreach: "Customer Outreach"
};

export default function PlatformAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [featureRequests, setFeatureRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const fetchDashboardData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    
    // Fetch dashboard data
    const { data, error: rpcError } = await supabase.rpc("get_platform_dashboard_data");
    
    // Fetch feature requests
    const { data: reqData, error: reqError } = await supabase.rpc("get_all_feature_requests");

    if (rpcError) {
      console.error("Error fetching dashboard data:", rpcError);
      setError(rpcError.message);
      setLoading(false);
      return;
    }
    
    setDashData(data as unknown as DashboardData);
    if (reqData) setFeatureRequests(reqData);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleFeature = async (orgId: string, featureKey: string, isEnabled: boolean) => {
    const org = dashData?.organizations.find(o => o.id === orgId);
    if (!org) return;

    const sub = org.subscription || { plan_name: "free", plan_display_name: "Free", enabled_features: ADMIN_FEATURE_GROUPS.map(g => g.key) };
    const currentFeatures = Array.isArray(sub.enabled_features) ? sub.enabled_features : ADMIN_FEATURE_GROUPS.map(g => g.key);
    
    const newFeatures = isEnabled 
      ? [...currentFeatures, featureKey]
      : currentFeatures.filter(f => f !== featureKey);

    await supabase.rpc("admin_set_features", {
      p_org_id: orgId,
      p_features: newFeatures
    });
    
    fetchDashboardData(false);
  };

  const handleEnableAll = async (orgId: string) => {
    const allFeatures = ADMIN_FEATURE_GROUPS.map(g => g.key);
    await supabase.rpc("admin_set_features", {
      p_org_id: orgId,
      p_features: allFeatures
    });
    fetchDashboardData(false);
  };

  const handleDisableAll = async (orgId: string) => {
    await supabase.rpc("admin_set_features", {
      p_org_id: orgId,
      p_features: []
    });
    fetchDashboardData(false);
  };

  const handlePlansChange = async (orgId: string, currentPlans: string[], toggledPlan: string) => {
    let newPlans = currentPlans.includes(toggledPlan) 
      ? currentPlans.filter(p => p !== toggledPlan)
      : [...currentPlans, toggledPlan];
      
    if (newPlans.length === 0) newPlans = ['free'];

    await supabase.rpc("admin_set_plans", {
      p_org_id: orgId,
      p_plan_names: newPlans,
    });
    fetchDashboardData(false);
  };
  
  const availablePlans = [
    { id: "free", label: "🆓 Free" },
    { id: "plan_2", label: "📄 Sales & Inventory" },
    { id: "plan_3", label: "🏢 Business Suite" },
    { id: "plan_4", label: "👥 HRMS" },
    { id: "plan_5", label: "🤝 CRM" },
    { id: "plan_6", label: "📈 Marketing" }
  ,
      { id: "plan_outreach", label: "💬 Customer Outreach" }];

  const handleUpdateFeatureRequest = async (reqId: string, status: string) => {
    await supabase.from("feature_requests").update({ status }).eq("id", reqId);
    fetchDashboardData(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !dashData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-white">
        <p className="text-rose-400 text-lg font-medium mb-2">Failed to load dashboard</p>
        <p className="text-slate-400 text-sm mb-4 max-w-md text-center">{error || "Unknown error"}</p>
        <Button onClick={fetchDashboardData} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          Retry
        </Button>
      </div>
    );
  }

  const proOrgs = dashData.organizations.filter(o => o.subscription?.plan_name === "Pro").length;
  const basicOrgs = dashData.organizations.filter(o => o.subscription?.plan_name === "Basic").length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Platform Admin</h2>
        <p className="text-slate-400 mt-1">Manage businesses, users, plans & feature access.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="orgs" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Building2 className="w-4 h-4 mr-2" /> Businesses
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Users2 className="w-4 h-4 mr-2" /> All Users
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" /> Admins
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <IndianRupee className="w-4 h-4 mr-2" /> Plans & Pricing
          </TabsTrigger>

          <TabsTrigger value="reviews" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" /> Reviews
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" /> Requests
            {featureRequests.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                {featureRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users2 className="w-5 h-5" />} label="Total Users" value={dashData.users_count} color="text-indigo-400" sub="Registered accounts" />
            <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Businesses" value={dashData.orgs_count} color="text-emerald-400" sub="Active organizations" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Est. Revenue" value={`₹${proOrgs * 2999 + basicOrgs * 999}`} color="text-purple-400" sub={`${proOrgs} Pro + ${basicOrgs} Basic`} />
            <StatCard icon={<FileText className="w-5 h-5" />} label="Total Invoices" value={dashData.organizations.reduce((a, o) => a + (o.invoice_count || 0), 0)} color="text-amber-400" sub="Across all businesses" />
          </div>

          {/* Plan Distribution */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-indigo-400" /> Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {["free", "plan_2", "plan_3", "plan_4", "plan_5", "plan_6"].map(plan => {
                  const count = dashData.organizations.filter(o =>
                    (o.subscription?.plan_name || "free") === plan
                  ).length;
                  return (
                    <div key={plan} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center flex flex-col justify-center items-center">
                      <p className="text-3xl font-bold text-white">{count}</p>
                      <Badge className={(PLAN_COLORS[plan] || PLAN_COLORS.free) + " mt-2 whitespace-nowrap"}>{PLAN_DISPLAY_NAMES[plan] || plan}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Businesses */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Recent Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashData.organizations.slice(0, 5).map(org => (
                  <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {org.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-white">{org.name}</p>
                        <p className="text-xs text-slate-400">{org.owner?.email || "No owner"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={PLAN_COLORS[org.subscription?.plan_name || "free"] || PLAN_COLORS.free}>
                        {org.subscription?.plan_display_name || PLAN_DISPLAY_NAMES[org.subscription?.plan_name || "free"] || "Free"}
                      </Badge>
                      <span className="text-xs text-slate-500">{org.member_count} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Businesses Tab ── */}
        <TabsContent value="orgs" className="space-y-6">
          {dashData.organizations.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 text-white p-8 text-center">
              <p className="text-slate-400">No organizations registered yet.</p>
            </Card>
          ) : (
            dashData.organizations.map(org => {
              const sub = org.subscription || { plan_name: "free", plan_display_name: "Free", enabled_features: ADMIN_FEATURE_GROUPS.map(g => g.key) };
              const currentFeatures = Array.isArray(sub.enabled_features) ? sub.enabled_features : ADMIN_FEATURE_GROUPS.map(g => g.key);
              const isExpanded = expandedOrg === org.id;

              return (
                <Card key={org.id} className="bg-slate-900 border-slate-800 text-white overflow-hidden">
                  {/* Business Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {org.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-xl text-white">{org.name}</CardTitle>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                            {org.owner && (
                              <span className="flex items-center gap-1">
                                <UserCircle className="w-3 h-3" /> {org.owner.name?.trim() || org.owner.email}
                              </span>
                            )}
                            {org.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {org.email}
                              </span>
                            )}
                            {org.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {org.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(org.created_at).toLocaleDateString("en-IN")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {org.currency_code}
                            </span>
                            {org.gst_number && (
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" /> GST: {org.gst_number}
                              </span>
                            )}
                          </div>
                          {/* Stats row */}
                          <div className="flex gap-4 mt-3">
                            <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700/50 text-center">
                              <p className="text-lg font-bold text-indigo-400">{org.member_count}</p>
                              <p className="text-[10px] text-slate-500">Users</p>
                            </div>
                            <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700/50 text-center">
                              <p className="text-lg font-bold text-emerald-400">{org.invoice_count}</p>
                              <p className="text-[10px] text-slate-500">Invoices</p>
                            </div>
                            <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700/50 text-center">
                              <p className="text-lg font-bold text-purple-400">
                                {currentFeatures.length}/{ADMIN_FEATURE_GROUPS.length}
                              </p>
                              <p className="text-[10px] text-slate-500">Features</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plan selector */}
                      <div className="flex flex-col items-end gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[180px] justify-between bg-slate-800 border-slate-700 text-slate-200">
                              <span className="truncate">{(org as any).subscription_plan_names && (org as any).subscription_plan_names.length > 0
                                ? (org as any).subscription_plan_names.map((p: string) => PLAN_DISPLAY_NAMES[p] || p).join(", ")
                                : sub.plan_display_name || PLAN_DISPLAY_NAMES[sub.plan_name] || "Free"}</span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-3 bg-slate-800 border-slate-700 shadow-xl rounded-xl z-[9999]" align="end">
                            <div className="space-y-3">
                              {availablePlans.map(plan => {
                                const currentPlans = (org as any).subscription_plan_names || (sub.plan_name ? [sub.plan_name] : ['free']);
                                const isChecked = currentPlans.includes(plan.id);
                                return (
                                  <div key={plan.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`plan-${org.id}-${plan.id}`} 
                                      checked={isChecked}
                                      onCheckedChange={() => handlePlansChange(org.id, currentPlans, plan.id)}
                                      className="border-slate-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                    />
                                    <label 
                                      htmlFor={`plan-${org.id}-${plan.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200 cursor-pointer"
                                    >
                                      {plan.label}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                          {((org as any).subscription_plan_names || [sub.plan_name]).map((p: string) => (
                             <Badge key={p} className={PLAN_COLORS[p] || PLAN_COLORS.free}>
                               {PLAN_DISPLAY_NAMES[p] || p}
                             </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Feature Toggles — collapsible */}
                  <div className="border-t border-slate-800">
                    <button
                      onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                      className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Feature Access Control ({currentFeatures.length} of {ADMIN_FEATURE_GROUPS.length} enabled)
                        {sub.employee_limit && (
                          <span className="ml-4 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Employee Limit: {sub.employee_limit}
                          </span>
                        )}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6">
                        {/* Quick actions */}
                        <div className="flex gap-2 mb-4">
                          <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => handleEnableAll(org.id)}>
                            Enable All
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => handleDisableAll(org.id)}>
                            Disable All
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ADMIN_FEATURE_GROUPS.map(group => {
                            const isEnabled = currentFeatures.includes(group.key);
                            return (
                              <div
                                key={group.key}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isEnabled
                                    ? "bg-indigo-950/30 border-indigo-500/30"
                                    : "bg-slate-800/30 border-slate-700/30 opacity-60"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-200">{group.label}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{group.description}</p>
                                </div>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => handleToggleFeature(org.id, group.key, checked)}
                                  className="data-[state=checked]:bg-indigo-500 shrink-0 ml-2"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── All Users Tab ── */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg">All Registered Users ({dashData.users.length})</CardTitle>
              <CardDescription className="text-slate-400">Every user who has signed up on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-slate-400">
                      <th className="pb-3 pr-4 font-medium">User</th>
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Business</th>
                      <th className="pb-3 pr-4 font-medium">Role</th>
                      <th className="pb-3 pr-4 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashData.users.map(user => (
                      <tr key={user.user_id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                            </div>
                            <span className="text-white font-medium">
                              {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{user.email}</td>
                        <td className="py-3 pr-4">
                          {user.org_name ? (
                            <Badge variant="outline" className="border-slate-600 text-slate-300">{user.org_name}</Badge>
                          ) : (
                            <span className="text-slate-500">No business</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={
                            user.role === "owner" ? "bg-amber-900/50 text-amber-300" :
                            user.role === "admin" ? "bg-purple-900/50 text-purple-300" :
                            "bg-slate-700 text-slate-300"
                          }>
                            {user.role || "—"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-slate-400 text-xs">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="py-3 text-slate-400 text-xs">
                          {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                          }) : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Admins Tab ── */}
        <TabsContent value="admins" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle>Platform Admins</CardTitle>
              <CardDescription className="text-slate-400">Users with full access to this dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashData.admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {admin.email?.[0]?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="font-medium text-white">{admin.email}</p>
                        <p className="text-xs text-slate-500">ID: {admin.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <Badge className="bg-indigo-900/50 text-indigo-300">Super Admin</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── Requests ── */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-xl">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Feature Access Requests
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage requests from users asking for access to disabled features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featureRequests.length === 0 ? (
                <div className="text-center p-8 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>No feature requests at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featureRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-0 hover:bg-indigo-500/30">
                            {req.feature_name}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(req.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-white font-medium">{req.organizations?.name || 'Unknown Business'}</h4>
                        <p className="text-sm text-slate-400">{req.user_email || 'Unknown User'}</p>
                        {req.message && (
                          <div className="mt-3 p-3 bg-slate-900 rounded-lg text-sm text-slate-300 border border-slate-700/50">
                            "{req.message}"
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                          size="sm" 
                          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => {
                            // Automatically switch to orgs tab and expand this org to enable the feature
                            setExpandedOrg(req.org_id);
                            const orgsTab = document.querySelector('[value="orgs"]') as HTMLButtonElement;
                            if (orgsTab) orgsTab.click();
                          }}
                        >
                          Review & Enable
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── Plans & Pricing Tab ── */}
        <TabsContent value="pricing" className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Plans & Pricing</h3>
            <p className="text-slate-400 text-sm mb-6">Manage subscription prices, global settings, and promo codes.</p>
            <PlansManager />
          </div>
          <hr className="border-slate-800 my-8" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <PlatformSettingsManager />
            <CouponsManager />
          </div>
        </TabsContent>



        {/* --- Reviews Tab --- */}
        <TabsContent value="reviews" className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Customer Reviews</h3>
            <p className="text-slate-400 mb-6 text-sm">Manage the testimonials displayed on the landing page.</p>
            <LandingPageReviewsManager />
          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}

/* Reusable stat card */
function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  sub: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

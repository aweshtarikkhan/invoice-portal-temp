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
  CheckCircle2, IndianRupee, Image as ImageIcon, Trash2, Share2,
  Search, Filter, Check, Copy, Sparkles, PlusCircle, ArrowUpDown,
  SlidersHorizontal, UserCheck, RefreshCw, AlertCircle, ExternalLink,
  Layers, Lock, Unlock, HelpCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_FEATURE_GROUPS } from "@/store/feature-store";
import { PlansManager } from "@/components/admin/PlansManager";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { PlatformSettingsManager } from "@/components/admin/PlatformSettingsManager";
import { LandingPageReviewsManager } from "@/components/admin/LandingPageReviewsManager";
import { PlatformSocialsManager } from "@/components/admin/PlatformSocialsManager";



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
  plan_5: "Business CRM",
  plan_6: "Business Promotion",
  plan_outreach: "Business Integration"
};

export default function PlatformAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // User Management & Plan Override States
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserData | null>(null);
  const [isManageUserModalOpen, setIsManageUserModalOpen] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [selectedOrgForLink, setSelectedOrgForLink] = useState<string>("");
  const [newOrgNameForUser, setNewOrgNameForUser] = useState<string>("");
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [featureRequests, setFeatureRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  
  const [adsList, setAdsList] = useState<any[]>([]);
  const [adTitle, setAdTitle] = useState("");
  const [adLink, setAdLink] = useState("");
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adSlidesCount, setAdSlidesCount] = useState<number>(3);
  const [adLoading, setAdLoading] = useState(false);

  const fetchAdsData = async () => {
    // fetch settings
    const { data: settingsData } = await supabase.from('platform_settings').select('value').eq('key', 'portal_ad_slides').maybeSingle();
    if (settingsData && settingsData.value) {
      setAdSlidesCount(parseInt(settingsData.value));
    }

    // fetch ads
    const { data: adsData } = await supabase.from('portal_ads').select('*').order('sort_order', { ascending: true });
    if (adsData) {
      setAdsList(adsData.filter(a => a.title !== '__platform_socials__'));
    }
  };

  const handleUploadAd = async () => {
    if (!adFile) return;
    setAdLoading(true);
    try {
      const fileName = `${Date.now()}_${adFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('portal-ads').upload(`ads/${fileName}`, adFile);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('portal-ads').getPublicUrl(`ads/${fileName}`);
      
      const { error: insertError } = await supabase.from('portal_ads').insert({
        image_url: publicUrl,
        title: adTitle,
        link_url: adLink,
        is_active: true,
        sort_order: adsList.length
      });
      if (insertError) throw insertError;
      
      setAdTitle("");
      setAdLink("");
      setAdFile(null);
      await fetchAdsData();
    } catch (e: any) {
      console.error(e);
      alert("Failed to upload ad: " + e.message);
    } finally {
      setAdLoading(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    await supabase.from('portal_ads').delete().eq('id', id);
    fetchAdsData();
  };

  const handleToggleAdActive = async (id: string, is_active: boolean) => {
    await supabase.from('portal_ads').update({ is_active }).eq('id', id);
    fetchAdsData();
  };

  const handleUpdateSlidesCount = async (count: number) => {
    setAdSlidesCount(count);
    const { error } = await supabase.from('platform_settings').upsert({ key: 'portal_ad_slides', value: count.toString() }, { onConflict: 'key' });
    if (error) console.error(error);
  };

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
    fetchAdsData();
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

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUserId(id);
    toast({ title: "Copied to clipboard!", description: text });
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const getUserPlans = (user: UserData): string[] => {
    if (!user.org_id) return [];
    const org = dashData?.organizations.find(o => o.id === user.org_id);
    if (!org) return [];
    return (org as any).subscription_plan_names || (org.subscription?.plan_name ? [org.subscription.plan_name] : ['free']);
  };

  const getUserOrg = (user: UserData): OrgData | undefined => {
    if (!user.org_id) return undefined;
    return dashData?.organizations.find(o => o.id === user.org_id);
  };

  const handleUserPlanToggle = async (user: UserData, toggledPlan: string) => {
    const currentPlans = getUserPlans(user);
    let newPlans = currentPlans.includes(toggledPlan)
      ? currentPlans.filter(p => p !== toggledPlan)
      : [...currentPlans, toggledPlan];
    if (newPlans.length === 0) newPlans = ['free'];

    // Instant optimistic update for immediate tick mark [✓] feedback
    const defaultOrgName = user.org_name || `${[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email.split("@")[0]}'s Business`;
    const targetOrgId = user.org_id || `temp-org-${user.user_id}`;

    setDashData(prev => {
      if (!prev) return prev;
      const updatedUsers = prev.users.map(u => {
        if (u.user_id === user.user_id) {
          return {
            ...u,
            org_id: u.org_id || targetOrgId,
            org_name: u.org_name || defaultOrgName,
            role: u.role || 'owner'
          };
        }
        return u;
      });

      let found = false;
      const updatedOrgs = prev.organizations.map(o => {
        if (o.id === targetOrgId || (user.org_id && o.id === user.org_id)) {
          found = true;
          return {
            ...o,
            subscription_plan_names: newPlans,
            subscription: {
              ...o.subscription,
              plan_name: newPlans[0],
              plan_display_name: PLAN_DISPLAY_NAMES[newPlans[0]] || newPlans[0],
              enabled_features: o.subscription?.enabled_features || []
            }
          };
        }
        return o;
      });

      if (!found) {
        updatedOrgs.push({
          id: targetOrgId,
          name: defaultOrgName,
          email: user.email,
          phone: null,
          currency_code: 'INR',
          gst_enabled: true,
          gst_number: null,
          created_at: new Date().toISOString(),
          member_count: 1,
          invoice_count: 0,
          owner: { email: user.email, name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email },
          subscription: {
            plan_name: newPlans[0],
            plan_display_name: PLAN_DISPLAY_NAMES[newPlans[0]] || newPlans[0],
            enabled_features: []
          },
          subscription_plan_names: newPlans
        } as any);
      }

      return {
        ...prev,
        users: updatedUsers,
        organizations: updatedOrgs
      };
    });

    if (selectedUserForModal && selectedUserForModal.user_id === user.user_id) {
      setSelectedUserForModal(prev => prev ? {
        ...prev,
        org_id: prev.org_id || targetOrgId,
        org_name: prev.org_name || defaultOrgName,
        role: prev.role || 'owner'
      } : null);
    }

    setIsChangingPlan(true);
    const { data: res, error } = await supabase.rpc("admin_assign_user_plans", {
      p_user_id: user.user_id,
      p_plan_names: newPlans
    });
    setIsChangingPlan(false);

    if (error) {
      toast({ title: "Failed to update plan", description: error.message, variant: "destructive" });
      await fetchDashboardData(false);
    } else {
      toast({
        title: "Plan Updated",
        description: `Updated plan for ${user.email} to: ${newPlans.map(p => PLAN_DISPLAY_NAMES[p] || p).join(", ")}`,
      });
      await fetchDashboardData(false);
    }
  };

  const handleSetUserDirectPlan = async (user: UserData, planName: string) => {
    let planArray = [planName];
    if (planName === "plan_3") {
      planArray = ["plan_3", "plan_5", "plan_6"];
    }

    const defaultOrgName = user.org_name || `${[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email.split("@")[0]}'s Business`;
    const targetOrgId = user.org_id || `temp-org-${user.user_id}`;

    setDashData(prev => {
      if (!prev) return prev;
      const updatedUsers = prev.users.map(u => {
        if (u.user_id === user.user_id) {
          return {
            ...u,
            org_id: u.org_id || targetOrgId,
            org_name: u.org_name || defaultOrgName,
            role: u.role || 'owner'
          };
        }
        return u;
      });

      let found = false;
      const updatedOrgs = prev.organizations.map(o => {
        if (o.id === targetOrgId || (user.org_id && o.id === user.org_id)) {
          found = true;
          return {
            ...o,
            subscription_plan_names: planArray,
            subscription: {
              ...o.subscription,
              plan_name: planArray[0],
              plan_display_name: PLAN_DISPLAY_NAMES[planArray[0]] || planArray[0],
              enabled_features: o.subscription?.enabled_features || []
            }
          };
        }
        return o;
      });

      if (!found) {
        updatedOrgs.push({
          id: targetOrgId,
          name: defaultOrgName,
          email: user.email,
          phone: null,
          currency_code: 'INR',
          gst_enabled: true,
          gst_number: null,
          created_at: new Date().toISOString(),
          member_count: 1,
          invoice_count: 0,
          owner: { email: user.email, name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email },
          subscription: {
            plan_name: planArray[0],
            plan_display_name: PLAN_DISPLAY_NAMES[planArray[0]] || planArray[0],
            enabled_features: []
          },
          subscription_plan_names: planArray
        } as any);
      }

      return {
        ...prev,
        users: updatedUsers,
        organizations: updatedOrgs
      };
    });

    if (selectedUserForModal && selectedUserForModal.user_id === user.user_id) {
      setSelectedUserForModal(prev => prev ? {
        ...prev,
        org_id: prev.org_id || targetOrgId,
        org_name: prev.org_name || defaultOrgName,
        role: prev.role || 'owner'
      } : null);
    }

    setIsChangingPlan(true);
    const { data: res, error } = await supabase.rpc("admin_assign_user_plans", {
      p_user_id: user.user_id,
      p_plan_names: planArray
    });
    setIsChangingPlan(false);

    if (error) {
      toast({ title: "Failed to update plan", description: error.message, variant: "destructive" });
      await fetchDashboardData(false);
    } else {
      toast({
        title: "Plan Changed",
        description: `${user.email} is now assigned ${PLAN_DISPLAY_NAMES[planName] || planName}.`,
      });
      await fetchDashboardData(false);
    }
  };

  const handleCreateAndAssignOrgForUser = async (user: UserData, initialPlans: string[] = ['free'], customName?: string) => {
    setIsChangingPlan(true);
    const { data: res, error } = await supabase.rpc("admin_assign_user_plans", {
      p_user_id: user.user_id,
      p_plan_names: initialPlans,
      p_org_name: customName || null
    });
    setIsChangingPlan(false);

    if (error) {
      toast({ title: "Failed to create business", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Business Assigned",
        description: `Assigned plans for ${user.email}: ${initialPlans.map(p => PLAN_DISPLAY_NAMES[p] || p).join(", ")}.`,
      });
      await fetchDashboardData(false);
    }
  };

  const handleAssignExistingOrgToUser = async (user: UserData, targetOrgId: string, role: string = "member") => {
    if (!targetOrgId) return;
    setIsChangingPlan(true);
    const { error } = await supabase.rpc("admin_link_user_org", {
      p_user_id: user.user_id,
      p_org_id: targetOrgId,
      p_role: role
    });
    setIsChangingPlan(false);

    if (error) {
      toast({ title: "Failed to link business", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Business Linked", description: `Linked ${user.email} to selected business.` });
      await fetchDashboardData(false);
    }
  };

  const handleUserRoleChange = async (user: UserData, newRole: string) => {
    if (!user.org_id) return;
    setIsChangingPlan(true);
    const { error } = await supabase.rpc("admin_set_user_role", {
      p_user_id: user.user_id,
      p_org_id: user.org_id,
      p_role: newRole
    });
    setIsChangingPlan(false);

    if (error) {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role Updated", description: `${user.email} is now ${newRole}.` });
      await fetchDashboardData(false);
    }
  };

  const handlePlansChange = async (orgId: string, currentPlans: string[], toggledPlan: string) => {
    let newPlans = currentPlans.includes(toggledPlan) 
      ? currentPlans.filter(p => p !== toggledPlan)
      : [...currentPlans, toggledPlan];
      
    if (newPlans.length === 0) newPlans = ['free'];

    setDashData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        organizations: prev.organizations.map(o => {
          if (o.id === orgId) {
            return {
              ...o,
              subscription_plan_names: newPlans,
              subscription: {
                ...o.subscription,
                plan_name: newPlans[0],
                plan_display_name: PLAN_DISPLAY_NAMES[newPlans[0]] || newPlans[0],
                enabled_features: o.subscription?.enabled_features || []
              }
            };
          }
          return o;
        })
      };
    });

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
    { id: "plan_5", label: "🤝 Business CRM" },
    { id: "plan_6", label: "📈 Business Promotion" },
    { id: "plan_outreach", label: "💬 Business Integration" }
  ];

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
          <TabsTrigger value="ads" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" /> Ads
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Share2 className="w-4 h-4 mr-2" /> Social Media
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

        {/* ── All Users Tab (Full User & Subscription Plan Management) ── */}
        <TabsContent value="users" className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Total Registered</span>
                <p className="text-xl font-black text-white mt-0.5">{dashData.users.length}</p>
              </div>
              <Users2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Business Suite (Plan 3)</span>
                <p className="text-xl font-black text-indigo-400 mt-0.5">
                  {dashData.users.filter(u => getUserPlans(u).includes("plan_3")).length}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Sales & Inventory</span>
                <p className="text-xl font-black text-blue-400 mt-0.5">
                  {dashData.users.filter(u => getUserPlans(u).includes("plan_2")).length}
                </p>
              </div>
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">No Business Assigned</span>
                <p className="text-xl font-black text-amber-400 mt-0.5">
                  {dashData.users.filter(u => !u.org_id).length}
                </p>
              </div>
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-indigo-400" />
                    All Registered Users & Plan Management
                  </CardTitle>
                  <CardDescription className="text-slate-400 mt-0.5">
                    Search, inspect, and modify subscription plans directly for any registered user on the platform.
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDashboardData(true)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                  </Button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by user name, email, business name, or user ID..."
                    className="bg-slate-950 border-slate-800 pl-9 text-xs text-white placeholder:text-slate-500"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter by Plan */}
                <div className="w-full md:w-56">
                  <Select value={userPlanFilter} onValueChange={setUserPlanFilter}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white">
                      <SelectValue placeholder="Filter by Plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white z-[9999]">
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free Plan</SelectItem>
                      <SelectItem value="plan_2">Plan 2: Sales & Stock</SelectItem>
                      <SelectItem value="plan_3">Plan 3: Business Suite</SelectItem>
                      <SelectItem value="plan_4">Plan 4: Business HR</SelectItem>
                      <SelectItem value="plan_5">Plan 5: Business CRM</SelectItem>
                      <SelectItem value="plan_6">Plan 6: Business Promotion</SelectItem>
                      <SelectItem value="no_business">No Business Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter by Role */}
                <div className="w-full md:w-44">
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white">
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white z-[9999]">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Staff / Member</SelectItem>
                      <SelectItem value="no_role">No Business / Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Filters */}
                {(userSearchQuery || userPlanFilter !== "all" || userRoleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserSearchQuery("");
                      setUserPlanFilter("all");
                      setUserRoleFilter("all");
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {(() => {
                const filteredUsers = (dashData?.users || []).filter(user => {
                  const searchLower = userSearchQuery.toLowerCase().trim();
                  const matchesSearch = !searchLower || 
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.first_name?.toLowerCase().includes(searchLower) ||
                    user.last_name?.toLowerCase().includes(searchLower) ||
                    user.org_name?.toLowerCase().includes(searchLower) ||
                    user.user_id?.toLowerCase().includes(searchLower);

                  if (!matchesSearch) return false;

                  if (userRoleFilter !== "all") {
                    if (userRoleFilter === "no_role" && user.role) return false;
                    if (userRoleFilter !== "no_role" && user.role !== userRoleFilter) return false;
                  }

                  if (userPlanFilter !== "all") {
                    if (userPlanFilter === "no_business") {
                      return !user.org_id;
                    }
                    const plans = getUserPlans(user);
                    return plans.includes(userPlanFilter);
                  }

                  return true;
                });

                if (filteredUsers.length === 0) {
                  return (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                      <Users2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No matching users found</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-left text-slate-400 text-xs">
                          <th className="pb-3 pr-4 font-semibold">User Profile</th>
                          <th className="pb-3 pr-4 font-semibold">Email & ID</th>
                          <th className="pb-3 pr-4 font-semibold">Business</th>
                          <th className="pb-3 pr-4 font-semibold">Role</th>
                          <th className="pb-3 pr-4 font-semibold">Active Plan(s)</th>
                          <th className="pb-3 pr-4 font-semibold">Registration</th>
                          <th className="pb-3 text-right font-semibold">Manage / Change Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredUsers.map(user => {
                          const userPlans = getUserPlans(user);
                          const userOrg = getUserOrg(user);

                          return (
                            <tr key={user.user_id} className="hover:bg-slate-800/30 transition-colors">
                              {/* User Profile */}
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                                    {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-white font-semibold block leading-tight">
                                      {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed User"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ID: {user.user_id.slice(0, 8)}...
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Email & Copy */}
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-300 text-xs">{user.email}</span>
                                  <button
                                    onClick={() => copyText(user.email, user.user_id)}
                                    title="Copy Email"
                                    className="text-slate-500 hover:text-indigo-400"
                                  >
                                    {copiedUserId === user.user_id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Business */}
                              <td className="py-3.5 pr-4">
                                {user.org_name ? (
                                  <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-200 text-[11px] font-medium max-w-[170px] truncate block">
                                    {user.org_name}
                                  </Badge>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full font-semibold">
                                    <AlertCircle className="w-3 h-3 text-amber-400" /> No Business
                                  </span>
                                )}
                              </td>

                              {/* Role */}
                              <td className="py-3.5 pr-4">
                                <Badge className={
                                  user.role === "owner" ? "bg-amber-900/50 text-amber-300 border border-amber-700/50 text-[10px]" :
                                  user.role === "admin" ? "bg-purple-900/50 text-purple-300 border border-purple-700/50 text-[10px]" :
                                  user.role === "member" ? "bg-slate-800 text-slate-300 border border-slate-700 text-[10px]" :
                                  "bg-slate-800 text-slate-500 text-[10px]"
                                }>
                                  {user.role ? user.role.toUpperCase() : "NO ROLE"}
                                </Badge>
                              </td>

                              {/* Active Plans */}
                              <td className="py-3.5 pr-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {userPlans.length > 0 ? (
                                    userPlans.map(plan => (
                                      <Badge
                                        key={plan}
                                        className={`${PLAN_COLORS[plan] || PLAN_COLORS.free} text-[10px] font-bold border px-1.5 py-0.5 shadow-sm`}
                                      >
                                        {PLAN_DISPLAY_NAMES[plan] || plan}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-slate-500 text-xs italic">No Plan</span>
                                  )}
                                </div>
                              </td>

                              {/* Registration & Last Login */}
                              <td className="py-3.5 pr-4 text-xs text-slate-400">
                                <span className="block font-medium text-slate-300">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Login: {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Never"}
                                </span>
                              </td>

                              {/* Actions: Change Plan & Manage */}
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  
                                  {/* Change Plan Popover */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 px-2.5 shadow-sm shadow-indigo-600/30"
                                      >
                                        Change Plan <ChevronDown className="w-3.5 h-3.5 ml-1" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-4 bg-slate-900 border-slate-700 text-white shadow-2xl rounded-xl z-[9999]" align="end">
                                      <div>
                                        <div className="border-b border-slate-800 pb-2.5 mb-3">
                                          <h4 className="text-xs font-bold text-white leading-snug">Change Plan for User</h4>
                                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                                          {user.org_name && (
                                            <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">Org: {user.org_name}</p>
                                          )}
                                        </div>

                                        {/* Fast 1-Click Presets */}
                                        <div className="space-y-1.5 mb-3">
                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                            Quick Switch:
                                          </span>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleSetUserDirectPlan(user, "free")}
                                              className="border-slate-700 hover:bg-slate-800 text-slate-300 text-[10px] h-7 px-1.5"
                                            >
                                              🆓 Set Free
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleSetUserDirectPlan(user, "plan_2")}
                                              className="border-blue-700/60 bg-blue-950/30 hover:bg-blue-900/50 text-blue-300 text-[10px] h-7 px-1.5 font-bold"
                                            >
                                              📄 Sales & Stock
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSetUserDirectPlan(user, "plan_3")}
                                              className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] h-7 font-black shadow-sm"
                                            >
                                              ✨ Flagship: Business Suite
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Individual Multi-Plan Toggles */}
                                        <div className="border-t border-slate-800 pt-2.5">
                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                            Modular Plans & Add-ons:
                                          </span>
                                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {availablePlans.map(p => {
                                              const isChecked = userPlans.includes(p.id);
                                              return (
                                                <div key={p.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60">
                                                  <label
                                                    htmlFor={`user-plan-${user.user_id}-${p.id}`}
                                                    className="text-xs text-slate-200 font-medium cursor-pointer flex-1 pr-2"
                                                  >
                                                    {p.label}
                                                  </label>
                                                  <Checkbox
                                                    id={`user-plan-${user.user_id}-${p.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={() => handleUserPlanToggle(user, p.id)}
                                                    className="border-slate-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* If No Business: Helper Prompt */}
                                        {!user.org_id && (
                                          <div className="mt-3 p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-[10px] text-amber-300">
                                            Toggling a plan will automatically create a business for this user.
                                          </div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>

                                  {/* Manage User Modal Opener */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUserForModal(user);
                                      setIsManageUserModalOpen(true);
                                    }}
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-8 px-2.5"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-slate-400" /> Manage
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
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

        {/* --- Ads Manager Tab --- */}
        <TabsContent value="ads" className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Portal Ad Manager</h3>
            <p className="text-slate-400 mb-6 text-sm">Manage promotional banners displayed on employee attendance portal.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Slides Settings</CardTitle>
                  <CardDescription className="text-slate-400">Configure how many ads are shown at once</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slidesCount" className="text-slate-300">Slides Visible at Once</Label>
                      <Input 
                        id="slidesCount" 
                        type="number" 
                        min="1"
                        max="10"
                        value={adSlidesCount} 
                        onChange={(e) => handleUpdateSlidesCount(parseInt(e.target.value) || 1)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Upload New Ad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Title (Optional)</Label>
                      <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Summer Sale" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Link URL (Optional)</Label>
                      <Input value={adLink} onChange={(e) => setAdLink(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Ad Image (Max 2MB)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setAdFile(e.target.files?.[0] || null)} className="bg-slate-800 border-slate-700 text-slate-300" />
                    </div>
                    <Button onClick={handleUploadAd} disabled={adLoading || !adFile} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      {adLoading ? "Uploading..." : "Upload Ad"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Active Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adsList.length === 0 ? (
                     <p className="text-slate-400 text-sm">No ads uploaded yet.</p>
                  ) : (
                    adsList.map(ad => (
                      <div key={ad.id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-16 bg-slate-800 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                            {ad.image_url ? (
                              <img src={ad.image_url} alt="Ad" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{ad.title || 'Untitled Ad'}</h4>
                            <p className="text-xs text-slate-400 mt-1">{ad.link_url || 'No link'}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Created: {new Date(ad.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Switch 
                            checked={ad.is_active} 
                            onCheckedChange={(checked) => handleToggleAdActive(ad.id, checked)} 
                            className="data-[state=checked]:bg-indigo-500"
                          />
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAd(ad.id)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/20">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── Social Media & Marketing Handles ── */}
        <TabsContent value="social" className="space-y-6">
          <PlatformSocialsManager />
        </TabsContent>

      </Tabs>

      {/* ── Manage User Details & Plan Override Modal ── */}
      {selectedUserForModal && (
        <Dialog open={isManageUserModalOpen} onOpenChange={setIsManageUserModalOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white shadow-2xl p-6 z-[9999] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-black shrink-0 shadow-md">
                    {(selectedUserForModal.first_name?.[0] || selectedUserForModal.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                      {[selectedUserForModal.first_name, selectedUserForModal.last_name].filter(Boolean).join(" ") || "Registered User"}
                      <Badge className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px]">
                        {selectedUserForModal.role ? selectedUserForModal.role.toUpperCase() : "NO ROLE"}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs mt-0.5">
                      {selectedUserForModal.email}
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Profile Credentials Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">User ID</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-mono text-slate-300 truncate max-w-[90px]">{selectedUserForModal.user_id}</span>
                    <button onClick={() => copyText(selectedUserForModal.user_id, 'uid')} className="text-slate-500 hover:text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered On</span>
                  <span className="font-medium text-slate-300 mt-0.5 block">
                    {selectedUserForModal.created_at ? new Date(selectedUserForModal.created_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Last Sign-In</span>
                  <span className="font-medium text-slate-300 mt-0.5 block">
                    {selectedUserForModal.last_sign_in ? new Date(selectedUserForModal.last_sign_in).toLocaleDateString("en-IN") : "Never"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Business</span>
                  <span className="font-medium text-indigo-400 mt-0.5 block truncate">
                    {selectedUserForModal.org_name || "None"}
                  </span>
                </div>
              </div>

              {/* Plan Management Section */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400" /> Subscription Plan Allocation
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Select and assign the subscription tier for this user's business.</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getUserPlans(selectedUserForModal).map(p => (
                      <Badge key={p} className={`${PLAN_COLORS[p] || PLAN_COLORS.free} text-[10px]`}>
                        {PLAN_DISPLAY_NAMES[p] || p}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Fast Presets */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetUserDirectPlan(selectedUserForModal, "free")}
                    className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2"
                  >
                    🆓 Set Free Plan (₹0)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetUserDirectPlan(selectedUserForModal, "plan_2")}
                    className="border-blue-700/60 bg-blue-950/30 hover:bg-blue-900/50 text-blue-300 text-xs font-bold py-2"
                  >
                    📄 Sales & Stock (₹499)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSetUserDirectPlan(selectedUserForModal, "plan_3")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md py-2"
                  >
                    🏢 Business Suite (₹999)
                  </Button>
                </div>

                {/* Modular Add-on Checkboxes */}
                <div className="pt-3 border-t border-slate-700/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
                    Toggle Specific Modular Plans:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availablePlans.map(p => {
                      const isChecked = getUserPlans(selectedUserForModal).includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                            isChecked ? "bg-indigo-950/40 border-indigo-500/40" : "bg-slate-900/60 border-slate-800"
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">{p.label}</span>
                            <span className="text-[10px] text-slate-400">
                              {PLAN_DISPLAY_NAMES[p.id] || p.id}
                            </span>
                          </div>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleUserPlanToggle(selectedUserForModal, p.id)}
                            className="border-slate-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Business Association Section */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Business Association & Role
                </h4>

                {selectedUserForModal.org_id ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">{selectedUserForModal.org_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Org ID: {selectedUserForModal.org_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Change Role:</span>
                      <Select
                        value={selectedUserForModal.role || "member"}
                        onValueChange={(val) => handleUserRoleChange(selectedUserForModal, val)}
                      >
                        <SelectTrigger className="w-32 bg-slate-950 border-slate-700 text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white z-[9999]">
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Staff / Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/30 p-2.5 rounded-lg">
                      This user has registered but has not yet created or joined any business.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateAndAssignOrgForUser(selectedUserForModal, ['plan_3'])}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Create Business & Assign Business Suite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateAndAssignOrgForUser(selectedUserForModal, ['free'])}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                      >
                        Create Business with Free Plan
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Granular Module Feature Toggles for linked Business */}
              {selectedUserForModal.org_id && (() => {
                const org = getUserOrg(selectedUserForModal);
                if (!org) return null;
                const sub = org.subscription || { plan_name: "free", enabled_features: ADMIN_FEATURE_GROUPS.map(g => g.key) };
                const currentFeatures = Array.isArray(sub.enabled_features) ? sub.enabled_features : ADMIN_FEATURE_GROUPS.map(g => g.key);

                return (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-purple-400" /> Module Access Control
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Toggle specific feature modules on or off for this user's organization.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnableAll(org.id)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px] h-7 px-2"
                        >
                          Enable All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisableAll(org.id)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px] h-7 px-2"
                        >
                          Disable All
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {ADMIN_FEATURE_GROUPS.map(group => {
                        const isEnabled = currentFeatures.includes(group.key);
                        return (
                          <div
                            key={group.key}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                              isEnabled ? "bg-indigo-950/30 border-indigo-500/30 text-white" : "bg-slate-900/60 border-slate-800 text-slate-400"
                            }`}
                          >
                            <span className="font-medium truncate pr-2">{group.label}</span>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleToggleFeature(org.id, group.key, checked)}
                              className="data-[state=checked]:bg-indigo-600 shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Changes are saved directly to the database.</span>
              <Button
                onClick={() => setIsManageUserModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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

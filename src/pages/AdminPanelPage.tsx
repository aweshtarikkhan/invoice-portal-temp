import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import {
  useFeatureStore,
  ADMIN_FEATURE_GROUPS,
  DEFAULT_FEATURE_GROUPS,
} from "@/store/feature-store";
import { useAuth } from "@/lib/auth";
import { LockedFeature } from "@/components/subscription/LockedFeature";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlanSelectorModal } from "@/components/shared/PlanSelectorModal";
import { SubscriptionBadge } from "@/components/shared/SubscriptionBadge";
import { useSubscription } from "@/hooks/use-subscription";
import {
  Shield, Check, X, ArrowLeft, Plus, Trash2, Building2,
  FileText, Package, ShoppingCart, Calculator,
  UserCog, Users, Send, BarChart3, Loader2, AlertCircle, ChevronDown,
  AlertTriangle, Crown
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  FileText, Package, ShoppingCart, Calculator,
  UserCog, Users, Send, BarChart3,
};

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const userRole = useAppStore((s) => s.userRole);

  if (userRole === "staff") {
    return <Navigate to="/dashboard" replace />;
  }

  const org = useAppStore((s) => s.organization);
  const isFreePlan = org?.subscription_plan === 'free' || !org?.subscription_plan;
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isFreePlan) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <LockedFeature 
          title="Admin Panel Locked"
          description="The Admin Panel is available exclusively on our Premium plans. Upgrade to manage team members, advanced settings, and API integrations."
          onUpgradeClick={() => setShowUpgrade(true)}
        />
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          onSelectPlan={(plan, interval, price) => {
            // Future: integrate with Razorpay
            window.location.href = `/settings`; // Placeholder for real billing logic
          }} 
        />
      </div>
    );
  }

  const { session } = useAuth();
  const {
    isAdmin,
    isSuperAdmin,
    adminEmails,
    addAdmin,
    removeAdmin,
    enabledGroups,
    toggleGroup,
    teamMembers,
    addTeamMember,
    removeTeamMember,
    platformFeatures,
  } = useFeatureStore();

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("Staff");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  const [fetchedTeamMembers, setFetchedTeamMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedTeamOrgId, setSelectedTeamOrgId] = useState<string>("");
  const [selectedOrgFeatures, setSelectedOrgFeatures] = useState<string[]>([]);
  
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [newOrgIdToUpgrade, setNewOrgIdToUpgrade] = useState<string | null>(null);
  const addMyOrganization = useAppStore((s) => s.addMyOrganization);
  const myOrganizations = useAppStore((s) => s.myOrganizations);
  const currentOrg = useAppStore((s) => s.organization);

  const currentUserEmail = session?.user?.email;
  const isSuper = isSuperAdmin(currentUserEmail);

  // Subscription state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const { subscriptionPlan, subscriptionStatus, trialDaysLeft, isOnTrial } = useSubscription();

  // Logic for global team members limit across ALL businesses
  const totalGlobalUsers = fetchedTeamMembers.length;
  const currentOrgId = currentOrg?.id || "default";

  const loadTeamMembers = async () => {
    const targetOrgId = selectedTeamOrgId || currentOrgId;
    if (targetOrgId === "default" || !targetOrgId) return;
    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase.rpc("get_org_members_with_status", { target_org_id: targetOrgId });
      if (data) setFetchedTeamMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    const fetchOrgFeatures = async () => {
      const targetOrgId = selectedTeamOrgId || currentOrgId;
      if (!targetOrgId || targetOrgId === "default") return;
      
      try {
        const { data } = await supabase.rpc('get_my_org_subscription', { p_org_id: targetOrgId });
        if (data && data.enabled_features) {
          setSelectedOrgFeatures(data.enabled_features);
        } else {
          setSelectedOrgFeatures([]);
        }
      } catch (err) {
        console.error("Failed to fetch features for org:", err);
        setSelectedOrgFeatures([]);
      }
    };
    fetchOrgFeatures();
  }, [selectedTeamOrgId, currentOrgId]);

  useEffect(() => {
    if (currentOrgId && currentOrgId !== "default" && !selectedTeamOrgId) {
      setSelectedTeamOrgId(currentOrgId);
    }
  }, [currentOrgId, selectedTeamOrgId]);

  useEffect(() => { loadTeamMembers(); }, [selectedTeamOrgId, currentOrgId]);

  const globalLimitReached = totalGlobalUsers >= 5;

  const handleAddAdmin = () => {
    if (newAdminEmail && newAdminEmail.includes("@")) {
      addAdmin(newAdminEmail);
      setNewAdminEmail("");
    }
  };

  const handleAddTeamMember = async () => {
    const targetOrgId = selectedTeamOrgId || currentOrgId;
    if (newUserEmail && newUserEmail.includes("@") && !globalLimitReached && targetOrgId) {
      try {
        const { data, error } = await supabase.functions.invoke("invite-team-member", {
          body: {
            email: newUserEmail,
            role: newUserRole.toLowerCase(),
            org_id: targetOrgId,
            permissions: newUserPermissions
          }
        });

        if (error) throw error;
        
        // Reload team members to reflect the new user
        loadTeamMembers();
        
        setNewUserEmail("");
        setNewUserRole("Staff");
        setNewUserPermissions([]);
      } catch (err: any) {
        console.error("Failed to invite team member:", err.message);
        alert("Failed to invite user: " + err.message);
      }
    }
  };

  const togglePermission = (groupKey: string) => {
    setNewUserPermissions((prev) => 
      prev.includes(groupKey) 
        ? prev.filter((k) => k !== groupKey) 
        : [...prev, groupKey]
    );
  };

  const handleCreateBusiness = async () => {
    if (!newBusinessName.trim()) return;
    
    setIsCreatingBusiness(true);
    try {
      // Create organization in Supabase
      const { data, error } = await supabase
        .from("organizations")
        .insert([{ name: newBusinessName.trim() }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update our local tracking
      if (data) {
        setNewBusinessName("");
        
        // Let's also automatically switch the user to the new business
        if (currentUserEmail) {
          // Add the user to organization_members for this new business as Admin
          const allFeatures = [...DEFAULT_FEATURE_GROUPS, ...ADMIN_FEATURE_GROUPS].map(g => g.key);
          await supabase.from("organization_members").update({
            email: currentUserEmail,
            role: "owner",
            status: "active",
            permissions: allFeatures
          }).eq("org_id", data.id).eq("user_id", session?.user?.id);

          const { error: profileError } = await supabase
            .from("profiles")
            .update({ org_id: data.id })
            .eq("id", session?.user?.id);
            
          if (!profileError) {
            setNewOrgIdToUpgrade(data.id);
            // Open the plan selector modal for payment
            setShowPlanModal(true);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to create business:", err.message);
      alert("Failed to create business: " + err.message);
    } finally {
      setIsCreatingBusiness(false);
    }
  };

  // --- Delete Organization State ---
  const [orgToDelete, setOrgToDelete] = useState<{id: string; name: string; plan: string} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [allOrgsWithPlans, setAllOrgsWithPlans] = useState<Array<{id: string; name: string; plan: string; planDisplay?: string; status?: string; isActive: boolean}>>([]);

  const loadAllOrgsWithPlans = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.rpc("get_my_orgs_with_plans");
    if (data) {
      const list = (data as any[]).map(row => ({
        id: row.org_id,
        name: row.org_name,
        plan: row.plan_name || "free",
        planDisplay: row.plan_display || "Free Plan",
        status: row.sub_status || "free",
        isActive: row.org_id === currentOrg?.id
      }));
      setAllOrgsWithPlans(list);
    }
  };

  useEffect(() => { loadAllOrgsWithPlans(); }, [currentOrg?.id, session?.user?.id]);

  const handleDeleteOrg = async () => {
    if (!orgToDelete || deleteConfirmText !== orgToDelete.name) return;
    setIsDeletingOrg(true);
    try {
      // Delete the organization — CASCADE will delete all related data
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgToDelete.id);

      if (error) throw error;

      setOrgToDelete(null);
      setDeleteConfirmText("");

      // If deleted the active org, reload the page to pick a new one
      if (orgToDelete.id === currentOrg?.id) {
        window.location.href = "/dashboard";
      } else {
        // Just reload org list
        loadAllOrgsWithPlans();
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Failed to delete organization:", err.message);
      alert("Failed to delete: " + err.message);
    } finally {
      setIsDeletingOrg(false);
    }
  };


  // Admin panel
  const availableAdminFeatures = ADMIN_FEATURE_GROUPS.filter((g) => platformFeatures.includes(g.key));
  const totalAdminFeatures = availableAdminFeatures.length;
  const enabledCount = availableAdminFeatures.filter((g) =>
    enabledGroups.includes(g.key)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-400">Manage Features & Users</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Subscription & Billing Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              Subscription & Billing
            </h2>
          </div>
          <Card className="bg-slate-800/40 backdrop-blur border-slate-700/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Current Plan: {subscriptionPlan ? <SubscriptionBadge /> : "Free"}</h3>
                  <p className="text-sm text-slate-400">
                    {isOnTrial 
                      ? `Your free trial ends in ${trialDaysLeft} days.` 
                      : "Manage your business subscription and billing details."}
                  </p>
                </div>
                <Button 
                  onClick={() => setShowPlanModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {subscriptionStatus === "active" ? "Manage Subscription" : "Upgrade Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Organization Users (Team) Section - Visible to all Admins */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Organization Users (Team)
            </h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${globalLimitReached ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                Total Users Used: {totalGlobalUsers} / 5 (Across all businesses)
              </span>
            </div>
          </div>
          <Card className="bg-slate-800/40 backdrop-blur border-slate-700/30">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-5 border-r border-slate-700/30 pr-8">
                  <div>
                    <h3 className="text-white font-medium mb-1">Invite Employee</h3>
                    <p className="text-xs text-slate-400">Add a new user to {allOrgsWithPlans.find(o => o.id === (selectedTeamOrgId || currentOrgId))?.name || "this business"}.</p>
                  </div>
                  
                  {globalLimitReached ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-red-400 text-sm font-medium">Global Plan Limit Reached</h4>
                        <p className="text-xs text-red-400/80 mt-1">You have reached the limit of 5 users across all your businesses. Please extend your limit to add more users.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allOrgsWithPlans.length > 1 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-300">Select Business</label>
                          <select
                            value={selectedTeamOrgId || currentOrgId}
                            onChange={(e) => setSelectedTeamOrgId(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600/50 text-white h-10 rounded-md px-3 focus:outline-none focus:border-emerald-500"
                          >
                            {allOrgsWithPlans.map(org => (
                              <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Email Address</label>
                        <Input
                          placeholder="employee@company.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 h-10 focus:border-emerald-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">User Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-600/50 text-white h-10 rounded-md px-3 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Manager">Manager</option>
                          <option value="Accountant">Accountant</option>
                          <option value="Sales Executive">Sales Executive</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Feature Permissions</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <label className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/30 p-2 rounded border border-slate-700/30 cursor-pointer hover:bg-slate-800 transition-colors">
                            <input
                              type="checkbox"
                              checked={newUserPermissions.includes("settings_access")}
                              onChange={() => togglePermission("settings_access")}
                              className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="truncate">Settings Access</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/30 p-2 rounded border border-slate-700/30 cursor-pointer hover:bg-slate-800 transition-colors">
                            <input
                              type="checkbox"
                              checked={newUserPermissions.includes("whatsapp_access")}
                              onChange={() => togglePermission("whatsapp_access")}
                              className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="truncate">WhatsApp Access</span>
                          </label>
                          {[...DEFAULT_FEATURE_GROUPS, ...ADMIN_FEATURE_GROUPS.filter(g => selectedOrgFeatures.includes(g.key))].map(group => (
                            <label key={group.key} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/30 p-2 rounded border border-slate-700/30 cursor-pointer hover:bg-slate-800 transition-colors">
                              <input
                                type="checkbox"
                                checked={newUserPermissions.includes(group.key)}
                                onChange={() => togglePermission(group.key)}
                                className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="truncate">{group.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleAddTeamMember}
                        disabled={!newUserEmail || !newUserEmail.includes("@")}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 transition-colors mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add User
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-4">Current Team Members in {allOrgsWithPlans.find(o => o.id === (selectedTeamOrgId || currentOrgId))?.name || "this business"}</h3>
                  {isLoadingMembers ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>
                  ) : fetchedTeamMembers.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No users have been added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {fetchedTeamMembers.map((member) => (
                        <div key={member.member_id} className="flex flex-col p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <UserCog className="h-5 w-5 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="text-sm text-white font-medium leading-none">{member.email}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                    {member.role}
                                  </span>
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full `}>
                                    {member.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={async () => { await supabase.from('organization_members').delete().eq('id', member.member_id); loadTeamMembers(); }}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                              title="Remove user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {member.permissions && member.permissions.length > 0 && (
                            <div className="pt-2 border-t border-slate-700/30">
                              <p className="text-[10px] text-slate-400 mb-1.5 font-medium">ACCESS GRANTED:</p>
                              <div className="flex flex-wrap gap-1">
                                {member.permissions.map(p => {
                                  const group = [...DEFAULT_FEATURE_GROUPS, ...ADMIN_FEATURE_GROUPS].find(g => g.key === p);
                                  return (
                                    <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {group?.label || p}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Business Management Section */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            Manage Businesses
          </h2>
          <Card className="bg-slate-800/40 backdrop-blur border-slate-700/30">
            <CardContent className="p-6 space-y-6">
              {/* Create New Business */}
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-1">Create New Business</h3>
                    <p className="text-xs text-slate-400">Create a new company or business account. Purchasing a new plan is mandatory.</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Business Name (e.g. ABC Pvt Ltd)"
                      value={newBusinessName}
                      onChange={(e) => setNewBusinessName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateBusiness()}
                      disabled={isCreatingBusiness}
                      className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 h-10 focus:border-indigo-500"
                    />
                    <Button
                      onClick={handleCreateBusiness}
                      disabled={!newBusinessName.trim() || isCreatingBusiness}
                      className="h-10 bg-indigo-600 hover:bg-indigo-500 transition-colors shrink-0"
                    >
                      {isCreatingBusiness ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                      Continue to Payment
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <h4 className="text-indigo-400 font-medium text-sm mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Multi-Business Feature
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Manage multiple businesses with a single login. A separate plan is required for each new business.
                    </p>
                  </div>
                </div>
              </div>

              {/* All Businesses List */}
              {allOrgsWithPlans.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    All Your Businesses
                    <span className="text-xs text-slate-500 font-normal">({allOrgsWithPlans.length} total)</span>
                  </h3>
                  <div className="space-y-2">
                    {allOrgsWithPlans.map((org) => {
                      const isPaid = org.plan && org.plan !== "free" && org.plan !== "trial";
                      const planLabel = org.planDisplay || (org.plan === "free" ? "Free Plan" : org.plan === "trial" ? "Trial" : org.plan);
                      const planColor = isPaid
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : org.plan === "trial"
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        : "bg-slate-700/50 text-slate-400 border-slate-600/30";

                      return (
                        <div
                          key={org.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            org.isActive
                              ? "bg-indigo-500/10 border-indigo-500/30"
                              : "bg-slate-900/40 border-slate-700/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                              org.isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-700/50 text-slate-400"
                            }`}>
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{org.name}</span>
                                {org.isActive && (
                                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {isPaid && <Crown className="h-3 w-3 text-amber-400" />}
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${planColor}`}>
                                  {planLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setOrgToDelete({ id: org.id, name: org.name, plan: org.plan })}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all group"
                            title="Delete this business"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        {/* Removed Admin Management Section */}

        {/* Feature Management Section */}
        <section>
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl bg-slate-800/40 backdrop-blur border border-slate-700/30 p-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Default Features</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{DEFAULT_FEATURE_GROUPS.reduce((a, g) => a + g.items.length, 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Always active — Invoice & Inventory</p>
            </div>
            <div className="rounded-2xl bg-slate-800/40 backdrop-blur border border-slate-700/30 p-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Enabled Modules</p>
              <p className="text-3xl font-bold text-indigo-400 mt-1">{enabledCount} <span className="text-lg text-slate-500">/ {totalAdminFeatures}</span></p>
              <p className="text-xs text-slate-500 mt-1">Modules enabled for {currentOrg?.name || "this business"}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/40 backdrop-blur border border-slate-700/30 p-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Features</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">
                {DEFAULT_FEATURE_GROUPS.reduce((a, g) => a + g.items.length, 0) + availableAdminFeatures.filter((g) => enabledGroups.includes(g.key)).reduce((a, g) => a + g.items.length, 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Features visible to the user</p>
            </div>
          </div>

          {/* Admin-controlled features */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                Admin Controlled Features — Toggle ON/OFF ({currentOrg?.name || "Current Business"})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {availableAdminFeatures.map((group) => {
                const isEnabled = enabledGroups.includes(group.key);
                const Icon = ICON_MAP[group.icon] || Package;
                return (
                  <div
                    key={group.key}
                    className={`rounded-2xl border p-5 relative overflow-hidden transition-all duration-500 ${
                      isEnabled
                        ? "bg-indigo-500/5 border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                        : "bg-slate-800/20 border-slate-700/30 opacity-75"
                    }`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 transition-colors duration-500 ${
                        isEnabled ? "bg-indigo-500/10" : "bg-slate-700/10"
                      }`}
                    />
                    <div className="flex items-start gap-3 relative">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                          isEnabled ? "bg-indigo-500/15" : "bg-slate-700/30"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 transition-colors duration-300 ${
                            isEnabled ? "text-indigo-400" : "text-slate-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold transition-colors duration-300 ${isEnabled ? "text-white" : "text-slate-400"}`}>
                            {group.label}
                          </h3>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleGroup(group.key, currentOrgId)}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {group.items.map((item) => (
                            <span
                              key={item.key}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300 ${
                                isEnabled
                                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                  : "bg-slate-800/40 text-slate-500 border-slate-700/30"
                              }`}
                            >
                              {item.title}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] mt-2 text-slate-500">
                          {group.items.length} features • {isEnabled ? "✅ Visible to user" : "❌ Hidden from user"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
      
      <PlanSelectorModal 
        open={showPlanModal} 
        onClose={() => {
          setShowPlanModal(false);
          if (newOrgIdToUpgrade) {
            window.location.reload();
          }
        }} 
        currentPlanName={subscriptionPlan || "free"}
        forceOrgId={newOrgIdToUpgrade}
      />

      {/* ====== DELETE ORGANIZATION MODAL (Vercel-style) ====== */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'}}>
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-lg shadow-2xl shadow-red-500/10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Organization</h2>
                  <p className="text-sm text-slate-400 mt-1">This action <span className="text-red-400 font-semibold">cannot be undone</span>. Please read carefully.</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Plan Warning */}
              {orgToDelete.plan !== "free" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Crown className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">You have a paid plan on this business</p>
                    <p className="text-xs text-amber-400/80 mt-1">Deleting this organization will immediately cancel your <span className="font-bold uppercase">{orgToDelete.plan}</span> subscription. No refund will be issued for unused time.</p>
                  </div>
                </div>
              )}

              {/* Data Loss Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">You will lose access to ALL your data</p>
                  <p className="text-xs text-red-400/80 mt-1">All invoices, clients, inventory, employees, reports, and every other record in <span className="font-bold">{orgToDelete.name}</span> will be permanently deleted from our database immediately.</p>
                </div>
              </div>

              {/* Confirm by typing name */}
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  To confirm, type the organization name below:
                </p>
                <p className="text-sm font-mono font-bold text-white bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 select-all">
                  {orgToDelete.name}
                </p>
                <Input
                  placeholder={`Type "${orgToDelete.name}" to confirm`}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setOrgToDelete(null); setDeleteConfirmText(""); }}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                disabled={isDeletingOrg}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteOrg}
                disabled={deleteConfirmText !== orgToDelete.name || isDeletingOrg}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isDeletingOrg ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4 mr-2" />Delete Organization</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



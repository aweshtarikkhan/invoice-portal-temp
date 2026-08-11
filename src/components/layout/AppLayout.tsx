import { Outlet, useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useFeatureStore, ADMIN_FEATURE_GROUPS } from "@/store/feature-store";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { TrialBanner } from "@/components/shared/TrialBanner";
import { PlanSelectorModal } from "@/components/shared/PlanSelectorModal";
import { SubscriptionBadge } from "@/components/shared/SubscriptionBadge";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Home, Settings, User, HelpCircle, Building2 } from "lucide-react";

function OrgSetup({ onComplete }: { onComplete: () => void }) {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim() || !profile) return;
    setSaving(true);
    const { data: orgData, error } = await supabase.rpc("create_organization_for_current_user", {
      org_name: name.trim(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Handle initial plan and trial
    try {
      const planName = sessionStorage.getItem("onboarding_plan") || "free";
      const { data: settingsData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "trial_days")
        .maybeSingle();

      const trialDays = settingsData ? parseInt(settingsData.value) : 14;

      if (trialDays > 0) {
        // We need to fetch the org_id to start the trial. 
        // create_organization_for_current_user returns the org row.
        const orgId = orgData?.id;
        
        if (orgId) {
          await supabase.rpc("start_org_trial", {
            p_org_id: orgId,
            p_plan_name: planName
          });
        }
      }
    } catch (err) {
      console.error("Failed to start trial:", err);
    }

    toast({ title: "Organization created!" });
    onComplete();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome! Set up your organization</CardTitle>
          <CardDescription>Enter your business name to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name *</Label>
            <Input
              placeholder="e.g. Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? "Creating..." : "Continue"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><Home className="h-4 w-4 mr-2" /> Home</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-rose-500 hover:text-rose-600">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const setOrganization = useAppStore((s) => s.setOrganization);
  const setCurrentUserId = useAppStore((s) => s.setCurrentUserId);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const org = useAppStore((s) => s.organization);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const { subscriptionPlan } = useSubscription();
  const navigate = useNavigate();

  const loadOrg = async () => {
    if (!profile) return;
    
    setCurrentUserId(profile.user_id);
    
    // Check if platform admin first using reliable RPC function
    const { data: isAdmin } = await supabase
      .rpc("is_platform_admin", { check_user_id: profile.user_id });

    if (isAdmin === true) {
      navigate("/platform-admin", { replace: true });
      return;
    }

    // Query all organizations the user is a member of
    const { data: memberOrgs, error: memberErr } = await supabase
      .from("organization_members")
      .select("org_id, role, permissions, organizations(id, name, logo_url)")
      .eq("user_id", profile.user_id);

    console.log("[loadOrg] memberOrgs:", memberOrgs, "error:", memberErr);

    if (memberOrgs && memberOrgs.length > 0) {
      const orgList = memberOrgs
        .filter((m) => m.organizations)
        .map((m) => ({ id: (m.organizations as any).id, name: (m.organizations as any).name }));
      
      useAppStore.setState({ myOrganizations: orgList });

      let activeOrgId = profile.org_id;
      const isValidMemberOrg = activeOrgId && memberOrgs.some((m) => m.org_id === activeOrgId);

      if (!isValidMemberOrg) {
        activeOrgId = memberOrgs[0].org_id;
        await supabase
          .from("profiles")
          .update({ org_id: activeOrgId })
          .eq("id", profile.id);
      }

      const { data: activeOrg, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", activeOrgId)
        .maybeSingle();

      console.log("[loadOrg] activeOrg:", activeOrg, "error:", orgErr);

      if (activeOrg) {
        setOrganization(activeOrg as any);
        const activeMember = memberOrgs.find((m) => m.org_id === activeOrgId);
        setUserRole(activeMember?.role || "staff");

        if ((activeOrg as any).enabled_features && Array.isArray((activeOrg as any).enabled_features)) {
          useFeatureStore.getState().setOrgFeatures(activeOrgId, (activeOrg as any).enabled_features);
        } else {
          useFeatureStore.getState().initOrgFeatures(activeOrgId);
        }

        try {
          const { data: subData } = await supabase.rpc("get_my_org_subscription", {
            p_org_id: activeOrgId
          });
          
          if (subData) {
            if (Array.isArray(subData.enabled_features)) {
              useFeatureStore.getState().setPlatformFeatures(subData.enabled_features);
            }
            useFeatureStore.getState().setSubscriptionMeta({
              plan_name: subData.plan_name,
              status: subData.status,
              trial_ends_at: subData.trial_ends_at,
              employee_limit: subData.employee_limit,
              employee_count: subData.employee_count,
              current_period_end: subData.current_period_end,
            });
          }
        } catch (err) {
          console.error("Failed to load subscription features via RPC:", err);
        }

        setNeedsSetup(false);
        setChecking(false);
        return;
      }
    }

    // memberOrgs was empty or org not found in member list — try profile.org_id directly
    if (profile.org_id) {
      const { data: fallbackOrg } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.org_id)
        .maybeSingle();

      console.log("[loadOrg] fallback org by profile.org_id:", fallbackOrg);

      if (fallbackOrg) {
        setOrganization(fallbackOrg as any);
        setUserRole("admin"); // Assume admin since they have org_id on profile

        if ((fallbackOrg as any).enabled_features && Array.isArray((fallbackOrg as any).enabled_features)) {
          useFeatureStore.getState().setOrgFeatures(profile.org_id, (fallbackOrg as any).enabled_features);
        } else {
          useFeatureStore.getState().initOrgFeatures(profile.org_id);
        }

        try {
          const { data: subData } = await supabase.rpc("get_my_org_subscription", { p_org_id: profile.org_id });
          if (subData) {
            if (Array.isArray(subData.enabled_features)) {
              useFeatureStore.getState().setPlatformFeatures(subData.enabled_features);
            }
            useFeatureStore.getState().setSubscriptionMeta({
              plan_name: subData.plan_name,
              status: subData.status,
              trial_ends_at: subData.trial_ends_at,
              employee_limit: subData.employee_limit,
              employee_count: subData.employee_count,
              current_period_end: subData.current_period_end,
            });
          }
        } catch (err) {
          console.error("Failed to load subscription via RPC:", err);
        }

        setNeedsSetup(false);
        setChecking(false);
        return;
      }
      // profile.org_id exists but org not found - user has org, don't show setup
      // Just show dashboard with empty state rather than setup screen
      setNeedsSetup(false);
      setChecking(false);
      return;
    }

    // Truly no org at all — could be a pure employee or brand new user
    await checkEmployeeAndBlock();
    setChecking(false);
  };

  const [isEmployeeBlocked, setIsEmployeeBlocked] = useState(false);

  const checkEmployeeAndBlock = async () => {
    if (!profile?.id) return;

    // If user has an org_id on their profile, they are an org admin/owner
    // — never block them, even if they're also in the employees table.
    if (profile.org_id) {
      setNeedsSetup(true);
      return;
    }

    // Check if user is in organization_members (e.g. org created but profile.org_id wasn't set)
    const { data: memberCheck } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", profile.user_id)
      .limit(1);

    if (memberCheck && memberCheck.length > 0) {
      setNeedsSetup(true);
      return;
    }

    // Only block pure employee accounts (no org membership at all)
    // Use profile.user_id (auth.uid) to match employees.auth_user_id
    const { data: empRecord } = await (supabase as any)
      .from("employees")
      .select("id")
      .eq("auth_user_id", profile.user_id)
      .maybeSingle();

    if (empRecord) {
      await supabase.auth.signOut();
      setIsEmployeeBlocked(true);
      return;
    }
    setNeedsSetup(true);
  };

  useEffect(() => {
    if (window.location.hash.includes("type=invite") || window.location.hash.includes("type=recovery")) {
      navigate("/reset-password" + window.location.hash, { replace: true });
      return;
    }
    loadOrg();
  }, [profile?.org_id]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isEmployeeBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md border-destructive/30 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2 text-2xl font-bold">
              🚫
            </div>
            <CardTitle className="text-xl text-destructive font-bold">Access Denied</CardTitle>
            <CardDescription className="text-sm mt-2 text-foreground font-medium">
              Employee / Staff accounts cannot log into this Portal. Please use the Attendance Portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-center">
            <a
              href="https://attendance.satahinvoice.com/"
              target="_blank"
              rel="noreferrer"
              className="block w-full"
            >
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5">
                Click here to login
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsSetup) {
    return <OrgSetup onComplete={() => window.location.reload()} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center gap-6 px-8 bg-slate-50/50 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <CommandPalette />
              <LanguageSwitcher />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 pr-2 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {profile?.first_name?.[0] || "D"}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">
                        {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || ""}
                      </p>
                      {org && (
                        <p className="text-xs leading-none text-muted-foreground flex items-center gap-1 pt-1 mb-2">
                          <Building2 className="h-3 w-3" />
                          {org.name}
                        </p>
                      )}
                      <SubscriptionBadge />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate("/login", { replace: true });
                    }}
                    className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <TrialBanner onUpgrade={() => setShowPlanModal(true)} />
          <main className="flex-1 overflow-auto px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
      
      <PlanSelectorModal 
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        currentPlanName={subscriptionPlan || undefined}
      />
    </SidebarProvider>
  );
}

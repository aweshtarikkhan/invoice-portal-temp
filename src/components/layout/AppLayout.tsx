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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Home } from "lucide-react";

function OrgSetup({ onComplete }: { onComplete: () => void }) {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim() || !profile) return;
    setSaving(true);
    const { error } = await supabase.rpc("create_organization_for_current_user", {
      org_name: name.trim(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
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
            <Link to="/"><Home className="h-4 w-4 mr-2" /> Home</Link>
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
  const { profile } = useAuth();
  const setOrganization = useAppStore((s) => s.setOrganization);
  const setCurrentUserId = useAppStore((s) => s.setCurrentUserId);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const org = useAppStore((s) => s.organization);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);
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

    if (profile.org_id) {
      // Fetch org data WITHOUT the subscription join first (more reliable)
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.org_id)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching org:", error);
      }
        
      if (data) {
        setOrganization(data as any);
        
        // Fetch user's role for this organization
        const { data: roleData, error: roleError } = await supabase.rpc("get_current_org_role");
        if (roleData) {
          setUserRole(roleData as string);
        }
        
        
        // Fetch subscription features separately using an RPC to bypass the RLS infinite recursion bug
        try {
          const { data: subData } = await supabase.rpc("get_my_org_subscription", {
            p_org_id: profile.org_id
          });
          
          if (subData && Array.isArray(subData.enabled_features)) {
            // Platform Admin controls the subscription (backend).
            useFeatureStore.getState().setPlatformFeatures(subData.enabled_features);
          }
        } catch (err) {
          console.error("Failed to load subscription features via RPC:", err);
        }
        
        setNeedsSetup(false);
      } else {
        await checkEmployeeAndBlock();
      }
    } else {
      await checkEmployeeAndBlock();
    }
    setChecking(false);
  };

  const checkEmployeeAndBlock = async () => {
    if (!profile?.id) return;
    const { data: empRecord } = await (supabase as any)
      .from("employees")
      .select("id")
      .or(`auth_user_id.eq.${profile.id},id.eq.${profile.id}`)
      .maybeSingle();

    if (empRecord) {
      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "Employee / Staff accounts cannot log into the Main Invoice Admin Portal. Please use the Attendance Portal.",
        variant: "destructive",
      });
      window.location.href = "/login";
      return;
    }
    setNeedsSetup(true);
  };

  useEffect(() => {
    loadOrg();
  }, [profile?.org_id]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
              <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 pr-2 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {profile?.first_name?.[0] || "D"}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

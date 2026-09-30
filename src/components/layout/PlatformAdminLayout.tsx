import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlatformAdminLayout() {
  const { profile, user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSuperAdmin = async () => {
      const targetUserId = user?.id || profile?.user_id;
      const targetEmail = (user?.email || profile?.email || "").toLowerCase().trim();

      if (targetEmail === "admin@aassaybiz.com" || targetEmail === "awesh.etpl@gmail.com") {
        if (isMounted) setIsSuperAdmin(true);
        return;
      }

      if (!targetUserId) {
        if (!authLoading && isMounted) {
          setIsSuperAdmin(false);
        }
        return;
      }
      try {
        const { data: isAdmin, error } = await supabase
          .rpc("is_platform_admin", { check_user_id: targetUserId });
        
        if (error) {
          console.warn("is_platform_admin RPC error, trying direct table check:", error.message);
          const { data: directCheck } = await supabase
            .from("platform_admins")
            .select("id")
            .or(`id.eq.${targetUserId},user_id.eq.${targetUserId},email.eq.${targetEmail}`)
            .maybeSingle();
          if (isMounted) setIsSuperAdmin(!!directCheck);
        } else {
          if (isMounted) setIsSuperAdmin(isAdmin === true);
        }
      } catch (err) {
        console.error("SuperAdmin check failed:", err);
        if (isMounted) setIsSuperAdmin(false);
      }
    };

    if (!authLoading) {
      checkSuperAdmin();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, profile?.user_id, authLoading]);

  if (isSuperAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h1>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          You do not have Platform Admin privileges to view this page.
        </p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Outlet />
    </div>
  );
}

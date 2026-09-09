import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlatformAdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!profile?.user_id) return;
      const { data: isAdmin } = await supabase
        .rpc("is_platform_admin", { check_user_id: profile.user_id });
      setIsSuperAdmin(isAdmin === true);
    };
    checkSuperAdmin();
  }, [profile?.user_id]);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar - Light Mode, same style as main app */}
      <header className="h-16 border-b border-slate-200 bg-white shadow-sm px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-slate-800 leading-tight">Assay Biz</h1>
            <p className="text-[10px] text-indigo-500 font-medium uppercase tracking-wider leading-tight">Platform Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            App Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}

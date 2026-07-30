import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 text-white">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          You do not have Platform Admin privileges to view this page.
        </p>
        <Button onClick={() => navigate("/dashboard")} variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Top Navbar for Super Admin */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="font-bold tracking-tight text-white">Satah Platform Admin</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            App Dashboard
          </Button>
          <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

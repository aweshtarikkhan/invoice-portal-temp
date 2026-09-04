import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/shared/SEO";
import { Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/logo.png";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [employeeBlocked, setEmployeeBlocked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmployeeBlocked(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      // Check if user is an organization member (admin/owner) first
      const { data: memberCheck } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1);

      const isOrgMember = memberCheck && memberCheck.length > 0;

      // Also check if user has org_id on profile
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const hasOrgId = profileCheck?.org_id;

      // Only block if user is a pure employee (not an org member/owner)
      if (!isOrgMember && !hasOrgId) {
        const { data: empRecord } = await (supabase as any)
          .from("employees")
          .select("id")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();

        if (empRecord) {
          await supabase.auth.signOut();
          setEmployeeBlocked(true);
          return;
        }
      }

      // Check if user is a platform admin
      const { data: isAdmin } = await supabase
        .rpc("is_platform_admin", { check_user_id: data.user.id });

      if (isAdmin === true) {
        navigate("/platform-admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  };

  if (employeeBlocked) {
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
              href="https://attendance.Assay Bizinvoice.com/"
              target="_blank"
              rel="noreferrer"
              className="block w-full"
            >
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5">
                Click here to login
              </Button>
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground mt-2"
              onClick={() => setEmployeeBlocked(false)}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="Sign In" description="Sign in to Assay Biz Invoices to manage your invoices, clients and payments." path="/login" />
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoImg} alt="Assay Biz Invoices" width={80} height={80} fetchPriority="high" decoding="async" className="mx-auto mb-2 h-20 w-20 object-contain" />
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your invoice management account</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
                              <div className="flex items-center justify-center gap-2 w-full mt-4 text-sm text-muted-foreground">
                  <p>Don't have an account?</p>
                  <Link to="/register" className="text-primary font-bold hover:underline">Sign Up</Link>
                </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}


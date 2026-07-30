import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/shared/SEO";
import { Play, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/logo.png";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      // Check if user is an employee / staff account
      const { data: empRecord } = await (supabase as any)
        .from("employees")
        .select("id")
        .or(`auth_user_id.eq.${data.user.id},id.eq.${data.user.id}`)
        .maybeSingle();

      if (empRecord) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Employee / Staff accounts cannot log into the Main Invoice Admin Portal. Please use the Attendance Portal.",
          variant: "destructive",
        });
        return;
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

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      // Call edge function to set up demo account
      const { data, error } = await supabase.functions.invoke("setup-demo");
      if (error) throw error;

      const { email: demoEmail, password: demoPassword } = data;

      // Sign in as demo user
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      if (signInErr) throw signInErr;

      toast({ title: "Welcome to Demo!", description: "Explore all features with sample data." });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Demo setup failed", description: err.message, variant: "destructive" });
    }
    setDemoLoading(false);
  };

  return (
    <>
      <SEO title="Sign In" description="Sign in to Satah Invoices to manage your invoices, clients and payments." path="/login" />
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logoImg} alt="Satah Invoices" width={80} height={80} fetchPriority="high" decoding="async" className="mx-auto mb-2 h-20 w-20 object-contain" />
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
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <Button type="button" variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={handleDemoLogin} disabled={demoLoading}>
              <Play className="h-4 w-4" />
              {demoLoading ? "Setting up demo..." : "Try Demo Account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
      </>
  );
}

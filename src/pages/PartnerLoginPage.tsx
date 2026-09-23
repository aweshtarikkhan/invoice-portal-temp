import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Required", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      // Check if this user is a registered partner
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .select("id, name, is_active")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (!partner) {
        // Not a partner — sign them out and show error
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "This account is not registered as a partner. Please sign up using a referral code.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!partner.is_active) {
        await supabase.auth.signOut();
        toast({
          title: "Account Inactive",
          description: "Your partner account is currently inactive. Please contact the platform admin.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({ title: `Welcome, ${partner.name}!`, description: "Redirecting to your partner dashboard." });
      navigate("/partner-dashboard", { replace: true });
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/partner-portal")}
          className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Partner Portal
        </button>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Partner Login</h1>
          <p className="text-indigo-300 text-sm text-center mb-8">
            Sign in to your partner account
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-indigo-200">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-indigo-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-indigo-300 text-sm">
              Not a partner yet?{" "}
              <button
                onClick={() => navigate("/partner-register")}
                className="text-white underline hover:text-indigo-200"
              >
                Sign up with a referral code
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

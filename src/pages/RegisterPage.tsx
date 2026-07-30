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


export default function RegisterPage() {
  const [email, setEmail] = useState(() => sessionStorage.getItem("reg_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(() => sessionStorage.getItem("reg_otpSent") === "true");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      setLoading(false);
      toast({ title: "Registration failed", description: authError.message, variant: "destructive" });
      return;
    }

    if (authData.user) {
      if (authData.session) {
        toast({ title: "Account created!", description: "Welcome to Satah Invoices" });
        navigate("/admin", { replace: true });
      } else {
        toast({ title: "OTP Sent", description: "Please enter the 6-digit OTP sent to your email." });
        setOtpSent(true);
        sessionStorage.setItem("reg_email", email);
        sessionStorage.setItem("reg_otpSent", "true");
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    setLoading(false);

    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account verified!", description: "Welcome to Satah Invoices" });
      sessionStorage.removeItem("reg_email");
      sessionStorage.removeItem("reg_otpSent");
      navigate("/admin", { replace: true });
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    sessionStorage.removeItem("reg_otpSent");
  };

  return (
    <>
      <SEO title="Create Account" description="Create your free Satah Invoices account and start sending professional GST invoices in minutes." path="/register" />
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logoImg} alt="Satah Invoices" className="mx-auto mb-2 h-20 w-20 object-contain" />
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start managing invoices in minutes</CardDescription>
        </CardHeader>
        {!otpSent ? (
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regEmail">Email</Label>
                <Input id="regEmail" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Verification email may take a few minutes to arrive due to high traffic. Please also check your spam folder.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regPassword">Password</Label>
                <div className="relative">
                  <Input id="regPassword" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input id="otp" type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="text-center text-lg tracking-widest" autoFocus />
                <p className="text-xs text-center text-muted-foreground">We sent a verification code to {email}</p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify Account"}
              </Button>
              <button type="button" onClick={handleBack} className="text-sm text-primary hover:underline">
                Back to registration
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
      </>
  );
}

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(() => sessionStorage.getItem("reset_email") || "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(() => sessionStorage.getItem("reset_sent") === "true");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Request OTP by passing no redirectTo, or just relying on Supabase settings
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      sessionStorage.setItem("reset_email", email);
      sessionStorage.setItem("reset_sent", "true");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Verify OTP first
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    if (verifyError) {
      setLoading(false);
      toast({ title: "Verification failed", description: verifyError.message, variant: "destructive" });
      return;
    }

    // Now update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      toast({ title: "Failed to update password", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully!", description: "You can now sign in with your new password." });
      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_sent");
      navigate("/login", { replace: true });
    }
  };

  const handleBack = () => {
    setSent(false);
    sessionStorage.removeItem("reset_sent");
  };

  return (
    <>
      <SEO title="Forgot Password" description="Reset your Satah Invoices account password securely via email." path="/forgot-password" />
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logoImg} alt="Satah Invoices" className="mx-auto mb-2 h-20 w-20 object-contain" />
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {sent ? "Enter the OTP sent to your email and a new password" : "Enter your email to receive an OTP"}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input id="resetEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                <p className="text-xs text-muted-foreground">Reset email may be delayed by a few minutes due to high server load. Please check your spam folder too.</p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
            </CardFooter>
          </form>
        )}
        {sent && (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input id="otp" type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="text-center text-lg tracking-widest" autoFocus />
                <p className="text-xs text-center text-muted-foreground">We sent a verification code to {email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating password..." : "Set New Password"}
              </Button>
              <button type="button" onClick={handleBack} className="text-sm text-primary hover:underline">
                Back
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
      </>
  );
}

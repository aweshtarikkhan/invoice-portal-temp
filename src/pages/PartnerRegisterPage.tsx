import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";

export default function PartnerRegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    referralCode: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.referralCode) {
      toast({ title: "Required", description: "Email, password and referral code are required.", variant: "destructive" });
      return;
    }

    if (form.password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Validate referral code
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .select("id, name, user_id, is_active, max_users")
        .eq("referral_code", form.referralCode.trim().toUpperCase())
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (!partner) {
        toast({
          title: "Invalid Referral Code",
          description: "This referral code does not exist. Please enter the correct code.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!partner.is_active) {
        toast({
          title: "Inactive Code",
          description: "This referral code is currently inactive. Please contact the platform admin.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (partner.user_id) {
        toast({
          title: "Code Already Used",
          description: "This referral code has already been used by another account.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Step 2: Get or create auth user
      // Strategy: try signIn first (works for ALL existing users — aassaybiz.com or otherwise)
      // If signIn fails, attempt signUp for brand new users.
      let userId: string | null = null;

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signInData?.user) {
        // ✅ Existing user (aassaybiz.com or anywhere) — signed in successfully
        userId = signInData.user.id;
      } else {
        // signIn failed — could be: (a) new user, or (b) wrong password for existing email
        // Try signUp to determine which case it is
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: {
            data: {
              first_name: form.firstName,
              last_name: form.lastName,
              mobile: form.mobile,
            },
          },
        });

        if (signUpError) {
          // signUp also failed — most likely wrong password for an existing account
          toast({
            title: "Authentication Failed",
            description:
              signInError?.message === "Invalid login credentials"
                ? "Incorrect password. If you are already registered on aassaybiz.com, please use your existing password."
                : signInError?.message || signUpError.message || "Could not authenticate. Please check your credentials.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Supabase returns user but with empty identities when email already exists
        // (happens when email confirmation is disabled but user already in system)
        if (signUpData?.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
          // Email already exists but wrong password was provided
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please use your existing aassaybiz.com password.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!signUpData?.user) {
          toast({
            title: "Registration Failed",
            description: "Could not create account. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        userId = signUpData.user.id;
      }

      // Step 3: Link partner record to the user
      const { error: updateError } = await supabase
        .from("partners")
        .update({ user_id: userId })
        .eq("id", partner.id);

      if (updateError) {
        console.error("Partner link failed:", updateError);
        toast({
          title: "Linking Failed",
          description: "Account created but could not be linked to partner record. Please contact admin.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Sign out so they log in fresh via partner login
      await supabase.auth.signOut();

      setStep("success");
      toast({ title: "Registration Successful!", description: "Your partner account is ready. Please log in." });
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-center shadow-2xl">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
          <p className="text-indigo-300 mb-8">
            Your partner account has been successfully created. Log in to access your dashboard.
          </p>
          <Button
            onClick={() => navigate("/partner-login")}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold h-11"
          >
            Go to Partner Login
          </Button>
        </div>
      </div>
    );
  }

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

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Partner Sign Up</h1>
          <p className="text-indigo-300 text-sm text-center mb-1">
            Create your partner account using a referral code.
          </p>
          <p className="text-indigo-400 text-xs text-center mb-8">
            Already registered on aassaybiz.com? Use the same email & password.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-indigo-200 text-sm">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Rahul"
                  className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400"
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-indigo-200 text-sm">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Sharma"
                  className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-indigo-200 text-sm">
                Email Address <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="rahul@example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="mobile" className="text-indigo-200 text-sm">
                Mobile Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                value={form.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                placeholder="9876543210"
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-indigo-200 text-sm">
                Password <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
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
              <p className="text-indigo-400 text-xs">
                If already registered on aassaybiz.com, use your existing password.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="referralCode" className="text-indigo-200 text-sm">
                Referral Code <span className="text-red-400">*</span>
              </Label>
              <Input
                id="referralCode"
                value={form.referralCode}
                onChange={(e) => handleChange("referralCode", e.target.value.toUpperCase())}
                placeholder="e.g. PART-ABC123"
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 focus:border-indigo-400 font-mono tracking-wider"
                disabled={loading}
              />
              <p className="text-indigo-400 text-xs">
                Enter the referral code provided by the platform admin.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold h-11 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Activate Partner Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-indigo-300 text-sm">
              Already a partner?{" "}
              <button
                onClick={() => navigate("/partner-login")}
                className="text-white underline hover:text-indigo-200"
              >
                Log in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

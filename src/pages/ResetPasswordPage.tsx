import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PublicHeader } from "@/components/public/PublicHeader";
import logoImg from "@/assets/logo.png";
import { Eye, EyeOff, Lock, User, Phone, CheckCircle2, ShieldCheck, ArrowRight, Loader2, ShieldAlert, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [isInvite, setIsInvite] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserName, setExistingUserName] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  // Invite-specific profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const evaluateSession = async (currentSession: any, linkType: string | null) => {
    if (!currentSession?.user) {
      setReady(true);
      return;
    }
    const user = currentSession.user;

    if (user.email) {
      setInviteEmail(user.email);
    }

    // If this is an explicit password recovery flow, let them set their password
    if (linkType === "recovery") {
      setIsInvite(false);
      setReady(true);
      return;
    }

    try {
      // Check if user already has an active profile with first_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const existingFirst = profile?.first_name || user.user_metadata?.first_name;
      const existingLast = profile?.last_name || user.user_metadata?.last_name;
      const hasSignedInBefore = Boolean(user.last_sign_in_at);

      if (existingFirst) {
        setFirstName(existingFirst);
      }
      if (existingLast) {
        setLastName(existingLast);
      }
      if (profile?.phone || user.user_metadata?.phone) {
        setMobile(profile?.phone || user.user_metadata?.phone);
      }

      // If user has already registered or completed setup before,
      // don't ask for name & password again — grant direct access!
      if (existingFirst || hasSignedInBefore) {
        setIsExistingUser(true);
        setExistingUserName(existingFirst || "there");
        setReady(true);
      } else {
        // First-time invited user: prompt for name, mobile, and password
        setIsInvite(true);
        setReady(true);
      }
    } catch (err) {
      console.error("Error evaluating user session:", err);
      setReady(true);
    }
  };

  useEffect(() => {
    const hash = window.location.hash || "";
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);

    // 1. Check for explicit error parameters (e.g. otp_expired, access_denied)
    const errorParam = hashParams.get("error") || searchParams.get("error");
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
    const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");

    if (errorParam || errorCode) {
      const cleanDesc = errorDesc
        ? decodeURIComponent(errorDesc.replace(/\+/g, " "))
        : "This invitation or password reset link has expired or has already been used.";
      setLinkError(cleanDesc);
      setReady(true);
      return;
    }

    // 2. Check for token_hash in search params or hash (bulletproof direct verifyOtp flow)
    const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
    const linkType = searchParams.get("type") || hashParams.get("type") || "recovery";

    if (tokenHash) {
      if (linkType === "invite" || linkType.includes("invite")) {
        setIsInvite(true);
      }

      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: linkType as any,
      }).then(({ data, error }) => {
        if (error) {
          setLinkError(error.message || "This invitation or reset link has expired or is invalid.");
          setReady(true);
        } else if (data?.session) {
          evaluateSession(data.session, linkType);
        } else {
          setReady(true);
        }
      }).catch((err) => {
        setLinkError(err?.message || "Failed to verify invitation link.");
        setReady(true);
      });
      return;
    }

    // 3. Check for hash tokens (legacy redirect flow)
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (type === "invite" || hash.includes("type=invite")) {
      setIsInvite(true);
    }

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data: { session } }) => {
          evaluateSession(session, type);
        })
        .catch(() => setReady(true));
    } else {
      // Check existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          evaluateSession(session, type);
        } else {
          setLinkError("No active invitation or reset link found. Please request a new link.");
          setReady(true);
        }
      });
    }

    // Also listen to auth changes (when token exchange finishes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setInviteEmail(session.user.email);
        setLinkError(null);
      }
      if (event === "PASSWORD_RECOVERY") {
        setIsInvite(false);
        setReady(true);
      } else if (event === "SIGNED_IN") {
        evaluateSession(session, type);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isInvite && !firstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter your first name to complete account setup.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please make sure both passwords match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Validate active auth session before updating
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Session Expired",
          description: "Your session has expired or is invalid. Please request a new invitation or password reset link.",
          variant: "destructive",
        });
        setLinkError("Session expired. Please request a new invitation or password reset link.");
        setLoading(false);
        return;
      }

      // 1. Update password & user metadata
      const updatePayload: any = { password };
      if (isInvite) {
        updatePayload.data = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: mobile.trim() || undefined,
        };
      }

      const { data: updatedUser, error: pwError } = await supabase.auth.updateUser(updatePayload);

      if (pwError) {
        throw pwError;
      }

      // 2. If invite, update profile record in database
      if (isInvite) {
        const userId = updatedUser?.user?.id;
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              first_name: firstName.trim(),
              last_name: lastName.trim() || null,
              ...(mobile.trim() ? { phone: mobile.trim() } : {}),
            })
            .eq("user_id", userId);
        }
      }

      toast({
        title: isInvite ? "Account Activated!" : "Password Updated!",
        description: isInvite
          ? "Your profile has been created successfully. Welcome aboard!"
          : "Your password has been changed successfully.",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800);

    } catch (err: any) {
      toast({
        title: "Setup Failed",
        description: err.message || "Failed to update your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto" />
            <p className="text-slate-600 font-medium">Verifying invitation link...</p>
          </div>
        </main>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-grow flex items-center justify-center px-4 py-10 sm:py-16">
          <div className="w-full max-w-md">
            <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white">
              <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-orange-500" />
              <CardHeader className="text-center pt-8 pb-4 px-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-red-600 shadow-sm">
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Link Expired or Invalid
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-2">
                  {linkError}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-2 text-center text-xs text-slate-500 space-y-2">
                <p>
                  Security links are single-use only. If you have already used this link or if it has expired, you can easily request a new one below.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2.5 p-6 pt-4">
                <Button 
                  onClick={() => navigate("/forgot-password")}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg shadow-sm"
                >
                  Request Password Reset
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 font-medium py-2.5 rounded-lg"
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">
          <Card className="border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            
            {/* Header Accent Bar */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500" />

            <CardHeader className="text-center pt-8 pb-6 px-6 sm:px-10">
              {/* Logo */}
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm p-3">
                <img
                  src={logoImg}
                  alt="Aassay Biz"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mx-auto mb-3 border ${
                isExistingUser
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-100"
              }`}>
                {isExistingUser ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                )}
                {isExistingUser
                  ? "Workspace Access Granted"
                  : isInvite
                  ? "Platform Access Invitation"
                  : "Secure Password Reset"}
              </div>

              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                {isExistingUser
                  ? `Welcome Back, ${existingUserName}!`
                  : isInvite
                  ? "Welcome to Aassay Biz"
                  : "Set Your New Password"}
              </CardTitle>

              <CardDescription className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                {!ready ? (
                  <span className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Verifying invitation credentials...
                  </span>
                ) : isExistingUser ? (
                  "You are already registered on Aassay Biz. Your new business workspace has been linked to your account."
                ) : isInvite ? (
                  "Complete your personal details and set your password to activate your workspace access."
                ) : (
                  "Enter and confirm your new secure password below to regain access."
                )}
              </CardDescription>
            </CardHeader>

            {ready && isExistingUser ? (
              <CardContent className="space-y-6 px-6 sm:px-10 py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-900">Details Already Submitted</h4>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    You have already submitted your details. Please login with your details. If you forgot the details, please reset your password then login.
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-colors"
                  >
                    <span>Login</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="w-full h-11 text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <span>Forgot Password</span>
                  </Button>
                </div>
              </CardContent>
            ) : ready && (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 px-6 sm:px-10">
                  
                  {/* Email Field - Always Locked */}
                  <div className="space-y-1.5">
                    <Label htmlFor="inviteEmail" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail || "Loading email..."}
                        readOnly
                        disabled
                        className="bg-slate-100/80 border-slate-200 text-slate-600 font-medium cursor-not-allowed pr-10 h-11"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 text-xs">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      This is your registered account email and cannot be edited.
                    </p>
                  </div>

                  {/* Profile Details for Invites */}
                  {isInvite && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* First Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700">
                            First Name <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="e.g. Rahul"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              autoFocus
                              className="h-11 pl-9"
                            />
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="e.g. Sharma"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="h-11"
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="space-y-1.5">
                        <Label htmlFor="mobile" className="text-xs font-semibold text-slate-700">
                          Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="h-11 pl-9"
                          />
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Section */}
                  <div className="space-y-4 pt-1 border-t border-slate-100">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-700">
                        {isInvite ? "Create Password" : "New Password"} <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                        Confirm Password <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security requirements checklist */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${password.length >= 8 ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>At least 8 characters long</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${password && password === confirmPassword ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>Passwords match</span>
                    </div>
                  </div>

                </CardContent>

                <CardFooter className="flex-col gap-3 pt-2 pb-8 px-6 sm:px-10">
                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving & Activating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {isInvite ? "Complete Setup & Launch Platform" : "Save New Password"}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <div className="text-center mt-2">
                    <Link
                      to="/login"
                      className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                    >
                      Already have your credentials? Sign In
                    </Link>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

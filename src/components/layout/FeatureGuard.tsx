import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import { useFeatureStore } from "@/store/feature-store";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Send, CheckCircle2 } from "lucide-react";

interface FeatureGuardProps {
  children?: ReactNode;
  featureKey: string;
  featureName: string;
}

export function FeatureGuard({ children, featureKey, featureName }: FeatureGuardProps) {
  const { enabledGroups, isAdmin, teamMembers, isGroupEnabled } = useFeatureStore();
  const { session } = useAuth();
  const org = useAppStore((s) => s.organization);
  
  const [requestSent, setRequestSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const currentUserEmail = session?.user?.email?.toLowerCase().trim();
  const isUserAdmin = isAdmin(currentUserEmail);
  const currentOrgId = org?.id || "default";
  
  const currentTeamMember = !isUserAdmin ? (teamMembers[currentOrgId] || []).find(m => m.email === currentUserEmail) : null;
  const userPermissions = currentTeamMember?.permissions || [];

  const isAccessible = () => {
    // System settings are always available
    if (["system"].includes(featureKey)) return true;
    
    // Feature must be enabled in org subscription
    const isEnabledForOrg = isGroupEnabled(featureKey);
    
    // Admins always have access to org-enabled features
    if (isUserAdmin) return isEnabledForOrg;
    
    // User must have permission (if they are a team member)
    const hasPermission = isUserAdmin || 
      !teamMembers[currentOrgId]?.length || 
      userPermissions.includes(featureKey);

    return isEnabledForOrg && hasPermission;
  };

  if (isAccessible()) {
    return children ? <>{children}</> : <Outlet />;
  }

  const handleRequestAccess = async () => {
    if (!org?.id || !session?.user?.id) return;
    
    setSubmitting(true);
    try {
      await supabase.from("feature_requests").insert({
        org_id: org.id,
        user_id: session.user.id,
        user_email: session.user.email,
        feature_name: featureName,
        message: message.trim() || `Requested access to ${featureName}`,
        status: "pending"
      });
      setRequestSent(true);
    } catch (err) {
      console.error("Failed to submit request", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Feature Locked</CardTitle>
          <CardDescription className="text-base">
            You don't have proper rights to use <span className="font-semibold text-foreground">{featureName}</span>.
            This feature may be disabled for your business plan, or you lack the necessary permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {requestSent ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Request Sent Successfully!</p>
                <p className="text-sm mt-1">Our team has received your request. We will contact the business owner shortly.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Message (Optional)
                </label>
                <Textarea 
                  placeholder="Why do you need this feature?" 
                  className="resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
        {!requestSent && (
          <CardFooter>
            <Button 
              className="w-full gap-2" 
              onClick={handleRequestAccess}
              disabled={submitting}
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Request Access
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

export function TrialBanner({ onUpgrade }: { onUpgrade: () => void }) {
  const { isOnTrial, isTrialExpired, trialDaysLeft } = useSubscription();

  if (!isOnTrial && !isTrialExpired) return null;

  if (isTrialExpired) {
    return (
      <div className="bg-destructive/15 border-b border-destructive/30 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-destructive font-semibold">
          <AlertTriangle className="h-4 w-4" />
          <span>Your trial has expired. Access to premium features is currently restricted.</span>
        </div>
        <Button size="sm" variant="destructive" onClick={onUpgrade}>
          Upgrade Now
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-900/50 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
        <Clock className="h-4 w-4" />
        <span>You have {trialDaysLeft} days left in your free trial.</span>
      </div>
      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onUpgrade}>
        View Plans
      </Button>
    </div>
  );
}

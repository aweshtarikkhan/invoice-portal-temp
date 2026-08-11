import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";

export function SubscriptionBadge() {
  const { subscriptionPlan, subscriptionStatus, isOnTrial, trialDaysLeft } = useSubscription();

  if (!subscriptionPlan) return null;

  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let label = subscriptionPlan.toUpperCase();

  if (subscriptionStatus === "active") {
    variant = "default";
  } else if (isOnTrial) {
    variant = "secondary";
    label = `${label} TRIAL (${trialDaysLeft}d left)`;
  } else if (subscriptionStatus === "expired") {
    variant = "destructive";
    label = "EXPIRED";
  }

  return (
    <Badge variant={variant} className="text-xs font-semibold tracking-wider">
      {label}
    </Badge>
  );
}

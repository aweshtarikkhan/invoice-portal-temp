import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/** Get an existing portal token or create one for the given entity. */
export async function getOrCreatePortalToken(
  orgId: string,
  entityType: "invoice" | "estimate" | "credit_note",
  entityId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("portal_tokens")
    .select("token")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  if (existing?.token) return existing.token;

  const { data, error } = await supabase
    .from("portal_tokens")
    .insert({ org_id: orgId, entity_type: entityType, entity_id: entityId })
    .select("token")
    .single();
  if (error) {
    console.error("Failed to create portal token:", error);
    toast({ title: "Portal Token Error", description: error.message, variant: "destructive" });
    return null;
  }
  return data?.token ?? null;
}

/** Build the public portal URL for a token. */
export function portalUrl(token: string): string {
  return `${window.location.origin}/portal/${token}`;
}


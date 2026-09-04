import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSocials {
  youtube: string;
  facebook: string;
  instagram: string;
  phone?: string;
}

export const DEFAULT_PLATFORM_SOCIALS: PlatformSocials = {
  youtube: "https://www.youtube.com/@assaybiz",
  facebook: "https://www.facebook.com/assaybiz",
  instagram: "https://www.instagram.com/assaybiz",
  phone: ""
};

/**
 * Normalizes input handle/URL into a full clickable URL.
 * Supports inputs like "@assaybiz", "assaybiz", or "https://..."
 */
export function formatSocialUrl(type: "youtube" | "facebook" | "instagram", value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "");
  switch (type) {
    case "youtube":
      return `https://www.youtube.com/@${clean}`;
    case "facebook":
      return `https://www.facebook.com/${clean}`;
    case "instagram":
      return `https://www.instagram.com/${clean}`;
  }
}

/**
 * Saves platform socials to Supabase.
 * Updates the __platform_socials__ record in portal_ads and also syncs platform_settings if available.
 */
export async function savePlatformSocials(socials: PlatformSocials): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify(socials);

    // 1. Upsert into portal_ads (guaranteed RLS permissions)
    const { data: existing } = await supabase
      .from("portal_ads")
      .select("id")
      .eq("title", "__platform_socials__")
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("portal_ads")
        .update({ link_url: payload })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("portal_ads")
        .insert([{
          title: "__platform_socials__",
          image_url: "https://placehold.co/100?text=Socials",
          link_url: payload,
          is_active: false,
          sort_order: 9999
        }]);
      if (error) throw error;
    }

    // 2. Best-effort update to platform_settings via RPC
    try {
      if (socials.youtube) await supabase.rpc("update_platform_setting", { p_key: "social_youtube", p_value: socials.youtube });
      if (socials.facebook) await supabase.rpc("update_platform_setting", { p_key: "social_facebook", p_value: socials.facebook });
      if (socials.instagram) await supabase.rpc("update_platform_setting", { p_key: "social_instagram", p_value: socials.instagram });
      if (socials.phone) await supabase.rpc("update_platform_setting", { p_key: "social_phone", p_value: socials.phone });
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save social links" };
  }
}

/**
 * Hook to consume official AssayBiz social media handles anywhere in the app.
 */
export function usePlatformSocials() {
  const [socials, setSocials] = useState<PlatformSocials>(DEFAULT_PLATFORM_SOCIALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSocials() {
      try {
        // Try reading from portal_ads config
        const { data: adConfig } = await supabase
          .from("portal_ads")
          .select("link_url")
          .eq("title", "__platform_socials__")
          .maybeSingle();

        if (adConfig?.link_url) {
          try {
            const parsed = JSON.parse(adConfig.link_url);
            if (isMounted) {
              setSocials({
                youtube: parsed.youtube || DEFAULT_PLATFORM_SOCIALS.youtube,
                facebook: parsed.facebook || DEFAULT_PLATFORM_SOCIALS.facebook,
                instagram: parsed.instagram || DEFAULT_PLATFORM_SOCIALS.instagram,
                phone: parsed.phone || ""
              });
              setLoading(false);
              return;
            }
          } catch (e) {}
        }

        // Fallback: check individual platform_settings
        const { data: settingsData } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", ["social_youtube", "social_facebook", "social_instagram", "social_phone"]);

        if (settingsData && settingsData.length > 0) {
          const map: Record<string, string> = {};
          settingsData.forEach(s => { map[s.key] = s.value; });
          if (isMounted) {
            setSocials({
              youtube: map.social_youtube || DEFAULT_PLATFORM_SOCIALS.youtube,
              facebook: map.social_facebook || DEFAULT_PLATFORM_SOCIALS.facebook,
              instagram: map.social_instagram || DEFAULT_PLATFORM_SOCIALS.instagram,
              phone: map.social_phone || ""
            });
          }
        }
      } catch (err) {
        // Network or offline: keep defaults
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSocials();
    return () => { isMounted = false; };
  }, []);

  return {
    socials,
    loading,
    formatSocialUrl: (type: "youtube" | "facebook" | "instagram") => formatSocialUrl(type, socials[type])
  };
}

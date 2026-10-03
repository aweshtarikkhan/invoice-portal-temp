import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:8000";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Helper: Calculate SHA-256 hash in hex
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Clean PostgREST style operator (e.g., "eq.new" -> "new")
function stripFilterOperator(val: string | null): string | null {
  if (!val) return null;
  return val.replace(/^(eq\.|neq\.|ilike\.|like\.|gt\.|gte\.|lt\.|lte\.)/i, "").trim();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // 1. Extract API Key
    let apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("apikey") ||
      url.searchParams.get("apikey");

    if (!apiKey) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        apiKey = authHeader.substring(7).trim();
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "API key is required. Pass via 'apikey' or 'x-api-key' header, or 'Authorization: Bearer <key>'.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate API Key
    const keyHash = await sha256(apiKey);

    let { data: keyRecord } = await supabase
      .from("org_api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .maybeSingle();

    // Fallback: match by preview if key_hash is legacy or initial
    if (!keyRecord && apiKey.startsWith("sk_live_")) {
      const suffix = apiKey.slice(-4);
      const { data: matchedKeys } = await supabase
        .from("org_api_keys")
        .select("*")
        .ilike("preview", `%${suffix}`);

      if (matchedKeys && matchedKeys.length > 0) {
        const found = matchedKeys.find((k: any) => {
          const prev = k.preview || "";
          return apiKey.startsWith(prev.substring(0, 16)) && apiKey.endsWith(prev.slice(-4));
        });
        if (found) {
          keyRecord = found;
          // Upgrade hash in database
          await supabase.from("org_api_keys").update({ key_hash: keyHash }).eq("id", found.id);
        }
      }
    }

    if (!keyRecord) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid API key. Please check your credentials in the CRM Integrations dashboard.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update last_used_at in background
    supabase
      .from("org_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRecord.id)
      .then();

    const orgId = keyRecord.org_id;

    // 3. Routing
    const pathParts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    // path could be:
    // ["crm-api", "leads"] or ["functions", "v1", "crm-api", "leads"] or ["leads"] or ["rest", "v1", "leads"]
    const resourceIdx = pathParts.findIndex((p) => p === "leads");
    const isLeads = resourceIdx !== -1;
    const subId = isLeads && pathParts.length > resourceIdx + 1 ? pathParts[resourceIdx + 1] : null;

    // --- GET LEADS ---
    if (req.method === "GET") {
      if (subId) {
        // Fetch single lead
        const { data: lead, error } = await supabase
          .from("leads")
          .select("*")
          .eq("id", subId)
          .eq("org_id", orgId)
          .maybeSingle();

        if (error) throw error;
        if (!lead) {
          return new Response(JSON.stringify({ error: "Lead not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(lead), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch list of leads
      const statusParam = stripFilterOperator(url.searchParams.get("status"));
      const phoneParam = stripFilterOperator(url.searchParams.get("phone"));
      const emailParam = stripFilterOperator(url.searchParams.get("email"));
      const sourceParam = stripFilterOperator(url.searchParams.get("source"));
      const priorityParam = stripFilterOperator(url.searchParams.get("priority"));
      const searchParam = url.searchParams.get("search") || url.searchParams.get("q");

      const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 200);
      const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

      // Order param e.g. "created_at.desc" or "name.asc"
      const orderRaw = url.searchParams.get("order") || url.searchParams.get("sort") || "created_at.desc";
      const [orderCol, orderDir] = orderRaw.split(".");
      const isAsc = (orderDir || "").toLowerCase() === "asc";

      let query = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("org_id", orgId);

      if (statusParam) query = query.eq("status", statusParam);
      if (phoneParam) query = query.eq("phone", phoneParam);
      if (emailParam) query = query.ilike("email", emailParam);
      if (sourceParam) query = query.eq("source", sourceParam);
      if (priorityParam) query = query.eq("priority", priorityParam);

      if (searchParam) {
        query = query.or(
          `name.ilike.%${searchParam}%,company.ilike.%${searchParam}%,phone.ilike.%${searchParam}%,email.ilike.%${searchParam}%`
        );
      }

      const validOrderCols = ["created_at", "updated_at", "name", "estimated_value", "status", "priority"];
      const finalOrderCol = validOrderCols.includes(orderCol) ? orderCol : "created_at";

      query = query.order(finalOrderCol, { ascending: isAsc }).range(offset, offset + limit - 1);

      const { data: leads, count, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(leads || []), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Range": `${offset}-${offset + (leads?.length || 0)}/${count || 0}`,
          "X-Total-Count": String(count || 0),
        },
      });
    }

    // --- POST LEADS (CREATE / INGEST) ---
    if (req.method === "POST") {
      let body: any;
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        body = {};
        for (const [k, v] of formData.entries()) {
          body[k] = v;
        }
      } else {
        // Fallback try json
        try {
          body = await req.json();
        } catch {
          body = {};
        }
      }

      const isArray = Array.isArray(body);
      const rawLeads = isArray ? body : [body];

      if (rawLeads.length === 0) {
        return new Response(JSON.stringify({ error: "Empty request payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const formattedLeads = rawLeads.map((item: any) => {
        const name = (item.name || item.lead_name || item.full_name || "New Lead").trim();
        const validStatuses = ["new", "contacted", "qualified", "converted", "lost"];
        const status = validStatuses.includes(item.status) ? item.status : "new";
        const validPriorities = ["hot", "warm", "cold"];
        const priority = validPriorities.includes(item.priority) ? item.priority : "warm";

        return {
          org_id: orgId,
          name,
          phone: item.phone || item.mobile || null,
          email: item.email || null,
          company: item.company || item.business_name || null,
          source: item.source || "API",
          status,
          priority,
          estimated_value: Number(item.estimated_value || item.deal_value || 0),
          notes: item.notes || item.message || null,
          tags: Array.isArray(item.tags) ? item.tags : item.tags ? [String(item.tags)] : [],
        };
      });

      const { data: inserted, error: insertError } = await supabase
        .from("leads")
        .insert(formattedLeads)
        .select();

      if (insertError) throw insertError;

      const responsePayload = isArray ? inserted : inserted?.[0] || null;

      return new Response(JSON.stringify(responsePayload), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- PATCH / PUT (UPDATE LEAD) ---
    if (req.method === "PATCH" || req.method === "PUT") {
      if (!subId) {
        return new Response(JSON.stringify({ error: "Missing lead ID in URL path" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      delete body.id;
      delete body.org_id; // prevent tenant escalation
      delete body.created_at;

      const { data: updated, error } = await supabase
        .from("leads")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", subId)
        .eq("org_id", orgId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!updated) {
        return new Response(JSON.stringify({ error: "Lead not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DELETE LEAD ---
    if (req.method === "DELETE") {
      if (!subId) {
        return new Response(JSON.stringify({ error: "Missing lead ID in URL path" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", subId)
        .eq("org_id", orgId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Lead deleted successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Method ${req.method} not allowed` }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("CRM API Error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: err.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

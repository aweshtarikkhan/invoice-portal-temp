import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();

    if (payload.type !== "email.received") {
      return new Response("Not an email.received event", { status: 200 });
    }

    const emailData = payload.data;
    const fromEmail = emailData.from; // e.g. "Name <email@domain.com>"
    const toEmails = emailData.to;
    const subject = emailData.subject;
    const textBody = emailData.text;
    const htmlBody = emailData.html;
    const resendAttachments = emailData.attachments || [];

    // Extract actual email address from "Name <email@domain.com>"
    const fromMatch = fromEmail.match(/<([^>]+)>/);
    const cleanFromEmail = fromMatch ? fromMatch[1] : fromEmail;
    
    // We'll use the first 'to' address for matching
    const firstToEmail = toEmails && toEmails.length > 0 ? toEmails[0] : "";
    const toMatch = firstToEmail.match(/<([^>]+)>/);
    const cleanToEmail = toMatch ? toMatch[1] : firstToEmail;

    // --- 1. Find Organization ID ---
    let orgId = null;

    // Try finding a client that matches the sender
    const { data: client } = await supabase
      .from('clients')
      .select('organization_id')
      .eq('email', cleanFromEmail)
      .limit(1)
      .single();
    
    if (client) {
      orgId = client.organization_id;
    } else {
      // Try finding a vendor that matches the sender
      const { data: vendor } = await supabase
        .from('vendors')
        .select('organization_id')
        .eq('email', cleanFromEmail)
        .limit(1)
        .single();
      
      if (vendor) {
        orgId = vendor.organization_id;
      } else {
        // Fallback: Just grab the first organization (assuming single-tenant or main org)
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        
        if (org) {
          orgId = org.id;
        }
      }
    }

    if (!orgId) {
      console.error("Could not determine organization for inbound email.");
      return new Response("Could not determine organization", { status: 400 });
    }

    // --- 2. Process Attachments ---
    const processedAttachments = [];

    for (const att of resendAttachments) {
      if (att.content && att.filename) {
        try {
          const fileBytes = decode(att.content);
          
          const fileExt = att.filename.split('.').pop();
          const uniqueFilename = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${orgId}/${uniqueFilename}`;
          
          const { data, error } = await supabase.storage
            .from('email_attachments')
            .upload(filePath, fileBytes, {
              contentType: att.content_type || 'application/octet-stream',
              upsert: false
            });
            
          if (error) throw error;
          
          const { data: publicUrlData } = supabase.storage
            .from('email_attachments')
            .getPublicUrl(filePath);
            
          processedAttachments.push({
            filename: att.filename,
            content_type: att.content_type,
            url: publicUrlData.publicUrl
          });
        } catch (err) {
          console.error("Failed to upload attachment:", att.filename, err);
        }
      }
    }

    // --- 3. Save to emails table ---
    const { error: insertError } = await supabase
      .from('emails')
      .insert({
        org_id: orgId,
        direction: 'inbound',
        from_email: cleanFromEmail,
        to_email: cleanToEmail,
        subject: subject,
        body_text: textBody,
        body_html: htmlBody,
        attachments: processedAttachments,
        status: 'received'
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

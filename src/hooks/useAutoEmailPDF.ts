import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_TEMPLATES } from "@/components/email/emailTemplates";
import { getOrCreatePortalToken, portalUrl } from "@/lib/share";

interface AutoEmailProps {
  entityType: "invoice" | "estimate" | "po" | "bill";
  entityData: any;
  generatePDFBlob: () => Promise<Blob | null>;
}

export function useAutoEmailPDF({ entityType, entityData, generatePDFBlob }: AutoEmailProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();

  useEffect(() => {
    const sendEmailAuto = async () => {
      if (searchParams.get("sendEmail") === "true" && entityData && org) {
        // Clear param immediately to prevent loops
        setSearchParams((params) => {
          params.delete("sendEmail");
          return params;
        });

        try {
          toast({ title: "Generating PDF for email..." });
          
          // Generate PDF Blob
          const pdfBlob = await generatePDFBlob();
          if (!pdfBlob) throw new Error("Could not generate PDF");

          // Convert to Base64
          const base64data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = () => {
              resolve((reader.result as string).split(',')[1]);
            };
          });
          
          // Get email template
          let htmlTemplate = DEFAULT_TEMPLATES[entityType]?.html || "";
          let subjectTemplate = DEFAULT_TEMPLATES[entityType]?.subject || "";
          
          const { data: templates } = await supabase
            .from("email_templates")
            .select("*")
            .eq("org_id", org.id)
            .eq("type", entityType)
            .eq("is_default", true)
            .maybeSingle();
            
          if (templates) {
            htmlTemplate = templates.body_html_template;
            subjectTemplate = templates.subject_template;
          }

          // Get portal token if supported (Invoice, Estimate)
          let pLink = "";
          if (entityType === "invoice" || entityType === "estimate") {
            const token = await getOrCreatePortalToken(org.id, entityType, entityData.id);
            if (token) pLink = portalUrl(token);
          }

          // Replace variables
          const getNumber = () => {
             if (entityType === "invoice") return entityData.invoice_number;
             if (entityType === "estimate") return entityData.estimate_number;
             if (entityType === "po") return entityData.po_number;
             if (entityType === "bill") return entityData.bill_number;
             return "";
          };
          
          const getClientEmail = () => {
             if (entityType === "po" || entityType === "bill") return entityData.vendors?.email;
             return entityData.clients?.email;
          };
          
          const getClientName = () => {
             if (entityType === "po" || entityType === "bill") return entityData.vendors?.name || entityData.vendors?.display_name || "Vendor";
             return entityData.clients?.display_name || "Client";
          };

          const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

          const vars = {
            "{{client_name}}": getClientName(),
            "{{vendor_name}}": getClientName(),
            "{{client_email}}": getClientEmail() || "",
            "{{company_name}}": org.name || "Our Company",
            "{{company_email}}": org.email || "",
            "{{invoice_number}}": getNumber(),
            "{{estimate_number}}": getNumber(),
            "{{po_number}}": getNumber(),
            "{{bill_number}}": getNumber(),
            "{{due_date}}": entityData.due_date || "",
            "{{invoice_date}}": entityData.date || "",
            "{{date}}": entityData.date || "",
            "{{total_amount}}": fmt(Number(entityData.total)),
            "{{payment_link}}": pLink,
            "{{portal_link}}": pLink
          };

          let compiledHtml = htmlTemplate;
          let compiledSubject = subjectTemplate;
          for (const [key, val] of Object.entries(vars)) {
             compiledHtml = compiledHtml.replace(new RegExp(key, 'g'), val);
             compiledSubject = compiledSubject.replace(new RegExp(key, 'g'), val);
          }
          
          const recipientEmail = getClientEmail();
          if (!recipientEmail) {
             throw new Error(`No email address found for this ${entityType}`);
          }

          // Send via send-custom-email
          const { data, error } = await supabase.functions.invoke("send-custom-email", {
            body: {
              to: recipientEmail,
              subject: compiledSubject,
              html: compiledHtml,
              orgId: org.id,
              attachments: [
                {
                  filename: `${getNumber()}.pdf`,
                  content: base64data,
                  content_type: "application/pdf"
                }
              ]
            }
          });

          if (error) throw error;
          toast({ title: "Email sent successfully with PDF attached!" });
        } catch (err: any) {
          toast({ title: "Failed to send email", description: err.message, variant: "destructive" });
        }
      }
    };
    sendEmailAuto();
  }, [searchParams, entityData, org, generatePDFBlob, setSearchParams, toast, entityType]);
}

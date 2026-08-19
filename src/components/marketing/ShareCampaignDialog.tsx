import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { toast } from "@/hooks/use-toast";

interface ShareCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posterDataUrl: string | null;
  festivalName: string;
}

export function ShareCampaignDialog({ open, onOpenChange, posterDataUrl, festivalName }: ShareCampaignDialogProps) {
  const org = useAppStore((s) => s.organization);
  const [clients, setClients] = useState<any[]>([]);
  const [clientsWithInvoices, setClientsWithInvoices] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);

  const [emailSubject, setEmailSubject] = useState(`Happy ${festivalName} from ${org?.name || "us"}!`);
  const [emailBody, setEmailBody] = useState(`Wishing you a very Happy ${festivalName}!\n\nPlease find our greetings attached.\n\nBest Regards,\n${org?.name || "Team"}`);
  const [whatsappMessage, setWhatsappMessage] = useState(`Wishing you a very Happy ${festivalName} from ${org?.name || "our team"}! Check out our poster: `);

  useEffect(() => {
    if (open && org?.id) {
      fetchClients();
    }
  }, [open, org?.id]);

  useEffect(() => {
    setEmailSubject(`Happy ${festivalName} from ${org?.name || "us"}!`);
    setEmailBody(`Wishing you a very Happy ${festivalName}!\n\nPlease find our greetings attached.\n\nBest Regards,\n${org?.name || "Team"}`);
    setWhatsappMessage(`Wishing you a very Happy ${festivalName} from ${org?.name || "our team"}! Check out our poster: `);
  }, [festivalName, org?.name]);

  const fetchClients = async () => {
    setLoading(true);
    
    // Fetch clients
    const { data, error } = await supabase.from("clients").select("id, display_name, email, phone").eq("org_id", org!.id);
    
    // Fetch invoices to see who has them
    const { data: invData } = await supabase.from("invoices").select("client_id").eq("org_id", org!.id);
    
    if (error) {
      toast({ title: "Failed to load clients", description: error.message, variant: "destructive" });
    } else {
      setClients(data || []);
      // Auto select all by default
      setSelectedClients((data || []).map((c: any) => c.id));
      
      const hasInvoiceSet = new Set<string>();
      if (invData) {
        invData.forEach((inv: any) => hasInvoiceSet.add(inv.client_id));
      }
      setClientsWithInvoices(hasInvoiceSet);
    }
    setLoading(false);
  };

  const handleSelectWithInvoices = () => {
    const clientsToSelect = clients.filter(c => clientsWithInvoices.has(c.id)).map(c => c.id);
    setSelectedClients(clientsToSelect);
    if (clientsToSelect.length === 0) {
      toast({ title: "No clients with invoices found." });
    }
  };

  const handleToggleClient = (id: string) => {
    setSelectedClients(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const handleToggleAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const handleSend = async () => {
    if (!org?.id) return;
    if (!posterDataUrl) {
      toast({ title: "No poster image available.", variant: "destructive" });
      return;
    }
    if (selectedClients.length === 0) {
      toast({ title: "Select at least one client.", variant: "destructive" });
      return;
    }
    if (!sendEmail && !sendWhatsapp) {
      toast({ title: "Select at least one method (Email or WhatsApp).", variant: "destructive" });
      return;
    }

    setSending(true);

    const targets = clients.filter(c => selectedClients.includes(c.id));
    let successCount = 0;
    let failCount = 0;

    try {
      const base64Content = posterDataUrl.split(',')[1];
      let uploadedPublicUrl = "";
      let uploadPath = "";

      // Only upload to bucket if whatsapp is selected
      if (sendWhatsapp) {
        const fetchBlob = await fetch(posterDataUrl).then(r => r.blob());
        const safeName = `${festivalName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;
        uploadPath = `${org.id}/marketing/${safeName}`;

        const { error: uploadError } = await supabase.storage.from("org-logos").upload(uploadPath, fetchBlob, {
          contentType: "image/png"
        });

        if (uploadError) {
          throw new Error("Failed to upload image for WhatsApp link: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage.from("org-logos").getPublicUrl(uploadPath);
        uploadedPublicUrl = urlData.publicUrl;
      }

      // Process each client
      await Promise.all(targets.map(async (client) => {
        let clientSuccess = false;
        
        try {
          if (sendEmail && client.email) {
            const { error: emailErr } = await supabase.functions.invoke("send-custom-email", {
              body: {
                orgId: org.id,
                to: client.email,
                subject: emailSubject,
                html: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>`,
                attachments: [
                  {
                    filename: `${festivalName}.png`,
                    content: base64Content,
                    content_type: "image/png"
                  }
                ]
              }
            });
            if (emailErr) throw emailErr;
            clientSuccess = true;
          }

          if (sendWhatsapp && client.phone && uploadedPublicUrl) {
            const baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || "http://localhost:3010/api";
            
            // Normalize phone number (append 91 if 10 digits)
            let normalizedPhone = client.phone.replace(/\D/g, "");
            if (normalizedPhone.length === 10) {
              normalizedPhone = "91" + normalizedPhone;
            }

            const res = await fetch(`${baseUrl}/message/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                org_id: org.id,
                phone: normalizedPhone,
                text: whatsappMessage,
                mediaUrl: uploadedPublicUrl
              })
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || "WhatsApp API Error");
            }
            clientSuccess = true;
          }

          if (clientSuccess) successCount++;
          else failCount++; // if they had no email/phone

        } catch (err: any) {
          console.error("Failed to send to client", client.id, err);
          toast({ title: "Failed to send to " + (client.display_name || client.phone), description: err.message, variant: "destructive" });
          failCount++;
        }
      }));

      // Clean up uploaded image
      if (sendWhatsapp && uploadPath) {
        await supabase.storage.from("org-logos").remove([uploadPath]);
      }

      toast({ 
        title: "Campaign Sent!", 
        description: `Successfully sent to ${successCount} clients. ${failCount > 0 ? `Failed/Skipped: ${failCount}` : ''}`
      });
      onOpenChange(false);

    } catch (err: any) {
      console.error("Campaign error", err);
      toast({ title: "Failed to send campaign", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Share {festivalName} Poster</DialogTitle>
          <DialogDescription>Select clients and delivery methods to distribute your marketing poster.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Clients */}
          <div className="space-y-4 flex flex-col h-[400px]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Select Clients ({selectedClients.length}/{clients.length})</h3>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={handleSelectWithInvoices} className="h-8 text-xs px-2">
                  With Invoices
                </Button>
                <Button variant="ghost" size="sm" onClick={handleToggleAll} className="h-8 text-xs px-2">
                  {selectedClients.length === clients.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto border rounded-md p-2 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading clients...</div>
              ) : clients.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No clients found.</div>
              ) : (
                clients.map((c) => (
                  <div key={c.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                    <Checkbox 
                      id={`client-${c.id}`} 
                      checked={selectedClients.includes(c.id)} 
                      onCheckedChange={() => handleToggleClient(c.id)} 
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor={`client-${c.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {c.display_name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {[c.email, c.phone].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6 h-[400px] overflow-y-auto pr-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Delivery Methods</h3>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="method-email" checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
                  <Label htmlFor="method-email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="method-whatsapp" checked={sendWhatsapp} onCheckedChange={(v) => setSendWhatsapp(!!v)} />
                  <Label htmlFor="method-whatsapp">WhatsApp</Label>
                </div>
              </div>
            </div>

            {sendEmail && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Email Content</h3>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={4} />
                  <p className="text-[10px] text-muted-foreground">The poster will be attached as a PNG file.</p>
                </div>
              </div>
            )}

            {sendWhatsapp && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">WhatsApp Content</h3>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} rows={3} />
                  <p className="text-[10px] text-muted-foreground">A public link to the image will be appended automatically.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || selectedClients.length === 0}>
            {sending ? "Sending..." : "Send Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

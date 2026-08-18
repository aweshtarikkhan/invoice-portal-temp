import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TemplateType = 'invoice' | 'estimate' | 'payment' | 'po';

export function WhatsAppTemplatesTab() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TemplateType>("invoice");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (org) fetchTemplate(activeTab);
  }, [org, activeTab]);

  const fetchTemplate = async (type: TemplateType) => {
    if (!org) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("content")
      .eq("org_id", org.id)
      .eq("type", type)
      .single();

    if (data) {
      setContent(data.content);
    } else {
      setContent("");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!org) return;
    setLoading(true);
    const { error } = await supabase
      .from("whatsapp_templates")
      .upsert(
        { org_id: org.id, type: activeTab, content },
        { onConflict: 'org_id,type' }
      );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Template saved successfully" });
    }
    setLoading(false);
  };

  const resetToDefault = () => {
    let def = "";
    switch (activeTab) {
      case 'invoice':
        def = `Hello [Client Name],\n\nPlease find attached your invoice [Invoice Number] for [Total Amount].\nDue date: [Due Date]\n\nView & pay online: [Portal Link]\n\nThank you for your business!\n[Company Name]`;
        break;
      case 'estimate':
        def = `Hello [Client Name],\n\nPlease find attached our estimate [Estimate Number] for [Total Amount].\n\nView online: [Portal Link]\n\nLet us know if you have any questions!\n[Company Name]`;
        break;
      case 'payment':
        def = `Hello [Client Name],\n\nThank you for your payment of [Total Amount] towards invoice [Invoice Number].\n\nYour payment has been successfully recorded.\n\n[Company Name]`;
        break;
      case 'po':
        def = `Hello,\n\nPlease find attached our Purchase Order [PO Number] for [Total Amount].\n\nLet us know when we can expect delivery.\n\nThank you,\n[Company Name]`;
        break;
    }
    setContent(def);
  };

  return (
    <div className="p-6 bg-white flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Message Templates</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Customize the default messages sent to your clients via WhatsApp. 
            Available placeholders: <code className="bg-slate-100 px-1 rounded">[Client Name]</code>, <code className="bg-slate-100 px-1 rounded">[Invoice Number]</code>, <code className="bg-slate-100 px-1 rounded">[Total Amount]</code>, <code className="bg-slate-100 px-1 rounded">[Due Date]</code>, <code className="bg-slate-100 px-1 rounded">[Portal Link]</code>, <code className="bg-slate-100 px-1 rounded">[Company Name]</code>.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="invoice"><FileText className="w-4 h-4 mr-2" /> Invoices</TabsTrigger>
            <TabsTrigger value="estimate"><FileText className="w-4 h-4 mr-2" /> Estimates</TabsTrigger>
            <TabsTrigger value="payment"><FileText className="w-4 h-4 mr-2" /> Payments</TabsTrigger>
            <TabsTrigger value="po"><FileText className="w-4 h-4 mr-2" /> POs</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message template here..."
              className="min-h-[300px] font-mono text-sm leading-relaxed"
              disabled={loading}
            />
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetToDefault} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" /> Reset to Default
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Save Template
              </Button>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

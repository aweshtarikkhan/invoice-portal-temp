import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_TEMPLATES } from "@/lib/whatsapp";

interface Template {
  id: string;
  org_id: string;
  type: string;
  content: string;
  name: string | null;
  is_default: boolean;
}

export function WhatsAppTemplates() {
  const orgId = useAppStore(s => s.organization?.id);
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoice");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  const docTypes = [
    { id: "invoice", label: "Invoices" },
    { id: "estimate", label: "Estimates" },
    { id: "purchase_order", label: "Purchase Orders" },
    { id: "bill", label: "Bills" }
  ];

  const fetchTemplates = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('org_id', orgId);
      
    if (!error && data) {
      setTemplates(data as Template[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [orgId]);

  const handleSetDefault = async (templateId: string | null, type: string, content?: string) => {
    if (!orgId) return;
    
    // First, unset default for this type
    await supabase
      .from('whatsapp_templates')
      .update({ is_default: false })
      .eq('org_id', orgId)
      .eq('type', type);

    if (templateId) {
      // Set existing template as default
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ is_default: true })
        .eq('id', templateId);
        
      if (!error) {
        toast({ title: "Success", description: "Default template updated." });
        fetchTemplates();
      }
    } else if (content) {
      // Save system template as a new custom template and set as default
      const { error } = await supabase
        .from('whatsapp_templates')
        .insert({
          org_id: orgId,
          type,
          name: "System Template",
          content,
          is_default: true
        });
      if (!error) {
        toast({ title: "Success", description: "Default template updated." });
        fetchTemplates();
      }
    }
  };

  const handleCreateTemplate = async () => {
    if (!orgId || !newTemplateName || !newTemplateContent) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    // If it's the first template for this type, make it default
    const isFirst = !templates.find(t => t.type === activeTab && t.is_default);

    const { error } = await supabase
      .from('whatsapp_templates')
      .insert({
        org_id: orgId,
        type: activeTab,
        name: newTemplateName,
        content: newTemplateContent,
        is_default: isFirst
      });

    if (!error) {
      toast({ title: "Success", description: "Template created." });
      setIsDialogOpen(false);
      setNewTemplateName("");
      setNewTemplateContent("");
      fetchTemplates();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
    if (!error) {
      toast({ title: "Deleted", description: "Template removed." });
      fetchTemplates();
    }
  };

  const renderPlaceholders = () => (
    <div className="mt-4 p-3 bg-slate-50 border rounded-lg text-xs text-slate-600">
      <p className="font-semibold mb-2 text-slate-800">Supported Placeholders:</p>
      <div className="grid grid-cols-2 gap-2">
        <div><code>{`{{client_name}}`}</code> - Client/Vendor Name</div>
        <div><code>{`{{document_no}}`}</code> - Invoice/Estimate No</div>
        <div><code>{`{{total}}`}</code> - Total Amount</div>
        <div><code>{`{{due_date}}`}</code> - Due Date</div>
        <div><code>{`{{subtotal}}`}</code> - Subtotal</div>
        <div><code>{`{{tax}}`}</code> - Total Tax</div>
        <div><code>{`{{discount}}`}</code> - Total Discount</div>
        <div><code>{`{{tds}}`}</code> - TDS Amount</div>
        <div><code>{`{{adjustment}}`}</code> - Adjustment</div>
        <div><code>{`{{items}}`}</code> - Itemized List</div>
        <div><code>{`{{portal_link}}`}</code> - Online View Link</div>
        <div><code>{`{{org_name}}`}</code> - Your Business Name</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col w-full bg-white rounded-lg border">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Message Templates</h2>
          <p className="text-sm text-muted-foreground">Manage default WhatsApp messages for your documents.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Custom Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input placeholder="e.g. Friendly Invoice Reminder" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message Content</Label>
                <Textarea 
                  className="min-h-[150px]"
                  placeholder={`Hi {{client_name}},\n\nHere is your document...`}
                  value={newTemplateContent}
                  onChange={e => setNewTemplateContent(e.target.value)}
                />
              </div>
              {renderPlaceholders()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTemplate}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          {docTypes.map(t => (
            <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        
        {docTypes.map(type => {
          const typeTemplates = templates.filter(t => t.type === type.id);
          const defaultSystemTemplates = DEFAULT_TEMPLATES[type.id] || [];
          
          return (
            <TabsContent key={type.id} value={type.id} className="flex-1 mt-6 min-h-0 overflow-auto">
              <div className="grid gap-4 md:grid-cols-2 pb-10">
                {/* Custom Templates */}
                {typeTemplates.map(t => (
                  <Card key={t.id} className={`flex flex-col ${t.is_default ? 'border-emerald-500 bg-emerald-50/10' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{t.name || 'Unnamed Template'}</CardTitle>
                        {t.is_default && <Badge className="bg-emerald-500">Default</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="bg-slate-100 p-3 rounded-md text-sm whitespace-pre-wrap flex-1 mb-4 font-mono text-slate-700 max-h-[300px] overflow-auto">
                        {t.content}
                      </div>
                      <div className="flex justify-between mt-auto pt-2">
                        <Button variant="destructive" size="sm" onClick={() => deleteTemplate(t.id)}>Delete</Button>
                        {!t.is_default && (
                          <Button variant="secondary" size="sm" onClick={() => handleSetDefault(t.id, type.id)}>
                            Set as Default
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* System Templates */}
                {defaultSystemTemplates.map((content, idx) => {
                  const hasCustomDefault = typeTemplates.some(t => t.is_default);
                  const isEffectiveDefault = !hasCustomDefault && idx === 0;

                  return (
                    <Card key={`sys-${idx}`} className={`flex flex-col ${isEffectiveDefault ? 'border-emerald-500 bg-emerald-50/10' : 'opacity-80'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-slate-500">System Template {idx + 1}</CardTitle>
                          {isEffectiveDefault && <Badge className="bg-emerald-500">Effective Default</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <div className="bg-slate-100 p-3 rounded-md text-sm whitespace-pre-wrap flex-1 mb-4 font-mono text-slate-500 max-h-[300px] overflow-auto">
                          {content}
                        </div>
                        <div className="flex justify-end mt-auto pt-2">
                          {!isEffectiveDefault && (
                            <Button variant="secondary" size="sm" onClick={() => handleSetDefault(null, type.id, content)}>
                              Use as Default
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

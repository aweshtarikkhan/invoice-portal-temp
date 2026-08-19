import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Loader2, Plus, Edit, Trash2, LayoutTemplate, FileCode2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_TEMPLATES } from "./emailTemplates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const TEMPLATE_TYPES = [
  { id: 'invoice', label: 'Invoices' },
  { id: 'estimate', label: 'Estimates' },
  { id: 'po', label: 'Purchase Orders' },
  { id: 'bill', label: 'Bills' },
];

const AVAILABLE_VARIABLES = [
  { name: "{{client_name}}", desc: "The name of the client/vendor" },
  { name: "{{client_email}}", desc: "The email address of the client/vendor" },
  { name: "{{company_name}}", desc: "Your company name" },
  { name: "{{company_email}}", desc: "Your company email" },
  { name: "{{invoice_number}}", desc: "The formatted invoice number" },
  { name: "{{estimate_number}}", desc: "The formatted estimate number" },
  { name: "{{po_number}}", desc: "The formatted PO number" },
  { name: "{{bill_number}}", desc: "The formatted Bill number" },
  { name: "{{invoice_date}}", desc: "The date of the document" },
  { name: "{{date}}", desc: "The date of the document" },
  { name: "{{due_date}}", desc: "The due date" },
  { name: "{{total_amount}}", desc: "The total formatted amount" },
  { name: "{{payment_link}}", desc: "The URL link to view or pay online" },
  { name: "{{portal_link}}", desc: "The URL link to the client portal" },
];

export default function EmailTemplatesList() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("invoice");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", subject: "", html: "" });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email_templates", org?.id],
    queryFn: async () => {
      if (!org?.id) return [];
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const typeTemplates = templates?.filter(t => t.type === activeTab) || [];
  
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update(values)
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        // If it's the first template for this type, make it default
        const isFirst = !typeTemplates.some(t => t.is_default);
        const { error } = await supabase
          .from("email_templates")
          .insert({ ...values, org_id: org?.id, type: activeTab, is_default: isFirst });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_templates"] });
      toast({ title: "Template saved successfully" });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to save template", description: err.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_templates"] });
      toast({ title: "Template deleted" });
    }
  });

  const handleSetDefault = async (tmplId: string | null, typeId: string, systemTemplateContent?: { subject: string, html: string }) => {
    if (!org?.id) return;
    
    // First remove default from all templates of this type
    await supabase
      .from("email_templates")
      .update({ is_default: false })
      .eq("org_id", org.id)
      .eq("type", typeId);

    if (tmplId) {
      // Set existing custom template as default
      const { error } = await supabase
        .from("email_templates")
        .update({ is_default: true })
        .eq("id", tmplId);
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["email_templates"] });
        toast({ title: "Success", description: "Default template updated." });
      }
    } else if (systemTemplateContent) {
      // Check if this exact system template is already saved as a custom template
      const existing = typeTemplates.find(t => 
        t.subject_template === systemTemplateContent.subject && 
        t.body_html_template.trim() === systemTemplateContent.html.trim()
      );

      if (existing) {
        const { error } = await supabase
          .from("email_templates")
          .update({ is_default: true })
          .eq("id", existing.id);
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["email_templates"] });
          toast({ title: "Success", description: "Default template updated." });
        }
      } else {
        // Insert new system template as custom
        const { error } = await supabase
          .from("email_templates")
          .insert({
            org_id: org.id,
            type: typeId,
            name: "System Template",
            subject_template: systemTemplateContent.subject,
            body_html_template: systemTemplateContent.html,
            is_default: true
          });
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["email_templates"] });
          toast({ title: "Success", description: "Default template updated." });
        }
      }
    }
  };

  const handleEdit = (tmpl: any) => {
    setEditingTemplate(tmpl);
    setFormData({ name: tmpl.name, subject: tmpl.subject_template, html: tmpl.body_html_template });
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({ name: "", subject: "", html: "" });
    setIsDialogOpen(true);
  };

  const loadDefaultTemplate = () => {
    const defaultData = DEFAULT_TEMPLATES[activeTab as keyof typeof DEFAULT_TEMPLATES];
    if (defaultData) {
      setFormData({
        name: `Default ${activeTab} template`,
        subject: defaultData.subject,
        html: defaultData.html,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            {TEMPLATE_TYPES.map(type => (
              <TabsTrigger key={type.id} value={type.id}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Custom Template
          </Button>
        </div>

        {TEMPLATE_TYPES.map(type => {
          const defaultData = DEFAULT_TEMPLATES[type.id as keyof typeof DEFAULT_TEMPLATES];
          const hasCustomDefault = typeTemplates.some(t => t.is_default);
          
          return (
            <TabsContent key={type.id} value={type.id} className="space-y-6">
              
              {/* Custom Templates Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {typeTemplates.map((tmpl) => (
                  <Card key={tmpl.id} className={`flex flex-col ${tmpl.is_default ? 'border-emerald-500 bg-emerald-50/10' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{tmpl.name || 'Unnamed Template'}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tmpl)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this template?")) deleteMutation.mutate(tmpl.id) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground line-clamp-1">{tmpl.subject_template}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="bg-slate-50 rounded-md p-3 mb-4 h-32 overflow-hidden relative border text-xs">
                         {tmpl.body_html_template.substring(0, 150)}...
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/90 pointer-events-none" />
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        {tmpl.is_default ? (
                          <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Default for {type.label}
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefault(tmpl.id, type.id)}>
                            Set as Default
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* System Default Templates */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">System Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Standard System Template */}
                  <Card className={`flex flex-col ${!hasCustomDefault ? 'border-emerald-500 bg-emerald-50/10' : ''}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Standard Template</CardTitle>
                      <p className="text-sm font-medium text-muted-foreground">{defaultData.subject}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="bg-slate-50 rounded-md p-3 mb-4 h-32 overflow-hidden relative border text-xs">
                          {defaultData.html.substring(0, 150)}...
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/90 pointer-events-none" />
                      </div>
                      <div className="flex justify-end mt-auto">
                        {!hasCustomDefault ? (
                           <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                             <CheckCircle2 className="w-4 h-4 mr-1.5" />
                             Default for {type.label}
                           </div>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => handleSetDefault(null, type.id, { subject: defaultData.subject, html: defaultData.html })}>
                            Use as Default
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Direct Amount System Template */}
                  <Card className={`flex flex-col`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Direct Amount Template</CardTitle>
                      <p className="text-sm font-medium text-muted-foreground">{defaultData.subject}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="bg-slate-50 rounded-md p-3 mb-4 h-32 overflow-hidden relative border text-xs">
                          {defaultData.directAmountHtml.substring(0, 150)}...
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/90 pointer-events-none" />
                      </div>
                      <div className="flex justify-end mt-auto">
                        <Button variant="secondary" size="sm" onClick={() => handleSetDefault(null, type.id, { subject: defaultData.subject, html: defaultData.directAmountHtml })}>
                          Use as Default
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Email Template"}</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Editor Area */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r space-y-6 bg-slate-50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input 
                  placeholder="e.g. Standard Invoice" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email Subject</label>
                <Input 
                  placeholder="e.g. New Invoice from {{company_name}}" 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="bg-white"
                />
              </div>

              <div className="flex-1 flex flex-col space-y-2 min-h-[300px]">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">HTML Body</label>
                  {!editingTemplate && formData.html === "" && (
                    <Button variant="link" size="sm" onClick={loadDefaultTemplate} className="h-auto p-0">
                      Load Built-in Template
                    </Button>
                  )}
                </div>
                <Tabs defaultValue="edit" className="flex-1 flex flex-col">
                  <TabsList className="self-start">
                    <TabsTrigger value="edit">Edit HTML</TabsTrigger>
                    <TabsTrigger value="preview">Live Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="flex-1 mt-2">
                    <Textarea 
                      placeholder="<html><body>...</body></html>" 
                      value={formData.html}
                      onChange={(e) => setFormData({...formData, html: e.target.value})}
                      className="h-full min-h-[400px] font-mono text-sm bg-white"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="flex-1 mt-2 bg-white border rounded-md overflow-hidden relative">
                    <div 
                      className="absolute inset-0 p-8 overflow-y-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.html
                          .replace(/{{client_name}}/g, "John Doe")
                          .replace(/{{company_name}}/g, "Acme Corp")
                          .replace(/{{invoice_number}}/g, "INV-2026-001")
                          .replace(/{{total_amount}}/g, "$1,250.00")
                          .replace(/{{due_date}}/g, "Oct 15, 2026")
                          .replace(/{{payment_link}}/g, "#")
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Variables Guide */}
            <div className="w-80 bg-white flex flex-col">
              <div className="p-4 border-b font-medium text-sm flex items-center gap-2">
                <FileCode2 className="h-4 w-4" />
                Variables Guide
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Click a variable to copy it to your clipboard. Wrap variables in double braces like <code className="bg-muted px-1 py-0.5 rounded text-primary">{"{{variable}}"}</code>.
                </p>
                <div className="space-y-3">
                  {AVAILABLE_VARIABLES.map((v, i) => (
                    <div key={i} className="group relative border rounded-md p-3 hover:border-primary/50 transition-colors bg-slate-50 cursor-pointer" onClick={() => copyToClipboard(v.name)}>
                      <div className="font-mono text-xs font-semibold text-primary mb-1">{v.name}</div>
                      <div className="text-xs text-muted-foreground leading-tight">{v.desc}</div>
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity">
                        <Copy className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ name: formData.name, subject_template: formData.subject, body_html_template: formData.html })} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

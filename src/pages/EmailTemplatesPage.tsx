import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Loader2, Plus, Edit, Trash2, LayoutTemplate, FileCode2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_INVOICE_TEMPLATE = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
    <h2 style="margin: 0; color: #334155;">New Invoice from {{company_name}}</h2>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Thank you for your business. Here are the details of your new invoice:</p>
    
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Invoice Number:</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{invoice_number}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Invoice Date:</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{invoice_date}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Due Date:</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{due_date}}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 14px; color: #64748b; display: block; margin-bottom: 5px;">Total Amount Due</span>
      <span style="font-size: 32px; font-weight: bold; color: #0f172a;">{{total_amount}}</span>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="{{payment_link}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Invoice & Pay</a>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">If you have any questions, please contact us at {{company_email}}</p>
  </div>
</div>
`.trim();

const AVAILABLE_VARIABLES = [
  { name: "{{client_name}}", desc: "The name of the client" },
  { name: "{{client_email}}", desc: "The email address of the client" },
  { name: "{{company_name}}", desc: "Your company name" },
  { name: "{{company_email}}", desc: "Your company email" },
  { name: "{{invoice_number}}", desc: "The formatted invoice number" },
  { name: "{{invoice_date}}", desc: "The date the invoice was created" },
  { name: "{{due_date}}", desc: "The date the invoice is due" },
  { name: "{{total_amount}}", desc: "The total formatted amount of the invoice" },
  { name: "{{payment_link}}", desc: "The URL link to view or pay the invoice online" },
];

export default function EmailTemplatesPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update(values)
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert({ ...values, org_id: org?.id });
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

  const loadDefaultInvoiceTemplate = () => {
    setFormData({
      name: "Default Invoice Template",
      subject: "New Invoice from {{company_name}}",
      html: DEFAULT_INVOICE_TEMPLATE,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Manage beautiful HTML templates for your outgoing emails like Invoices and Receipts.</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((tmpl) => (
          <div key={tmpl.id} className="border rounded-xl bg-white p-6 shadow-sm flex flex-col group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(tmpl)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this template?")) deleteMutation.mutate(tmpl.id) }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">{tmpl.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-4 flex-1">{tmpl.subject_template}</p>
            {tmpl.is_default && (
              <span className="self-start text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">Default Option</span>
            )}
          </div>
        ))}
        
        {templates?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
            <FileCode2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create your first template to send beautiful HTML emails.</p>
            <Button variant="outline" onClick={handleCreateNew}>Create Template</Button>
          </div>
        )}
      </div>

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
                    <Button variant="link" size="sm" onClick={loadDefaultInvoiceTemplate} className="h-auto p-0">
                      Load Built-in Invoice Template
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
                  Click a variable to copy it to your clipboard. Wrap variables in double braces like <code className="bg-muted px-1 py-0.5 rounded text-primary">{"{{variable}}"}</code>. They will be automatically replaced with real data when sending the email.
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

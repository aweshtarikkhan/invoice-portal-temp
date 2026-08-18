import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Paperclip, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required"),
});

export function ComposeEmailDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const org = useAppStore((s) => s.organization);
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: "",
      subject: "",
      body: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:image/png;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!org?.id) return;
    setIsSending(true);

    try {
      // Process attachments
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: await fileToBase64(file),
          content_type: file.type,
        }))
      );

      // We format plain text with basic HTML replacing newlines
      const htmlBody = `<div style="font-family: sans-serif; white-space: pre-wrap;">${values.body}</div>`;

      const { data, error } = await supabase.functions.invoke('send-custom-email', {
        body: {
          to: values.to,
          subject: values.subject,
          html: htmlBody,
          attachments: processedAttachments,
          orgId: org.id
        }
      });

      if (error) throw error;

      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      form.reset();
      setAttachments([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const onSaveDraft = async () => {
    if (!org?.id) return;
    const values = form.getValues();
    if (!values.to && !values.subject && !values.body) {
      toast({ title: "Cannot save empty draft" });
      return;
    }
    
    setIsSending(true);
    try {
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: await fileToBase64(file),
          content_type: file.type,
        }))
      );

      const htmlBody = `<div style="font-family: sans-serif; white-space: pre-wrap;">${values.body}</div>`;

      const { error } = await supabase.from("emails").insert({
        org_id: org.id,
        direction: "outbound",
        from_email: "draft@local", // Will be replaced when actually sent
        to_email: values.to || "",
        subject: values.subject || "No Subject",
        body_text: values.body,
        body_html: htmlBody,
        attachments: processedAttachments,
        status: "draft",
      });

      if (error) throw error;

      toast({ title: "Draft saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      form.reset();
      setAttachments([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        variant: "destructive",
        title: "Failed to save draft",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="To" {...field} className="border-0 border-b rounded-none focus-visible:ring-0 px-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Subject" {...field} className="border-0 border-b rounded-none focus-visible:ring-0 px-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Type your message here..." 
                      className="min-h-[200px] border-0 focus-visible:ring-0 px-0 resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs max-w-[200px]">
                    <span className="truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full"
                  onClick={() => document.getElementById('email-attachment')?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                  type="file" 
                  id="email-attachment" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onSaveDraft} disabled={isSending}>
                  Save Draft
                </Button>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

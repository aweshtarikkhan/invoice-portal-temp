import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ContactPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "client" | "vendor";
  entityId: string;
  entityName: string;
  missingField: "email" | "phone";
  onSuccess: (val: string) => void;
}

export function ContactPromptDialog({ open, onOpenChange, entityType, entityId, entityName, missingField, onSuccess }: ContactPromptDialogProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    const table = entityType === "client" ? "clients" : "vendors";
    const updatePayload = missingField === "email" ? { email: value.trim() } : { phone: value.trim() };
    
    const { error } = await supabase.from(table).update(updatePayload).eq("id", entityId);
    setLoading(false);
    
    if (error) {
      toast({ title: "Error saving contact info", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved successfully!" });
      onSuccess(value.trim());
      onOpenChange(false);
      setValue(""); // Reset
    }
  };

  const title = missingField === "email" ? "Email Address Required" : "WhatsApp Number Required";
  const desc = `You need to provide an ${missingField === "email" ? "email address" : "WhatsApp number"} for ${entityName} before sending. It will be saved for future use.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input 
            autoFocus
            type={missingField === "email" ? "email" : "tel"} 
            placeholder={missingField === "email" ? "client@example.com" : "+91 9876543210"} 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !value.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save and Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

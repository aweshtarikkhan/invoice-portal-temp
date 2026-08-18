import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Client = {
  id: string;
  display_name: string;
  phone: string;
};

export function NewWhatsappChatDialog({ onStartChat }: { onStartChat: (client: Client) => void }) {
  const org = useAppStore((s) => s.organization);
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && org) {
      fetchClients();
    }
  }, [open, org]);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, display_name, phone")
      .eq("org_id", org?.id)
      .not("phone", "is", null);
      
    if (data) {
      // Filter out invalid phones (just a basic length check for now)
      setClients(data.filter(c => c.phone && c.phone.trim().length > 5));
    }
    setLoading(false);
  };

  const filteredClients = clients.filter(c => 
    c.display_name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Start New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a New WhatsApp Chat</DialogTitle>
        </DialogHeader>
        
        <div className="relative my-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[300px] border rounded-md p-2">
          {loading ? (
            <div className="text-center p-4 text-sm text-muted-foreground">Loading clients...</div>
          ) : filteredClients.length > 0 ? (
            <div className="space-y-1">
              {filteredClients.map((client) => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-md cursor-pointer"
                  onClick={() => {
                    onStartChat(client);
                    setOpen(false);
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{client.display_name}</p>
                    <p className="text-xs text-muted-foreground">{client.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-sm text-muted-foreground">
              {search ? "No clients found." : "No clients with phone numbers found."}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

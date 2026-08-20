import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, Search, Clock, CheckCircle2, Ticket } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SupportTicketsPage() {
  const { org, user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ client_id: "", subject: "", priority: "medium", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (org?.id) {
      fetchTickets();
      fetchClients();
    }
  }, [org?.id]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("tickets")
      .select("*, clients(display_name, email)")
      .eq("org_id", org!.id)
      .order("created_at", { ascending: false });
      
    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await (supabase as any)
      .from("clients")
      .select("id, display_name")
      .eq("org_id", org!.id)
      .order("display_name");
    if (data) setClients(data);
  };

  const handleCreateTicket = async () => {
    if (!newTicket.client_id || !newTicket.subject || !newTicket.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    // 1. Create Ticket
    const { data: ticket, error: ticketErr } = await (supabase as any)
      .from("tickets")
      .insert({
        org_id: org!.id,
        client_id: newTicket.client_id,
        subject: newTicket.subject,
        priority: newTicket.priority,
        created_by: user!.id,
        status: "open"
      }).select().single();
      
    if (ticketErr) {
      toast({ title: "Failed to create ticket", description: ticketErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    
    // 2. Add initial message
    await (supabase as any)
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "agent",
        sender_id: user!.id,
        message: newTicket.message
      });
      
    toast({ title: "Ticket created successfully" });
    setIsNewTicketOpen(false);
    setNewTicket({ client_id: "", subject: "", priority: "medium", message: "" });
    setSubmitting(false);
    fetchTickets();
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.clients?.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-8 bg-slate-50 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage customer issues and support requests.</p>
          </div>
          <Button onClick={() => setIsNewTicketOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Button>
        </div>

        <Card className="border-slate-200/60 shadow-sm rounded-2xl">
          <div className="p-4 border-b border-slate-100 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tickets by subject or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50/50 border-slate-200"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium text-slate-900">No tickets found</p>
                <p className="text-sm mt-1">Create a new ticket to get started.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-full mt-1 ${ticket.status === 'open' ? 'bg-amber-100 text-amber-600' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{ticket.subject}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{ticket.clients?.display_name} • Created {format(new Date(ticket.created_at), "MMM d, yyyy")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={
                      ticket.priority === 'urgent' ? 'border-rose-200 text-rose-700 bg-rose-50' :
                      ticket.priority === 'high' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                      'border-slate-200 text-slate-700'
                    }>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                    <Badge className={
                      ticket.status === 'open' ? 'bg-amber-500 hover:bg-amber-600' :
                      ticket.status === 'resolved' ? 'bg-emerald-500 hover:bg-emerald-600' :
                      'bg-slate-500 hover:bg-slate-600'
                    }>
                      {ticket.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* New Ticket Dialog */}
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={newTicket.client_id} onValueChange={(val) => setNewTicket({...newTicket, client_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} placeholder="Issue summary" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTicket.priority} onValueChange={(val) => setNewTicket({...newTicket, priority: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Message</Label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the issue in detail..."
                  value={newTicket.message}
                  onChange={e => setNewTicket({...newTicket, message: e.target.value})}
                ></textarea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket} disabled={submitting}>
                {submitting ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

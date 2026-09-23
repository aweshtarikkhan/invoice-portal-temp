import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, Search, Clock, CheckCircle2, Ticket, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SupportTicketsPage() {
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ client_id: "", subject: "", priority: "medium", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Status and detail state
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

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

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from("tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;
      toast({ title: `Ticket status updated to ${newStatus.toUpperCase()}` });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const { data } = await (supabase as any)
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      setTicketMessages(data || []);
    } catch (e) {
      console.error("Error loading messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      const currentUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await (supabase as any)
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_type: "agent",
          sender_id: currentUserId,
          message: replyText.trim()
        })
        .select()
        .single();

      if (error) throw error;
      setTicketMessages(prev => [...prev, data]);
      setReplyText("");
      toast({ title: "Reply sent" });
    } catch (err: any) {
      toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.client_id || !newTicket.subject || !newTicket.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const currentUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!currentUserId) {
        toast({ title: "Authentication required", description: "Please ensure you are logged in.", variant: "destructive" });
        return;
      }

      // 1. Create Ticket
      const { data: ticket, error: ticketErr } = await (supabase as any)
        .from("tickets")
        .insert({
          org_id: org!.id,
          client_id: newTicket.client_id,
          subject: newTicket.subject,
          priority: newTicket.priority,
          created_by: currentUserId,
          status: "open"
        }).select().single();
        
      if (ticketErr) {
        toast({ title: "Failed to create ticket", description: ticketErr.message, variant: "destructive" });
        return;
      }
      
      // 2. Add initial message
      if (newTicket.message && ticket?.id) {
        await (supabase as any)
          .from("ticket_messages")
          .insert({
            ticket_id: ticket.id,
            sender_type: "agent",
            sender_id: currentUserId,
            message: newTicket.message
          });
      }
        
      toast({ title: "Ticket created successfully" });
      setIsNewTicketOpen(false);
      setNewTicket({ client_id: "", subject: "", priority: "medium", message: "" });
      fetchTickets();
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      toast({ title: "Error creating ticket", description: err?.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.clients?.display_name?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "in_progress") return t.status === "in_progress" || t.status === "pending";
    return t.status === statusFilter;
  });

  return (
    <>
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
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tickets by subject or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50/50 border-slate-200"
              />
            </div>
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "All", count: tickets.length },
                { id: "open", label: "Open", count: tickets.filter(t => t.status === "open").length },
                { id: "in_progress", label: "In Progress", count: tickets.filter(t => t.status === "in_progress" || t.status === "pending").length },
                { id: "resolved", label: "Resolved", count: tickets.filter(t => t.status === "resolved").length },
                { id: "closed", label: "Closed", count: tickets.filter(t => t.status === "closed").length },
              ].map(f => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={statusFilter === f.id ? "default" : "outline"}
                  onClick={() => setStatusFilter(f.id)}
                  className={`h-8 text-xs font-semibold px-2.5 rounded-lg ${statusFilter === f.id ? "bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                >
                  {f.label}
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === f.id ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {f.count}
                  </span>
                </Button>
              ))}
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
                <p className="text-sm mt-1">Create a new ticket or switch filters.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => handleOpenTicket(ticket)}
                  className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-full mt-1 shrink-0 ${
                      ticket.status === 'open' ? 'bg-amber-100 text-amber-600' : 
                      ticket.status === 'in_progress' || ticket.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                      ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        {ticket.subject}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {ticket.clients?.display_name || "Unknown Customer"} • Created {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline" className={
                      ticket.priority === 'urgent' ? 'border-rose-200 text-rose-700 bg-rose-50' :
                      ticket.priority === 'high' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                      'border-slate-200 text-slate-700'
                    }>
                      {ticket.priority?.toUpperCase()}
                    </Badge>

                    {/* Status Dropdown */}
                    <Select 
                      value={ticket.status} 
                      onValueChange={(val) => handleUpdateStatus(ticket.id, val)}
                    >
                      <SelectTrigger className={`h-7 px-2 text-xs font-semibold rounded-md border-0 text-white ${
                        ticket.status === 'open' ? 'bg-amber-500 hover:bg-amber-600' :
                        ticket.status === 'in_progress' || ticket.status === 'pending' ? 'bg-blue-600 hover:bg-blue-700' :
                        ticket.status === 'resolved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-slate-500 hover:bg-slate-600'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">🟡 Open</SelectItem>
                        <SelectItem value="in_progress">🔵 In Progress</SelectItem>
                        <SelectItem value="resolved">🟢 Resolved</SelectItem>
                        <SelectItem value="closed">⚪ Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Quick Action Button */}
                    {ticket.status !== "closed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-medium gap-1"
                        onClick={() => handleUpdateStatus(ticket.id, "closed")}
                        title="Close this ticket"
                      >
                        <X className="w-3.5 h-3.5" /> Close
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-medium gap-1"
                        onClick={() => handleUpdateStatus(ticket.id, "open")}
                        title="Reopen this ticket"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reopen
                      </Button>
                    )}
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

        {/* Ticket Details & Discussion Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-6">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-indigo-600" />
                    {selectedTicket?.subject}
                  </DialogTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Customer: <span className="font-semibold text-slate-700">{selectedTicket?.clients?.display_name || "Unknown"}</span>
                    {selectedTicket?.created_at && (
                      <> • Created {format(new Date(selectedTicket.created_at), "dd MMM yyyy, hh:mm a")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    selectedTicket?.priority === 'urgent' ? 'border-rose-200 text-rose-700 bg-rose-50' :
                    selectedTicket?.priority === 'high' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                    'border-slate-200 text-slate-700'
                  }>
                    {selectedTicket?.priority?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Status Selector Bar */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Ticket Status:</span>
                  <Select 
                    value={selectedTicket?.status} 
                    onValueChange={(val) => handleUpdateStatus(selectedTicket.id, val)}
                  >
                    <SelectTrigger className={`h-8 px-2.5 text-xs font-semibold rounded-lg text-white border-0 ${
                      selectedTicket?.status === 'open' ? 'bg-amber-500' :
                      selectedTicket?.status === 'in_progress' || selectedTicket?.status === 'pending' ? 'bg-blue-600' :
                      selectedTicket?.status === 'resolved' ? 'bg-emerald-600' :
                      'bg-slate-600'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">🟡 Open</SelectItem>
                      <SelectItem value="in_progress">🔵 In Progress</SelectItem>
                      <SelectItem value="resolved">🟢 Resolved</SelectItem>
                      <SelectItem value="closed">⚪ Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket?.status !== 'closed' ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 font-medium"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                    >
                      <X className="w-3.5 h-3.5" /> Close Ticket
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1 font-medium"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reopen Ticket
                    </Button>
                  )}
                  {selectedTicket?.status !== 'resolved' && selectedTicket?.status !== 'closed' && (
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-medium"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-[220px] max-h-[350px] pr-1">
              {loadingMessages ? (
                <div className="text-center text-slate-400 py-8 text-xs">Loading conversation…</div>
              ) : ticketMessages.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs">No messages logged for this ticket yet.</div>
              ) : (
                ticketMessages.map((msg: any) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      msg.sender_type === 'customer' || msg.sender_type === 'client'
                        ? 'bg-slate-100 text-slate-800 mr-8'
                        : 'bg-indigo-50 border border-indigo-100 text-indigo-950 ml-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>{msg.sender_type === 'platform_admin' ? '🛡️ Platform Support' : msg.sender_type === 'agent' ? 'Support Agent' : 'Customer'}</span>
                      <span>{msg.created_at && format(new Date(msg.created_at), "dd MMM, hh:mm a")}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-slate-800">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <textarea
                className="w-full min-h-[75px] max-h-[120px] p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                placeholder="Type a reply or solution for this ticket..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Replying adds a note to this ticket's resolution thread.
                </span>
                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs px-3 gap-1.5"
                >
                  {sendingReply ? "Sending…" : "Send Reply"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

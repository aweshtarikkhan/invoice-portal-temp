import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, CheckCircle2, Ticket, X, RefreshCw, ArrowLeft, Users, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { buildBrandedEmailHtml } from "@/lib/brand-email-template";
import { openWhatsappShare } from "@/lib/whatsapp";

const generateTicketNumber = (name: string) => {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `${initials || 'TK'}${random4}`;
};

const dispatchTicketNotification = async (ticket: any, status: string, note: string, channel: string, contact: any, org: any) => {
  if (!contact || !org) return;

  const phone = contact.phone;
  const email = contact.email;
  const name = contact.display_name || contact.name || "Customer";
  const orgId = org.id;
  const ticketNum = ticket.ticket_number || "TK0000";

  let subject = `Support Ticket Update: [${ticketNum}]`;
  let title = "Ticket Update";
  let subtitle = ticket.subject;
  let message = "";

  if (status === "open") {
    title = "Support Ticket Created";
    message = `Dear ${name},\n\nThank you for reaching out to us. We have successfully received your request regarding "${ticket.subject}".\n\nYour ticket reference number is [${ticketNum}]. Our support team is currently reviewing the details and will get back to you as soon as possible.\n\nBest regards,\n${org?.name || "Our Support Team"}`;
  } else if (status === "in_progress" || status === "pending") {
    title = "Ticket In Progress";
    message = `Dear ${name},\n\nWe wanted to let you know that our team is now actively working on your support ticket [${ticketNum}].\n\nWe appreciate your patience and will keep you updated as soon as we have more information.\n\nBest regards,\n${org?.name || "Our Support Team"}`;
  } else if (status === "resolved") {
    title = "Ticket Resolved";
    message = `Dear ${name},\n\nWe are pleased to inform you that your support ticket [${ticketNum}] has been marked as resolved.\n\nResolution Details:\n${note}\n\nIf you have any further questions or if the issue persists, please feel free to reach out. Thank you for your patience.\n\nBest regards,\n${org?.name || "Our Support Team"}`;
  } else if (status === "closed") {
    title = "Ticket Closed";
    message = `Dear ${name},\n\nYour support ticket [${ticketNum}] has been closed.\n\nClosing Remarks:\n${note}\n\nThank you for getting in touch with us. Should you need any further assistance, do not hesitate to contact us again.\n\nBest regards,\n${org?.name || "Our Support Team"}`;
  } else if (status === "reply") {
    title = "New Reply Received";
    message = `Dear ${name},\n\nYou have received a new response regarding your support ticket [${ticketNum}]:\n\n"${note}"\n\nPlease feel free to reply directly to this email if you need further assistance.\n\nBest regards,\n${org?.name || "Our Support Team"}`;
  } else {
    title = "Ticket Status Updated";
    message = `Dear ${name},\n\nThere has been an update to your support ticket [${ticketNum}]. The status has been changed to: ${status.replace("_", " ").toUpperCase()}.\n\nBest regards,\n${org?.name || "Our Support Team"}`;
  }

  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <p style="white-space: pre-wrap; line-height: 1.5;">${message}</p>
    </div>
  `;

  if ((channel === "email" || channel === "both") && email) {
    try {
      const emailOptions = {
        title,
        subtitle,
        companyName: org?.name,
        companyEmail: org?.email,
        logoUrl: org?.logo_url,
        customBodyHtml: html
      };
      
      // @ts-ignore
      const brandedHtml = buildBrandedEmailHtml ? buildBrandedEmailHtml(emailOptions) : html;
      await supabase.functions.invoke("send-custom-email", {
        body: { to: email, subject, html: brandedHtml, orgId }
      });
    } catch (e) {
      console.error("Failed to send email notification", e);
    }
  }

  if ((channel === "whatsapp" || channel === "both") && phone) {
    try {
      openWhatsappShare({ orgId, phone, message });
    } catch (e) {
      console.error("Failed to send whatsapp notification", e);
    }
  }
};

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    contact_type: "client", // "client" | "lead"
    contact_id: "",
    subject: "",
    priority: "medium",
    message: "",
    notification_channel: "both", assigned_to: "", due_date: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Status and detail state
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [ticketTemplates, setTicketTemplates] = useState<any[]>([]);

  const [statusUpdateDialog, setStatusUpdateDialog] = useState({
    isOpen: false,
    ticketId: "",
    newStatus: "",
    text: ""
  });

  useEffect(() => {
    if (org?.id) {
      fetchTickets();
      fetchContacts();
      fetchTeamMembers();
      fetchTemplates();
    }
  }, [org?.id]);

  useEffect(() => {
    const st = searchParams.get("status");
    if (st && ["all", "open", "in_progress", "resolved", "closed"].includes(st)) {
      setStatusFilter(st);
    }

    if (searchParams.get("add") === "1") {
      setIsNewTicketOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchTemplates = async () => {
    if (!org?.id) return;
    try {
      const { data } = await (supabase as any)
        .from("message_templates")
        .select("*")
        .eq("org_id", org.id)
        .eq("category", "support_tickets");
      if (data) setTicketTemplates(data);
    } catch (e) {
      console.error("fetchTemplates exception:", e);
    }
  };

  const fetchTickets = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("tickets")
        .select("*, clients(id, display_name, email, phone), leads(id, name, email, phone, company)")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setTickets(data);
      } else {
        console.warn("fetchTickets joined query issue:", error);
        const { data: rawTickets, error: rawErr } = await (supabase as any)
          .from("tickets")
          .select("*")
          .eq("org_id", org.id)
          .order("created_at", { ascending: false });
          
        if (!rawErr && rawTickets) {
          const [{ data: allClients }, { data: allLeads }] = await Promise.all([
            (supabase as any).from("clients").select("id, display_name, email, phone").eq("org_id", org.id),
            (supabase as any).from("leads").select("id, name, email, phone, company").eq("org_id", org.id)
          ]);
            
          const clientMap = new Map((allClients || []).map((c: any) => [c.id, c]));
          const leadMap = new Map((allLeads || []).map((l: any) => [l.id, l]));
          const enriched = rawTickets.map((t: any) => ({
            ...t,
            clients: clientMap.get(t.client_id) || null,
            leads: leadMap.get(t.lead_id) || null,
          }));
          setTickets(enriched);
        } else {
          console.error("fetchTickets fallback failed:", rawErr);
        }
      }
    } catch (err) {
      console.error("fetchTickets exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!org?.id) return;
    try {
      const { data, error } = await (supabase as any)
        .from("crm_team")
        .select("*")
        .eq("org_id", org.id)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching crm team members:", error);
        return;
      }

      if (data) {
        setTeamMembers(data);
      }
    } catch (e) {
      console.error("fetchTeamMembers error:", e);
    }
  };

  const fetchContacts = async () => {
    if (!org?.id) return;
    const [{ data: clientData }, { data: leadData }] = await Promise.all([
      (supabase as any)
        .from("clients")
        .select("id, display_name, company_name, email, phone")
        .eq("org_id", org.id)
        .order("display_name"),
      (supabase as any)
        .from("leads")
        .select("id, name, company, email, phone")
        .eq("org_id", org.id)
        .order("name"),
    ]);
    if (clientData) setClients(clientData);
    if (leadData) setLeads(leadData);
  };

  const handleStatusChangeInitiated = (ticketId: string, newStatus: string) => {
    if (newStatus === "resolved" || newStatus === "closed") {
      setStatusUpdateDialog({ isOpen: true, ticketId, newStatus, text: "" });
    } else {
      handleUpdateStatus(ticketId, newStatus, "");
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string, noteOrComment: string = "") => {
    try {
      const updatePayload: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "resolved") updatePayload.resolution_note = noteOrComment;
      if (newStatus === "closed") updatePayload.closing_comment = noteOrComment;

      const { data: updatedTicket, error } = await (supabase as any)
        .from("tickets")
        .update(updatePayload)
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;
      
      const ticketFull = tickets.find(t => t.id === ticketId);
      if (ticketFull) {
        const contact = ticketFull.clients || ticketFull.leads;
        const channel = updatedTicket.notification_channel || ticketFull.notification_channel || "both";
        dispatchTicketNotification(updatedTicket, newStatus, noteOrComment, channel, contact, org);
      }

      toast({ title: `Ticket status updated to ${newStatus.toUpperCase()}` });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, ...updatePayload } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus, ...updatePayload } : null);
      }
      setStatusUpdateDialog({ isOpen: false, ticketId: "", newStatus: "", text: "" });
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

  const handleSendReply = async (channelOverride?: string) => {
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
      
      const contact = selectedTicket.clients || selectedTicket.leads;
      const channel = channelOverride || selectedTicket.notification_channel || "both";
      dispatchTicketNotification(selectedTicket, "reply", replyText.trim(), channel, contact, org);

      setReplyText("");
      toast({ title: "Reply sent and customer notified" });
    } catch (err: any) {
      toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.contact_id || !newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({ 
        title: "Please fill all required fields", 
        description: "Please select a customer or lead, issue subject, and details.", 
        variant: "destructive" 
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const currentUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!currentUserId) {
        toast({ title: "Authentication required", description: "Please ensure you are logged in.", variant: "destructive" });
        return;
      }

      const contactName = newTicket.contact_type === "client" 
        ? clients.find(c => c.id === newTicket.contact_id)?.display_name 
        : leads.find(l => l.id === newTicket.contact_id)?.name;

      const generatedTicketNumber = generateTicketNumber(contactName || "User");

      const ticketPayload: any = {
        org_id: org!.id,
        subject: newTicket.subject.trim(),
        priority: newTicket.priority,
        created_by: currentUserId,
        status: "open",
        ticket_number: generatedTicketNumber,
        assigned_to: newTicket.assigned_to === "unassigned" ? null : (newTicket.assigned_to || null),
        notification_channel: newTicket.notification_channel,
        due_date: newTicket.due_date ? newTicket.due_date : null
      };

      if (newTicket.contact_type === "client") {
        ticketPayload.client_id = newTicket.contact_id;
        ticketPayload.lead_id = null;
      } else {
        ticketPayload.lead_id = newTicket.contact_id;
        ticketPayload.client_id = null;
      }

      // 1. Create Ticket
      const { data: ticket, error: ticketErr } = await (supabase as any)
        .from("tickets")
        .insert(ticketPayload)
        .select()
        .single();
        
      if (ticketErr) {
        toast({ title: "Failed to create ticket", description: ticketErr.message, variant: "destructive" });
        return;
      }
      
      // 2. Add initial message
      if (newTicket.message.trim() && ticket?.id) {
        await (supabase as any)
          .from("ticket_messages")
          .insert({
            ticket_id: ticket.id,
            sender_type: "agent",
            sender_id: currentUserId,
            message: newTicket.message.trim()
          });
      }
        
      const createdTicket = {
        ...ticket,
        clients: newTicket.contact_type === "client" ? clients.find(c => c.id === newTicket.contact_id) || null : null,
        leads: newTicket.contact_type === "lead" ? leads.find(l => l.id === newTicket.contact_id) || null : null,
      };
      setTickets(prev => [createdTicket, ...prev.filter(t => t.id !== ticket.id)]);
      
      const contact = createdTicket.clients || createdTicket.leads;
      dispatchTicketNotification(createdTicket, "open", "", newTicket.notification_channel, contact, org);

      toast({ title: "Ticket created successfully" });
      setIsNewTicketOpen(false);
      setNewTicket({ contact_type: "client", contact_id: "", subject: "", priority: "medium", message: "", notification_channel: "both", assigned_to: "", due_date: "" });
      fetchTickets();
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      toast({ title: "Error creating ticket", description: err?.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDueDate = async (ticketId: string, newDate: string) => {
    try {
      const payload = { due_date: newDate || null };
      const { error } = await (supabase as any)
        .from("tickets")
        .update(payload)
        .eq("id", ticketId);
      
      if (error) throw error;
      
      toast({ title: "Due date updated" });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...payload } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, ...payload } : null);
      }
    } catch (err: any) {
      console.error("Error updating due date:", err);
      toast({ title: "Failed to update due date", description: err.message, variant: "destructive" });
    }
  };

  const handleReassignTicket = async (ticketId: string, assigneeId: string) => {
    try {
      const payload = { assigned_to: assigneeId === "unassigned" ? null : assigneeId };
      const { error } = await (supabase as any)
        .from("tickets")
        .update(payload)
        .eq("id", ticketId);
      
      if (error) throw error;
      
      toast({ title: "Ticket reassigned" });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...payload } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, ...payload } : null);
      }
    } catch (err: any) {
      console.error("Error reassigning ticket:", err);
      toast({ title: "Failed to reassign", description: err.message, variant: "destructive" });
    }
  };

  const filteredTickets = tickets.filter(t => {
    const clientName = t.clients?.display_name || "";
    const leadName = t.leads?.name || "";
    const leadCompany = t.leads?.company || "";
    const ticketNum = t.ticket_number || "";
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      leadName.toLowerCase().includes(search.toLowerCase()) ||
      leadCompany.toLowerCase().includes(search.toLowerCase()) ||
      ticketNum.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "in_progress") return t.status === "in_progress" || t.status === "pending";
    return t.status === statusFilter;
  });

  return (
    <>
      <div className="flex-1 space-y-6 p-8 bg-slate-50 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage customer & lead issues and support requests.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setIsNewTicketOpen(true)} className="gap-2" size="sm">
              <Plus className="w-4 h-4" /> New Ticket
            </Button>
          </div>
        </div>

        <Card className="border-slate-200/60 shadow-sm rounded-2xl">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tickets by subject, customer, or lead..."
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

          {/* Table Headers */}
          <div className="hidden sm:flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex-1 pl-12">Ticket Details</div>
            <div className="w-48 shrink-0">Assign To</div>
            <div className="w-64 flex items-center justify-end pr-2 shrink-0">Status & Actions</div>
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
              filteredTickets.map(ticket => {
                const isLead = !!ticket.leads && !ticket.clients;
                const contactName = ticket.clients?.display_name || ticket.leads?.name || "Unknown Contact";
                const companyInfo = ticket.leads?.company || "";
                const displayNum = ticket.ticket_number ? `[${ticket.ticket_number}] ` : "";
                const assignee = teamMembers.find(m => m.id === ticket.assigned_to);

                return (
                  <div 
                    key={ticket.id} 
                    onClick={() => handleOpenTicket(ticket)}
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-4 flex-1">
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
                          {displayNum}{ticket.subject}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-700">{contactName}</span>
                          {companyInfo && <span className="text-xs text-slate-400">({companyInfo})</span>}
                          
                          {isLead ? (
                            <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200 py-0 h-4">
                              Lead
                            </Badge>
                          ) : ticket.clients ? (
                            <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200 py-0 h-4">
                              Customer
                            </Badge>
                          ) : null}

                          <span className="text-slate-300">•</span>
                          <span>Created {format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
                          {ticket.due_date && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-medium text-rose-600">Due: {format(new Date(ticket.due_date), "MMM d, yyyy")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:block w-48 shrink-0">
                      {assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {assignee.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate">{assignee.name || assignee.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 shrink-0 w-64 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
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
                        onValueChange={(val) => handleStatusChangeInitiated(ticket.id, val)}
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
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Quick Action Button */}
                      {ticket.status !== "closed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-medium gap-1"
                          onClick={() => handleStatusChangeInitiated(ticket.id, "closed")}
                          title="Close this ticket"
                        >
                          <X className="w-3.5 h-3.5" /> Close
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-medium gap-1"
                          onClick={() => handleStatusChangeInitiated(ticket.id, "open")}
                          title="Reopen this ticket"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* New Ticket Dialog */}
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              {/* Customer vs Lead Segmented Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Select Contact</Label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNewTicket({ ...newTicket, contact_type: "client", contact_id: "" })}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        newTicket.contact_type === "client" 
                          ? "bg-white text-blue-700 shadow-sm" 
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Customers ({clients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTicket({ ...newTicket, contact_type: "lead", contact_id: "" })}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        newTicket.contact_type === "lead" 
                          ? "bg-white text-purple-700 shadow-sm" 
                          : "text-slate-600 hover:text-purple-700"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                      Leads ({leads.length})
                    </button>
                  </div>
                </div>

                <Select 
                  value={newTicket.contact_id} 
                  onValueChange={(val) => setNewTicket({ ...newTicket, contact_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={newTicket.contact_type === "client" ? "Select customer / client..." : "Select CRM lead..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {newTicket.contact_type === "client" ? (
                      clients.length > 0 ? (
                        clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.display_name} {c.company_name ? `• ${c.company_name}` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">No customers registered yet.</div>
                      )
                    ) : (
                      leads.length > 0 ? (
                        leads.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name} {l.company ? `• ${l.company}` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">No CRM leads found.</div>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <Label>Notification</Label>
                  <Select value={newTicket.notification_channel} onValueChange={(val) => setNewTicket({...newTicket, notification_channel: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select value={newTicket.assigned_to} onValueChange={(val) => setNewTicket({...newTicket, assigned_to: val})}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name || m.phone || 'Unknown User'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input 
                    type="date"
                    value={newTicket.due_date}
                    onChange={(e) => setNewTicket({...newTicket, due_date: e.target.value})}
                  />
                </div>
              </div>

            <div className="space-y-2">
              <Label>Subject</Label>
                <Input 
                  value={newTicket.subject} 
                  onChange={e => setNewTicket({...newTicket, subject: e.target.value})} 
                  placeholder="Issue summary" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Initial Message</Label>
                  {ticketTemplates.length > 0 && (
                    <Select onValueChange={(val) => {
                      const tmpl = ticketTemplates.find(t => t.id === val);
                      if (tmpl) {
                        let body = tmpl.body || "";
                        const c = newTicket.contact_type === "client" 
                          ? clients.find(c => c.id === newTicket.contact_id) 
                          : leads.find(l => l.id === newTicket.contact_id);
                        const cName = c?.display_name || c?.name || "";
                        body = body.replace(/{{contact_name}}/g, cName);
                        body = body.replace(/{{org_name}}/g, org?.name || "");
                        setNewTicket({...newTicket, message: body});
                      }
                    }}>
                      <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue placeholder="Insert Template" /></SelectTrigger>
                      <SelectContent>
                        {ticketTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
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

        {/* Status Update Note Dialog */}
        <Dialog open={statusUpdateDialog.isOpen} onOpenChange={(open) => {
          if (!open) setStatusUpdateDialog({ isOpen: false, ticketId: "", newStatus: "", text: "" });
        }}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {statusUpdateDialog.newStatus === "resolved" ? "Resolution Note" : "Closing Comment"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">
                {statusUpdateDialog.newStatus === "resolved" 
                  ? "Please provide a note on how this was resolved:" 
                  : "Please provide a comment before closing:"}
              </Label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter details..."
                value={statusUpdateDialog.text}
                onChange={e => setStatusUpdateDialog({...statusUpdateDialog, text: e.target.value})}
              ></textarea>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusUpdateDialog({ isOpen: false, ticketId: "", newStatus: "", text: "" })}>Cancel</Button>
              <Button onClick={() => handleUpdateStatus(statusUpdateDialog.ticketId, statusUpdateDialog.newStatus, statusUpdateDialog.text)}>
                Confirm & Notify
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
                    {selectedTicket?.ticket_number ? `[${selectedTicket.ticket_number}] ` : ""}{selectedTicket?.subject}
                  </DialogTitle>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Contact:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedTicket?.clients?.display_name || selectedTicket?.leads?.name || "Unknown"}
                    </span>
                    {selectedTicket?.leads?.company && (
                      <span className="text-slate-400">({selectedTicket.leads.company})</span>
                    )}

                    {selectedTicket?.leads && !selectedTicket?.clients ? (
                      <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200 py-0 h-4">
                        Lead
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200 py-0 h-4">
                        Customer
                      </Badge>
                    )}

                    {selectedTicket?.created_at && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>Created {format(new Date(selectedTicket.created_at), "dd MMM yyyy, hh:mm a")}</span>
                      </>
                    )}
                  </div>
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
              <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Ticket Status:</span>
                    <Select 
                      value={selectedTicket?.status} 
                      onValueChange={(val) => handleStatusChangeInitiated(selectedTicket.id, val)}
                    >
                      <SelectTrigger className={`h-8 w-[120px] px-2.5 text-xs font-semibold rounded-lg text-white border-0 ${
                        selectedTicket?.status === 'open' ? 'bg-amber-500' :
                        selectedTicket?.status === 'in_progress' || selectedTicket?.status === 'pending' ? 'bg-blue-600' :
                        selectedTicket?.status === 'resolved' ? 'bg-emerald-600' :
                        'bg-slate-600'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Assignee:</span>
                    <Select 
                      value={selectedTicket?.assigned_to || "unassigned"} 
                      onValueChange={(val) => handleReassignTicket(selectedTicket.id, val)}
                    >
                      <SelectTrigger className="h-8 px-2.5 text-xs font-semibold rounded-lg border-slate-200">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.name || m.phone || 'Unknown User'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs font-semibold text-slate-700">Due:</span>
                    <Input 
                      type="date"
                      value={selectedTicket?.due_date || ""}
                      onChange={(e) => handleUpdateDueDate(selectedTicket.id, e.target.value)}
                      className="h-8 text-xs border-slate-200 rounded-lg w-auto"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket?.status !== 'closed' ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 font-medium"
                      onClick={() => handleStatusChangeInitiated(selectedTicket.id, 'closed')}
                    >
                      <X className="w-3.5 h-3.5" /> Close Ticket
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1 font-medium"
                      onClick={() => handleStatusChangeInitiated(selectedTicket.id, 'open')}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reopen Ticket
                    </Button>
                  )}
                  {selectedTicket?.status !== 'resolved' && selectedTicket?.status !== 'closed' && (
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-medium"
                      onClick={() => handleStatusChangeInitiated(selectedTicket.id, 'resolved')}
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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Reply Message</Label>
                {ticketTemplates.length > 0 && (
                  <Select onValueChange={(val) => {
                    const tmpl = ticketTemplates.find(t => t.id === val);
                    if (tmpl && selectedTicket) {
                      let body = tmpl.body || "";
                      const cName = selectedTicket.clients?.display_name || selectedTicket.leads?.name || "";
                      body = body.replace(/{{contact_name}}/g, cName);
                      body = body.replace(/{{ticket_number}}/g, selectedTicket.ticket_number || "");
                      body = body.replace(/{{org_name}}/g, org?.name || "");
                      setReplyText(body);
                    }
                  }}>
                    <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue placeholder="Insert Template" /></SelectTrigger>
                    <SelectContent>
                      {ticketTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendReply("whatsapp")}
                    disabled={sendingReply || !replyText.trim()}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 h-8 text-xs px-3 gap-1.5"
                  >
                    {sendingReply ? "Sending…" : "Reply on WhatsApp"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSendReply("email")}
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs px-3 gap-1.5"
                  >
                    {sendingReply ? "Sending…" : "Reply on Email"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}














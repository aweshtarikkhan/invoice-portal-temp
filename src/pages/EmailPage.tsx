import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { format } from "date-fns";
import { Loader2, Inbox, Send, Paperclip, Search, Plus, FileEdit, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComposeEmailDialog } from "@/components/emails/ComposeEmailDialog";

export default function EmailPage() {
  const org = useAppStore((s) => s.organization);
  const [activeTab, setActiveTab] = useState<"inbound" | "outbound" | "draft">("inbound");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: emails, isLoading } = useQuery({
    queryKey: ["emails", org?.id],
    queryFn: async () => {
      if (!org?.id) return [];
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const sentCount = emails?.filter(e => e.direction === 'outbound' && e.status === 'sent').length || 0;
  const draftCount = emails?.filter(e => e.status === 'draft').length || 0;
  const failedCount = emails?.filter(e => e.status === 'failed' || e.status === 'bounced').length || 0;

  const filteredEmails = emails?.filter((email) => {
    const searchMatch = email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        email.from_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        email.to_email?.toLowerCase().includes(searchQuery.toLowerCase());
                        
    if (!searchMatch) return false;

    if (activeTab === "inbound") return email.direction === "inbound" && email.status !== "draft";
    if (activeTab === "outbound") return email.direction === "outbound" && email.status !== "draft";
    if (activeTab === "draft") return email.status === "draft";
    return false;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Dashboard Header */}
      <div className="bg-white border-b px-6 py-4 flex gap-6 items-center shrink-0">
        <h2 className="font-semibold text-lg border-r pr-6">Email Overview</h2>
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Send className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold">{sentCount}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sent</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileEdit className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold">{draftCount}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Drafts</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold">{failedCount}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Failed / Bounced</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <Button onClick={() => setComposeOpen(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Compose
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            <button
              onClick={() => { setActiveTab("inbound"); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "inbound" 
                  ? "bg-primary/10 text-primary border-r-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Inbox className="h-4 w-4" /> Inbox
            </button>
            <button
              onClick={() => { setActiveTab("outbound"); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "outbound" 
                  ? "bg-primary/10 text-primary border-r-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Send className="h-4 w-4" /> Sent
            </button>
            <button
              onClick={() => { setActiveTab("draft"); setSelectedEmail(null); }}
              className={`w-full flex items-center justify-between px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "draft" 
                  ? "bg-primary/10 text-primary border-r-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileEdit className="h-4 w-4" /> Drafts
              </div>
              {draftCount > 0 && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{draftCount}</span>
              )}
            </button>
          </div>
        </div>

      {/* Message List */}
      <div className="w-80 border-r flex flex-col bg-white">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search emails..."
              className="pl-8 bg-muted/50 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEmails?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No emails found
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails?.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    selectedEmail?.id === email.id ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-sm truncate pr-2">
                      {activeTab === "inbound" ? email.from_email : email.to_email}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(email.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">
                    {email.subject || "No Subject"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                    <span className="truncate">{email.body_text || "No preview"}</span>
                    {email.attachments && email.attachments.length > 0 && (
                      <Paperclip className="h-3 w-3 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b bg-white">
              <h2 className="text-xl font-bold mb-4">{selectedEmail.subject || "No Subject"}</h2>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {(activeTab === "inbound" ? selectedEmail.from_email : selectedEmail.to_email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {activeTab === "inbound" ? selectedEmail.from_email : selectedEmail.to_email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    to {activeTab === "inbound" ? selectedEmail.to_email : selectedEmail.from_email} • {format(new Date(selectedEmail.created_at), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {selectedEmail.body_html ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} 
                />
              ) : (
                <div className="whitespace-pre-wrap font-sans text-sm">
                  {selectedEmail.body_text}
                </div>
              )}

              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-8 border-t pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    {selectedEmail.attachments.length} Attachments
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedEmail.attachments.map((att: any, i: number) => (
                      <a 
                        key={i} 
                        href={att.url || "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                      >
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <span className="truncate max-w-[150px]">{att.filename}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-8 w-8 opacity-50" />
            </div>
            <p>Select an email to view</p>
          </div>
        )}
      </div>

      </div>
      <ComposeEmailDialog 
        open={composeOpen} 
        onOpenChange={setComposeOpen} 
      />
    </div>
  );
}

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User, CheckCheck, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { openWhatsappShare, normalizeWhatsappNumber } from "@/lib/whatsapp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppTemplates } from "@/components/whatsapp/WhatsAppTemplates";
import { useAppStore } from "@/store/app-store";

interface Chat {
  id: string;
  phone_number: string;
  contact_name: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  chat_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  message_text: string | null;
  status: string;
  created_at: string;
}

export default function ChatUIPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const orgId = useAppStore((s) => s.organization?.id);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || "http://localhost:3010/api";

  useEffect(() => {
    const fetchChats = async () => {
      const { data } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .order('last_message_at', { ascending: false });
        
      const { data: clients } = await supabase
        .from('clients')
        .select('phone, mobile, display_name, company_name');
      
      if (data) {
        let enrichedChats = data.map(chat => {
          let cName = chat.contact_name;
          let isClient = false;
          if (clients) {
             const matchedClient = clients.find(c => {
               const p = c.phone ? normalizeWhatsappNumber(c.phone) : null;
               const m = c.mobile ? normalizeWhatsappNumber(c.mobile) : null;
               return (p && p === chat.phone_number) || (m && m === chat.phone_number);
             });
             if (matchedClient) {
                isClient = true;
                cName = matchedClient.display_name || matchedClient.company_name || cName;
             }
          }
          return { ...chat, contact_name: cName, isClient };
        });
        
        // Filter out non-client chats
        enrichedChats = enrichedChats.filter(chat => chat.isClient);
        
        setChats(enrichedChats as Chat[]);
      }
      setLoading(false);
    };
    
    fetchChats();

    const sub = supabase
      .channel('public:whatsapp_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' }, (payload) => {
        fetchChats();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        if (!orgId) return;
        const res = await fetch(`${WHATSAPP_SERVICE_URL}/qr?org_id=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          setConnectionStatus(data.status);
          if (data.status === 'qr' && data.qr) {
            setQrCode(data.qr);
          } else {
            setQrCode(null);
          }
        }
      } catch (e) {
        setConnectionStatus('disconnected');
      }
    };
    
    checkStatus();
    interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [WHATSAPP_SERVICE_URL, orgId]);

  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', activeChat.id)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data as Message[]);
    };

    fetchMessages();

    const sub = supabase
      .channel('public:whatsapp_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `chat_id=eq.${activeChat.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeChat]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeChat || !orgId) return;
    const txt = inputText.trim();
    setInputText("");

    // Optimistic UI update
    const optMsg: Message = {
      id: Math.random().toString(),
      chat_id: activeChat.id,
      phone_number: activeChat.phone_number,
      direction: 'outgoing',
      message_text: txt,
      status: 'sending',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);

    await openWhatsappShare({
      phone: activeChat.phone_number,
      message: txt,
      orgId
    });
  };

  return (
    <Tabs defaultValue="chats" className="w-full h-full flex flex-col -mt-4">
      <div className="mb-2 flex justify-between items-center px-1">
        <TabsList>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="chats" className="flex-1 mt-0 min-h-0 data-[state=active]:flex">
        <div className="flex w-full h-[calc(100vh-8.5rem)] min-h-[500px] border rounded-lg bg-background overflow-hidden">
          {/* Sidebar: Chats List */}
          <div className="w-1/3 border-r flex flex-col bg-slate-50/50">
            <div className="p-4 border-b font-semibold flex justify-between items-center bg-white">
              <span>WhatsApp Chats</span>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading chats...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No chats found.</div>
              ) : (
                <div className="divide-y">
                  {chats.map(chat => (
                    <div 
                      key={chat.id} 
                      className={`p-3 flex gap-3 cursor-pointer hover:bg-slate-100 transition-colors ${activeChat?.id === chat.id ? 'bg-slate-100' : ''}`}
                      onClick={() => setActiveChat(chat)}
                    >
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-sm truncate">{chat.contact_name || chat.phone_number}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {chat.last_message_at ? format(new Date(chat.last_message_at), "HH:mm") : ""}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {chat.last_message_text || "No message"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Area: Active Chat or QR Code */}
          <div className="flex-1 flex flex-col bg-[#e5ddd5]">
            {connectionStatus === 'disconnected' || connectionStatus === 'close' ? (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-700 h-full bg-white">
                <div className="p-4 border border-red-200 bg-red-50 rounded-xl max-w-md text-center">
                  <h2 className="text-xl font-semibold text-red-600 mb-2">WhatsApp Disconnected</h2>
                  <p className="text-sm text-red-700 mb-4">
                    Your WhatsApp connection was disconnected. Please go to Settings to reconnect your phone.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                    Go to Settings
                  </Button>
                </div>
              </div>
            ) : connectionStatus === 'qr' && qrCode ? (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-700 h-full bg-white">
                <h2 className="text-2xl font-semibold mb-2">Link WhatsApp</h2>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Open WhatsApp on your phone, tap Settings, select Linked Devices, and scan this QR Code.
                </p>
                <div className="p-4 border rounded-xl shadow-sm bg-white">
                  <img src={qrCode} alt="WhatsApp QR Code" className="h-64 w-64" />
                </div>
                <p className="text-xs text-muted-foreground mt-4">Waiting for scan...</p>
              </div>
            ) : activeChat ? (
              <>
                <div className="p-3 bg-white border-b flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{activeChat.contact_name || activeChat.phone_number}</div>
                    <div className="text-xs text-muted-foreground">+{activeChat.phone_number}</div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="flex flex-col gap-2">
                    {messages.map(msg => {
                      const isOut = msg.direction === 'outgoing';
                      return (
                        <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg p-2 relative text-sm shadow-sm ${
                            isOut ? 'bg-[#dcf8c6]' : 'bg-white'
                          }`}>
                            <div className="mb-3 whitespace-pre-wrap">{msg.message_text}</div>
                            <div className="flex items-center gap-1 absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                              {format(new Date(msg.created_at), "HH:mm")}
                              {isOut && (
                                <CheckCheck size={12} className={msg.status === 'read' ? 'text-blue-500' : 'text-slate-400'} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-3 bg-white flex gap-2 items-center">
                  <Input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-slate-100 border-none focus-visible:ring-0"
                  />
                  <Button onClick={handleSend} size="icon" className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 rounded-full">
                    <Send size={18} className="ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-500 h-full">
                <div className="h-32 w-32 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <MessageSquare size={48} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-light">WhatsApp Web</h2>
                <p className="text-sm mt-2">Select a chat to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="templates" className="flex-1 mt-0 min-h-0 data-[state=active]:flex">
        <div className="w-full h-[calc(100vh-8.5rem)] min-h-[500px]">
          <WhatsAppTemplates />
        </div>
      </TabsContent>
    </Tabs>
  );
}

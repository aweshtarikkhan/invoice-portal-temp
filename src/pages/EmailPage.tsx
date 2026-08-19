import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailInbox from "@/components/email/EmailInbox";
import EmailTemplatesList from "@/components/email/EmailTemplatesList";

export default function EmailPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50">
      <div className="p-6 shrink-0 border-b bg-white flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Email</h1>
          <p className="text-muted-foreground mt-1">Manage your emails and HTML templates.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-6 flex flex-col">
        <Tabs defaultValue="inbox" className="flex-1 flex flex-col">
          <TabsList className="self-start mb-6">
            <TabsTrigger value="inbox" className="px-6">Inbox & Sent</TabsTrigger>
            <TabsTrigger value="templates" className="px-6">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="flex-1 min-h-0 m-0 bg-white border rounded-xl overflow-hidden shadow-sm">
            <EmailInbox />
          </TabsContent>
          
          <TabsContent value="templates" className="flex-1 min-h-0 m-0 overflow-y-auto">
            <EmailTemplatesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

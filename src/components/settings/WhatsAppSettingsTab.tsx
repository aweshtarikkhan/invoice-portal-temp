import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || "http://localhost:3010/api";

export function WhatsAppSettingsTab({ orgId }: { orgId?: string }) {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        if (!orgId) return; // Don't check if orgId is not yet available
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
    // Poll every 5 seconds
    interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [orgId]);

  const handleDisconnect = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch(`${WHATSAPP_SERVICE_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId })
      });
      if (res.ok) {
        toast({ title: "Disconnected", description: "WhatsApp session has been reset." });
        setConnectionStatus("disconnected");
        setQrCode(null);
      } else {
        toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error while disconnecting.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" /> 
          WhatsApp Connection
        </CardTitle>
        <CardDescription>
          Link your WhatsApp account to send invoices, receipts, and marketing posters directly to clients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
          <div className="flex-1 flex items-center gap-3">
            {connectionStatus === 'connected' || connectionStatus === 'open' ? (
              <>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-emerald-700 dark:text-emerald-400">Connected</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your WhatsApp account is successfully linked and ready to send messages.</p>
                </div>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-400">Connecting...</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Checking connection status with the WhatsApp server.</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-rose-700 dark:text-rose-400">Disconnected</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Please scan the QR code below to link your WhatsApp account. Or click Reset Connection if you are facing issues.</p>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          {(connectionStatus === 'connected' || connectionStatus === 'open' || connectionStatus === 'qr' || connectionStatus === 'close' || connectionStatus === 'disconnected') && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loading} className="gap-2 shrink-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Reset Connection
            </Button>
          )}
        </div>

        {/* QR Code Section */}
        {connectionStatus === 'qr' && qrCode && (
          <div className="mt-8 flex flex-col items-center justify-center p-6 border rounded-xl shadow-sm bg-white">
            <h3 className="text-lg font-semibold mb-2 text-slate-800">Scan to Connect</h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
              Open WhatsApp on your phone, tap the menu <span className="font-bold">⋮</span> or Settings ⚙️, select <span className="font-bold">Linked Devices</span>, and scan this QR code.
            </p>
            <div className="p-4 border rounded-xl shadow-sm bg-white inline-block">
              <img src={qrCode} alt="WhatsApp QR Code" className="h-64 w-64 object-contain" />
            </div>
            <p className="text-xs text-slate-400 mt-4 animate-pulse">Waiting for scan...</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

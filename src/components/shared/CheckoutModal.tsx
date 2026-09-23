import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  planName: string;
  baseAmount: number; // in INR
  onProceedToPay: (finalAmount: number, promoCode: string | null) => void;
}

export function CheckoutModal({ open, onClose, orgId, planName, baseAmount, onProceedToPay }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India"
  });

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number, type: 'percent' | 'flat'} | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    if (open && orgId) {
      loadOrgAddress();
    }
  }, [open, orgId]);

  const loadOrgAddress = async () => {
    const { data } = await supabase.from("organizations").select("address").eq("id", orgId).single();
    if (data?.address) {
      setAddress({ ...address, ...(data.address as any) });
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("active", true)
        .single();
        
      if (error || !data) {
        setPromoError("Invalid or expired promo code.");
        setAppliedPromo(null);
      } else {
        const now = new Date();
        if (data.valid_until && new Date(data.valid_until) < now) {
          setPromoError("This promo code has expired.");
          setAppliedPromo(null);
          return;
        }
        
        toast.success("Promo code applied!");
        setAppliedPromo({
          code: data.code,
          discount: data.discount_percent || data.flat_discount || 0,
          type: data.discount_percent ? 'percent' : 'flat'
        });
      }
    } catch (e) {
      setPromoError("Failed to apply promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const calculateAmounts = () => {
    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'percent') {
        discount = (baseAmount * appliedPromo.discount) / 100;
      } else {
        discount = appliedPromo.discount;
      }
    }
    const subtotal = Math.max(0, baseAmount - discount);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    
    return { subtotal, discount, gst, total };
  };

  const handleProceed = async () => {
    if (!address.street || !address.city || !address.state) {
      toast.error("Please fill in your billing address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ address })
        .eq("id", orgId);
        
      if (error) throw error;
      
      const { total } = calculateAmounts();
      onProceedToPay(total, appliedPromo?.code || null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, discount, gst, total } = calculateAmounts();

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout - {planName}</DialogTitle>
          <DialogDescription>Please provide your billing details to continue.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Billing Address</h3>
            <div className="grid gap-2">
              <Label>Street Address</Label>
              <Input value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} placeholder="Mumbai" />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} placeholder="Maharashtra" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>ZIP / Postal Code</Label>
                <Input value={address.zip} onChange={(e) => setAddress({...address, zip: e.target.value})} placeholder="400001" />
              </div>
              <div className="grid gap-2">
                <Label>Country</Label>
                <Input value={address.country} disabled />
              </div>
            </div>
          </div>

          <hr />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Discount Code</h3>
            <div className="flex gap-2">
              <Input 
                value={promoCode} 
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())} 
                placeholder="Enter promo code" 
                disabled={!!appliedPromo}
              />
              {!appliedPromo ? (
                <Button variant="secondary" onClick={handleApplyPromo} disabled={promoLoading || !promoCode}>Apply</Button>
              ) : (
                <Button variant="ghost" className="text-red-500" onClick={() => { setAppliedPromo(null); setPromoCode(""); }}>Remove</Button>
              )}
            </div>
            {promoError && <p className="text-xs text-red-500">{promoError}</p>}
          </div>

          <div className="bg-slate-50 p-3 rounded-md space-y-1 text-sm border">
            <div className="flex justify-between text-muted-foreground">
              <span>Base Amount:</span>
              <span>₹{baseAmount.toLocaleString()}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedPromo.code}):</span>
                <span>- ₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (18%):</span>
              <span>+ ₹{gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>Total Payable:</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleProceed} disabled={loading}>
            {loading ? "Processing..." : `Pay ₹${total.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

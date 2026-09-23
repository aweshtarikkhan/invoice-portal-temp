import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Tag,
  Copy,
  LogOut,
  Plus,
  Loader2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Percent,
  IndianRupee,
} from "lucide-react";
import logo from "@/assets/logo.png";

interface Partner {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
}

interface Coupon {
  id: string;
  coupon_code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  // New coupon dialog
  const [showNewCoupon, setShowNewCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    coupon_code: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: "",
    max_uses: "",
  });

  useEffect(() => {
    checkPartnerAuth();
  }, []);

  const checkPartnerAuth = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/partner-login", { replace: true });
        return;
      }

      const { data: partnerData, error } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", session.session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!partnerData) {
        await supabase.auth.signOut();
        navigate("/partner-login", { replace: true });
        return;
      }

      setPartner(partnerData as Partner);
      fetchCoupons(partnerData.id);
    } catch (err) {
      navigate("/partner-login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async (partnerId: string) => {
    const { data, error } = await supabase
      .from("partner_coupons")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });

    if (!error && data) setCoupons(data as Coupon[]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/partner-portal", { replace: true });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  const totalUsedSlots = coupons.reduce((sum, c) => sum + c.used_count, 0);
  const totalAllocated = coupons.reduce((sum, c) => sum + c.max_uses, 0);
  const remainingSlots = partner ? partner.max_users - totalAllocated : 0;

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    if (!newCoupon.coupon_code || !newCoupon.discount_value || !newCoupon.max_uses) {
      toast({ title: "Required", description: "Sab fields fill karo.", variant: "destructive" });
      return;
    }

    const maxUses = parseInt(newCoupon.max_uses);
    const discountVal = parseFloat(newCoupon.discount_value);

    if (isNaN(maxUses) || maxUses < 1) {
      toast({ title: "Invalid", description: "Max uses 1 ya zyada hona chahiye.", variant: "destructive" });
      return;
    }

    if (coupons.length >= 10) {
      toast({
        title: "Limit Reached",
        description: "Aap maximum 10 coupons bana sakte ho.",
        variant: "destructive",
      });
      return;
    }

    if (totalAllocated + maxUses > partner.max_users) {
      toast({
        title: "Exceeds Limit",
        description: `Sirf ${remainingSlots} aur slots available hain. Remaining: ${partner.max_users - totalAllocated}`,
        variant: "destructive",
      });
      return;
    }

    if (newCoupon.discount_type === "percent" && (discountVal <= 0 || discountVal > 100)) {
      toast({ title: "Invalid Discount", description: "Percent 1-100 ke beech hona chahiye.", variant: "destructive" });
      return;
    }

    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_coupons")
        .insert({
          partner_id: partner.id,
          coupon_code: newCoupon.coupon_code.trim().toUpperCase(),
          discount_type: newCoupon.discount_type,
          discount_value: discountVal,
          max_uses: maxUses,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Duplicate Code", description: "Yeh coupon code already exist karta hai.", variant: "destructive" });
        } else {
          throw error;
        }
        return;
      }

      setCoupons((prev) => [data as Coupon, ...prev]);
      setNewCoupon({ coupon_code: "", discount_type: "percent", discount_value: "", max_uses: "" });
      setShowNewCoupon(false);
      toast({ title: "Coupon Created!", description: `${data.coupon_code} successfully bana.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (coupon.used_count > 0) {
      toast({
        title: "Cannot Delete",
        description: "Yeh coupon already use ho chuka hai. Sirf deactivate kar sakte ho.",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase.from("partner_coupons").delete().eq("id", coupon.id);
    if (!error) {
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast({ title: "Coupon deleted." });
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    const { error } = await supabase
      .from("partner_coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);
    if (!error) {
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-300 animate-spin" />
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900">
      {/* Header / Navbar */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-9 w-auto" />
          <span className="text-white/60 text-sm border border-white/20 rounded-full px-3 py-0.5">
            Partner Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-indigo-300 text-sm hidden sm:block">{partner.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 space-y-8 max-w-5xl mx-auto">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {partner.name}! 👋
          </h1>
          <p className="text-indigo-300 text-sm mt-1">{partner.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Max Users"
            value={partner.max_users}
            icon={<Users className="h-5 w-5 text-indigo-300" />}
          />
          <StatCard
            label="Allocated"
            value={totalAllocated}
            icon={<CheckCircle className="h-5 w-5 text-green-400" />}
          />
          <StatCard
            label="Used"
            value={totalUsedSlots}
            icon={<RefreshCw className="h-5 w-5 text-yellow-400" />}
          />
          <StatCard
            label="Coupons"
            value={`${coupons.length}/10`}
            icon={<Tag className="h-5 w-5 text-purple-400" />}
          />
        </div>

        {/* Referral Code */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-300" />
            Tumhara Referral Code
          </h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-indigo-200 font-mono text-lg tracking-widest">
              {partner.referral_code}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 shrink-0"
              onClick={() => copyToClipboard(partner.referral_code, "Referral Code")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-indigo-400 text-xs mt-2">
            Naaye partners ko yeh code do partner sign up ke time
          </p>
        </div>

        {/* Coupons Section */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-300" />
              Discount Coupons
              <Badge variant="secondary" className="bg-white/10 text-indigo-200">
                {coupons.length}/10
              </Badge>
            </h2>
            <Button
              size="sm"
              onClick={() => setShowNewCoupon(true)}
              disabled={coupons.length >= 10 || remainingSlots <= 0}
              className="bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Coupon
            </Button>
          </div>

          {/* Slot usage bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-indigo-300 mb-1">
              <span>User Slots Used</span>
              <span>{totalAllocated} / {partner.max_users}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalAllocated / partner.max_users) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-indigo-400 mt-1">{remainingSlots} slots remaining</p>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12 text-indigo-400">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Koi coupon nahi bana abhi tak.</p>
              <p className="text-xs mt-1">New Coupon button se banao.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    coupon.is_active
                      ? "bg-white/5 border-white/10"
                      : "bg-white/[0.02] border-white/5 opacity-60"
                  }`}
                >
                  {/* Code */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-white font-mono font-semibold text-sm">
                        {coupon.coupon_code}
                      </code>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          coupon.discount_type === "percent"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {coupon.discount_type === "percent" ? (
                          <><Percent className="h-3 w-3 mr-0.5" />{coupon.discount_value}% off</>
                        ) : (
                          <><IndianRupee className="h-3 w-3 mr-0.5" />₹{coupon.discount_value} off</>
                        )}
                      </Badge>
                      {!coupon.is_active && (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-300 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-indigo-400 text-xs mt-1">
                      Used: {coupon.used_count} / {coupon.max_uses}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-indigo-400 hover:text-white hover:bg-white/10"
                      onClick={() => copyToClipboard(coupon.coupon_code, "Coupon code")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-indigo-400 hover:text-white hover:bg-white/10"
                      onClick={() => handleToggleCoupon(coupon)}
                      title={coupon.is_active ? "Deactivate" : "Activate"}
                    >
                      {coupon.is_active ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDeleteCoupon(coupon)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Coupon Dialog */}
      <Dialog open={showNewCoupon} onOpenChange={setShowNewCoupon}>
        <DialogContent className="bg-indigo-950 border border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Naya Coupon Banao</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCoupon} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-indigo-200 text-sm">Coupon Code</Label>
              <Input
                value={newCoupon.coupon_code}
                onChange={(e) =>
                  setNewCoupon((p) => ({ ...p, coupon_code: e.target.value.toUpperCase() }))
                }
                placeholder="Jaise: SAVE20"
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 font-mono"
                disabled={couponLoading}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-indigo-200 text-sm">Discount Type</Label>
              <Select
                value={newCoupon.discount_type}
                onValueChange={(v) =>
                  setNewCoupon((p) => ({ ...p, discount_type: v as "percent" | "fixed" }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-indigo-950 border-white/20">
                  <SelectItem value="percent" className="text-white focus:bg-white/10">
                    Percentage (%)
                  </SelectItem>
                  <SelectItem value="fixed" className="text-white focus:bg-white/10">
                    Fixed Amount (₹)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-indigo-200 text-sm">
                Discount Value{" "}
                {newCoupon.discount_type === "percent" ? "(%)" : "(₹)"}
              </Label>
              <Input
                type="number"
                value={newCoupon.discount_value}
                onChange={(e) =>
                  setNewCoupon((p) => ({ ...p, discount_value: e.target.value }))
                }
                placeholder={newCoupon.discount_type === "percent" ? "20" : "500"}
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400"
                disabled={couponLoading}
                min="0"
                max={newCoupon.discount_type === "percent" ? "100" : undefined}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-indigo-200 text-sm">
                Max Uses (max {remainingSlots} available)
              </Label>
              <Input
                type="number"
                value={newCoupon.max_uses}
                onChange={(e) =>
                  setNewCoupon((p) => ({ ...p, max_uses: e.target.value }))
                }
                placeholder={`1 - ${remainingSlots}`}
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400"
                disabled={couponLoading}
                min="1"
                max={remainingSlots}
              />
              <p className="text-indigo-400 text-xs">
                Sab coupons ka total max_uses ≤ {partner.max_users} hona chahiye
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCoupon(false)}
                className="border-white/20 text-white hover:bg-white/10"
                disabled={couponLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-400 text-white"
                disabled={couponLoading}
              >
                {couponLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Coupon"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-indigo-300 text-xs">{label}</span></div>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}

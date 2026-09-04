import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSocials, savePlatformSocials, formatSocialUrl, DEFAULT_PLATFORM_SOCIALS } from "@/hooks/use-platform-socials";
import { YoutubeIcon, FacebookIcon, InstagramIcon, SocialMediaLinks } from "@/components/shared/SocialMediaLinks";
import { Loader2, Save, ExternalLink, RotateCcw, Share2, Phone, CheckCircle2, FileText, Printer, Layers, Sparkles, MessageSquare } from "lucide-react";

export function PlatformSocialsManager() {
  const { socials: currentSocials, loading } = usePlatformSocials();
  const [formData, setFormData] = useState(currentSocials);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setFormData(currentSocials);
    }
  }, [loading, currentSocials]);

  const handleSave = async () => {
    setSaving(true);
    const res = await savePlatformSocials(formData);
    setSaving(false);

    if (res.success) {
      toast({
        title: "Social Handles Updated",
        description: "Official social media channels have been updated across the platform.",
      });
    } else {
      toast({
        title: "Failed to Save",
        description: res.error || "An error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_PLATFORM_SOCIALS);
    toast({
      title: "Reset to Defaults",
      description: "Remember to click 'Save Social Handles' to persist changes.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
      </div>
    );
  }

  const previewYoutube = formatSocialUrl("youtube", formData.youtube);
  const previewFacebook = formatSocialUrl("facebook", formData.facebook);
  const previewInstagram = formatSocialUrl("instagram", formData.instagram);

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                Official AssayBiz Social Media Handles
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Configure official social media channels and support contact information. These links are displayed on the public Landing Page, Employee Attendance Portal, and Navigation.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* YouTube */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="p-1 rounded bg-red-600/20 text-red-500">
                    <YoutubeIcon className="w-4 h-4" />
                  </span>
                  YouTube Channel
                </Label>
                {previewYoutube && (
                  <a
                    href={previewYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                  >
                    Test Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="https://youtube.com/@assaybiz or @assaybiz"
                className="bg-slate-950 border-slate-800 text-white"
              />
              <p className="text-[11px] text-slate-400">
                URL or handle (e.g. <code>@assaybiz</code>)
              </p>
            </div>

            {/* Facebook */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="p-1 rounded bg-blue-600/20 text-blue-500">
                    <FacebookIcon className="w-4 h-4" />
                  </span>
                  Facebook Page
                </Label>
                {previewFacebook && (
                  <a
                    href={previewFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Test Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/assaybiz or assaybiz"
                className="bg-slate-950 border-slate-800 text-white"
              />
              <p className="text-[11px] text-slate-400">
                URL or page username (e.g. <code>assaybiz</code>)
              </p>
            </div>

            {/* Instagram */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="p-1 rounded bg-pink-600/20 text-pink-500">
                    <InstagramIcon className="w-4 h-4" />
                  </span>
                  Instagram Profile
                </Label>
                {previewInstagram && (
                  <a
                    href={previewInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-pink-400 hover:underline flex items-center gap-1"
                  >
                    Test Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/assaybiz or @assaybiz"
                className="bg-slate-950 border-slate-800 text-white"
              />
              <p className="text-[11px] text-slate-400">
                URL or handle (e.g. <code>@assaybiz</code>)
              </p>
            </div>

            {/* Business Contact / Mobile */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="p-1 rounded bg-emerald-600/20 text-emerald-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  Platform Contact / Mobile
                </Label>
                {formData.phone && (
                  <span className="text-[11px] text-emerald-400">Active</span>
                )}
              </div>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="bg-slate-950 border-slate-800 text-white"
              />
              <p className="text-[11px] text-slate-400">
                Official contact phone/mobile number for support & inquiries.
              </p>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live Client Preview
              </div>
              <span className="text-[11px] text-slate-500">Rendered in footers & headers</span>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
              <div className="text-sm text-slate-300">
                Follow AssayBiz on official channels:
              </div>
              <div className="flex items-center gap-2">
                {previewYoutube && (
                  <a
                    href={previewYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-medium transition-all hover:scale-105"
                  >
                    <YoutubeIcon className="w-3.5 h-3.5" />
                    YouTube
                  </a>
                )}
                {previewFacebook && (
                  <a
                    href={previewFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-medium transition-all hover:scale-105"
                  >
                    <FacebookIcon className="w-3.5 h-3.5" />
                    Facebook
                  </a>
                )}
                {previewInstagram && (
                  <a
                    href={previewInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/10 hover:bg-pink-600/20 text-pink-400 border border-pink-500/30 text-xs font-medium transition-all hover:scale-105"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 shadow-lg shadow-indigo-600/25"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Saving Handles...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Social Handles
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Official Marketing Assets & Brochure Card */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Official AssayBiz Product & Pricing Brochure
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                A4 multi-page printable collateral updated with official AssayBiz logo, packages, pricing matrix, and core module names.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                <a href="/brochure" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Brochure
                </a>
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/brochure", "_blank")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-semibold text-sm text-white">AssayBiz Official Brochure 2026 Edition (A4)</h5>
                <p className="text-xs text-slate-400">Includes Sales, Catalog, Purchases, Banking, HR, CRM, Promotion & Pricing.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Active & Verified
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Official Marketing Pamphlets Card (6.5) */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                AssayBiz Promotional Pamphlets & Handouts (6.5)
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Printable double-sided (A5/A4 front & back) and single-sheet handouts for client meetings, trade shows, and field sales.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                <a href="/pamphlet" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Pamphlet
                </a>
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/pamphlet", "_blank")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-semibold text-sm text-white">AssayBiz Double-Sided & Single-Sheet Pamphlets</h5>
                <p className="text-xs text-slate-400">Includes core module highlights, ₹0 to ₹999 package pricing, 20% discount offer, and demo QR code.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Ready to Print
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Launch Kit Card (6.6) */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Social Media Launch Kit & Posts (6.6)
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Launch announcement posts, graphics, and broadcast templates tailored for Instagram, Facebook, LinkedIn, WhatsApp, and YouTube.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold"
              >
                <a href="/launch-posts" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Launch Kit
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-600/10 text-amber-400 border border-amber-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-semibold text-sm text-white">4 Visual Launch Creatives & Multi-Platform Captions</h5>
                <p className="text-xs text-slate-400">Includes 1-click caption copying, WhatsApp broadcast trigger, and launch coupon LAUNCH20.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              5 Platforms
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSocials, savePlatformSocials, formatSocialUrl, DEFAULT_PLATFORM_SOCIALS } from "@/hooks/use-platform-socials";
import { YoutubeIcon, FacebookIcon, InstagramIcon, SocialMediaLinks } from "@/components/shared/SocialMediaLinks";
import { Loader2, Save, ExternalLink, RotateCcw, Share2, Phone, CheckCircle2 } from "lucide-react";

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
    </div>
  );
}

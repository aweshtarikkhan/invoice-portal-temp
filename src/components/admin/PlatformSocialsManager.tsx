import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSocials, savePlatformSocials, formatSocialUrl, DEFAULT_PLATFORM_SOCIALS } from "@/hooks/use-platform-socials";
import { YoutubeIcon, FacebookIcon, InstagramIcon, LinkedinIcon } from "@/components/shared/SocialMediaLinks";
import { 
  Loader2, Save, ExternalLink, RotateCcw, Share2, Phone, CheckCircle2, 
  FileText, Printer, Layers, Sparkles, MessageSquare, Upload, Download, Trash2, Check, FileCheck 
} from "lucide-react";
import { AassayBizBrand } from "@/components/shared/AassayBizBrand";

export function PlatformSocialsManager() {
  const { socials: currentSocials, loading } = usePlatformSocials();
  const [formData, setFormData] = useState(currentSocials);
  const [saving, setSaving] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [uploadingPamphlet, setUploadingPamphlet] = useState(false);
  const brochureInputRef = useRef<HTMLInputElement>(null);
  const pamphletInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setFormData(currentSocials);
    }
  }, [loading, currentSocials]);

  const handleSave = async (updatedData?: typeof formData) => {
    setSaving(true);
    const dataToSave = updatedData || formData;
    const res = await savePlatformSocials(dataToSave);
    setSaving(false);

    if (res.success) {
      toast({
        title: "Platform Socials Updated! 🚀",
        description: "Official social media handles and collateral links are now live across the platform.",
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

  // Upload custom brochure file (PDF or Image)
  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBrochure(true);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const cleanFileName = `official_brochure_${Date.now()}.${ext}`;
      const filePath = `collateral/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portal-ads')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-ads')
        .getPublicUrl(filePath);

      const nextData = { ...formData, custom_brochure_url: publicUrl };
      setFormData(nextData);
      await handleSave(nextData);

      toast({
        title: "Brochure Uploaded! 📄",
        description: "Custom brochure file has been uploaded and set as active.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload brochure file.",
        variant: "destructive",
      });
    } finally {
      setUploadingBrochure(false);
      if (brochureInputRef.current) brochureInputRef.current.value = "";
    }
  };

  // Upload custom pamphlet file (PDF or Image)
  const handlePamphletUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPamphlet(true);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const cleanFileName = `official_pamphlet_${Date.now()}.${ext}`;
      const filePath = `collateral/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portal-ads')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-ads')
        .getPublicUrl(filePath);

      const nextData = { ...formData, custom_pamphlet_url: publicUrl };
      setFormData(nextData);
      await handleSave(nextData);

      toast({
        title: "Pamphlet Uploaded! 📑",
        description: "Custom pamphlet file has been uploaded and set as active.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload pamphlet file.",
        variant: "destructive",
      });
    } finally {
      setUploadingPamphlet(false);
      if (pamphletInputRef.current) pamphletInputRef.current.value = "";
    }
  };

  const handleRemoveBrochure = async () => {
    const nextData = { ...formData, custom_brochure_url: "" };
    setFormData(nextData);
    await handleSave(nextData);
    toast({
      title: "Reverted to Built-in Brochure",
      description: "Default responsive HTML brochure is now active.",
    });
  };

  const handleRemovePamphlet = async () => {
    const nextData = { ...formData, custom_pamphlet_url: "" };
    setFormData(nextData);
    await handleSave(nextData);
    toast({
      title: "Reverted to Built-in Pamphlet",
      description: "Default responsive HTML pamphlet is now active.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
      </div>
    );
  }

  const previewYoutube = formatSocialUrl("youtube", formData.youtube);
  const previewFacebook = formatSocialUrl("facebook", formData.facebook);
  const previewInstagram = formatSocialUrl("instagram", formData.instagram);
  const previewLinkedin = formatSocialUrl("linkedin", formData.linkedin);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Social Media Links Card */}
      <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50/70 to-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Official <AassayBizBrand /> Social Media Channels & Links
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-1">
                Configure official social media links. These links immediately update across the public Landing Page, Footer, and Platform Navigation.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* YouTube */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="p-1 rounded bg-red-600/10 text-red-600">
                    <YoutubeIcon className="w-3.5 h-3.5" />
                  </span>
                  YouTube Channel
                </Label>
                {previewYoutube && (
                  <a
                    href={previewYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Test <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="https://youtube.com/@assaybiz or @assaybiz"
                className="bg-white border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              />
              <p className="text-[11px] text-slate-500">
                Full URL or handle (e.g. <code>https://youtube.com/@assaybiz</code>)
              </p>
            </div>

            {/* Facebook */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="p-1 rounded bg-blue-600/10 text-blue-600">
                    <FacebookIcon className="w-3.5 h-3.5" />
                  </span>
                  Facebook Page
                </Label>
                {previewFacebook && (
                  <a
                    href={previewFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Test <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/assaybiz or assaybiz"
                className="bg-white border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              />
              <p className="text-[11px] text-slate-500">
                Full URL or username (e.g. <code>https://facebook.com/assaybiz</code>)
              </p>
            </div>

            {/* Instagram */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="p-1 rounded bg-pink-600/10 text-pink-600">
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </span>
                  Instagram Handle
                </Label>
                {previewInstagram && (
                  <a
                    href={previewInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-pink-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Test <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/assaybiz or @assaybiz"
                className="bg-white border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              />
              <p className="text-[11px] text-slate-500">
                Full URL or handle (e.g. <code>https://instagram.com/assaybiz</code>)
              </p>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="p-1 rounded bg-sky-600/10 text-sky-600">
                    <LinkedinIcon className="w-3.5 h-3.5" />
                  </span>
                  LinkedIn Page
                </Label>
                {previewLinkedin && (
                  <a
                    href={previewLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Test <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                value={formData.linkedin || ""}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/assaybiz"
                className="bg-white border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              />
              <p className="text-[11px] text-slate-500">
                Full URL or company handle (e.g. <code>https://linkedin.com/company/assaybiz</code>)
              </p>
            </div>

            {/* Contact / Phone */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="p-1 rounded bg-emerald-600/10 text-emerald-600">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  Platform Contact Helpline / Mobile
                </Label>
                {formData.phone && (
                  <span className="text-[11px] text-emerald-700 font-semibold">Active</span>
                )}
              </div>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 7806025875"
                className="bg-white border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              />
              <p className="text-[11px] text-slate-500">
                Official contact phone number displayed in public footer & WhatsApp integration.
              </p>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live Landing Page Icons Preview
              </div>
              <span className="text-[11px] text-slate-500">Rendered in Landing Page Footer & Header</span>
            </div>
            <div className="p-4 bg-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200">
              <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                Connect with <AassayBizBrand />:
              </div>
              <div className="flex items-center gap-2.5">
                {previewFacebook && (
                  <a
                    href={previewFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                )}
                {previewInstagram && (
                  <a
                    href={previewInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-600 hover:text-white transition-all shadow-sm"
                    title="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {previewYoutube && (
                  <a
                    href={previewYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="YouTube"
                  >
                    <YoutubeIcon className="w-4 h-4" />
                  </a>
                )}
                {previewLinkedin && (
                  <a
                    href={previewLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-600 hover:text-white transition-all shadow-sm"
                    title="LinkedIn"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={() => handleSave()}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-10 shadow-md shadow-indigo-600/20"
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

      {/* Official Marketing Assets & Brochure Card with Direct Upload */}
      <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/70 to-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <FileText className="w-5 h-5 text-blue-600" />
                Product & Pricing Brochure
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-1">
                Official AassayBiz brochure. Upload your custom-designed PDF/Image, or use the dynamic built-in printable brochure.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
              >
                <a href="/brochure" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Live Brochure
                </a>
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/brochure", "_blank")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Upload Status & File Actions */}
          {formData.custom_brochure_url ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-sm text-emerald-950">Custom Uploaded Brochure Active</h5>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
                      Direct PDF / Image
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Visitors clicking "Download Brochure" or visiting /brochure will receive your uploaded file.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold"
                >
                  <a href={formData.custom_brochure_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" /> View File
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => brochureInputRef.current?.click()}
                  disabled={uploadingBrochure}
                  className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  <Upload className="w-3 h-3 mr-1" /> Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveBrochure}
                  className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Remove and revert to built-in dynamic HTML brochure"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-800">Default Built-in HTML Brochure Active</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Currently serving the 2-page responsive web edition with dynamic pricing and module tables.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => brochureInputRef.current?.click()}
                disabled={uploadingBrochure}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
              >
                {uploadingBrochure ? (
                  <>
                    <Loader2 className="animate-spin w-3.5 h-3.5 mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Upload Custom Brochure (PDF/Image)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={brochureInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleBrochureUpload}
          />
        </CardContent>
      </Card>

      {/* Official Marketing Pamphlets Card with Direct Upload */}
      <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50/70 to-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Layers className="w-5 h-5 text-purple-600" />
                Pamphlets & Handouts (Flyers)
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-1">
                Promotional flyers and handouts for sales visits. Upload your custom flyer PDF/Image, or use the built-in printable flyer.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
              >
                <a href="/pamphlet" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Live Pamphlet
                </a>
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/pamphlet", "_blank")}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Upload Status & File Actions */}
          {formData.custom_pamphlet_url ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-sm text-emerald-950">Custom Uploaded Pamphlet Active</h5>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
                      Direct PDF / Image
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Visitors opening /pamphlet will receive your uploaded custom handout file.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold"
                >
                  <a href={formData.custom_pamphlet_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" /> View File
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pamphletInputRef.current?.click()}
                  disabled={uploadingPamphlet}
                  className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  <Upload className="w-3 h-3 mr-1" /> Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemovePamphlet}
                  className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Remove and revert to built-in dynamic HTML pamphlet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-800">Default Built-in Pamphlet Active</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Currently serving the 2-sided flyer & single-page handout with ₹0 to ₹999 package pricing and demo QR.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => pamphletInputRef.current?.click()}
                disabled={uploadingPamphlet}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0"
              >
                {uploadingPamphlet ? (
                  <>
                    <Loader2 className="animate-spin w-3.5 h-3.5 mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Upload Custom Pamphlet (PDF/Image)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={pamphletInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handlePamphletUpload}
          />
        </CardContent>
      </Card>

      {/* Social Media Launch Kit Card (6.6) */}
      <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50/70 to-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Social Media Launch Kit & Posts
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-1">
                Launch announcement posts, graphics, and broadcast templates tailored for Instagram, Facebook, LinkedIn, WhatsApp, and YouTube.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <a href="/launch-posts" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Launch Kit
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-600/10 text-amber-600 border border-amber-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800">4 Visual Launch Creatives & Multi-Platform Captions</h5>
                <p className="text-xs text-slate-500">Includes 1-click caption copying, WhatsApp broadcast trigger, and launch coupon LAUNCH20.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              5 Platforms Ready
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Trash2, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Extended list of highly realistic handwriting/signature fonts
const SIGNATURE_FONTS = [
  "Mrs Saint Delafield",
  "Herr Von Muellerhoff",
  "Monsieur La Doulaise",
  "Kristi",
  "La Belle Aurore",
  "Zeyada",
  "Nothing You Could Do",
  "Homemade Apple",
  "Cedarville Cursive",
  "Meie Script",
  "Pinyon Script",
  "Great Vibes",
  "Alex Brush",
  "Parisienne",
  "Sacramento",
  "Caveat"
];

export function SignatureSettingsTab() {
  const org = useAppStore((s) => s.organization);
  const setOrganization = useAppStore((s) => s.setOrganization);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [sigType, setSigType] = useState(org?.address?.signature_type || "none");
  const [sigName, setSigName] = useState(org?.address?.signature_name || "");
  const [sigFont, setSigFont] = useState(org?.address?.signature_font || "Mrs Saint Delafield");
  const [sigImageUrl, setSigImageUrl] = useState(org?.address?.signature_image_url || "");

  const handleSave = async () => {
    if (!org) return;
    setIsLoading(true);
    try {
      const updatedAddress = {
        ...(org.address || {}),
        signature_type: sigType,
        signature_name: sigName,
        signature_font: sigFont,
        signature_image_url: sigImageUrl,
      };

      const { error } = await supabase
        .from("organizations")
        .update({ address: updatedAddress })
        .eq("id", org.id);

      if (error) throw error;

      setOrganization({ ...org, address: updatedAddress });
      toast({ title: "Signature settings saved!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      toast({ title: "Uploading...", description: "Uploading signature image." });
      
      const fileName = `signature-${Date.now()}-${file.name}`;
      const filePath = `${org?.id}/${fileName}`;
      
      const { error } = await supabase.storage
        .from("org-logos") // Use existing public bucket
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);

      setSigImageUrl(publicUrlData.publicUrl);
      setSigType("image");
      toast({ title: "Upload successful" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Failed to process image.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized Signature</CardTitle>
        <CardDescription>
          Configure the signature that appears on your invoices, estimates, and purchase orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={sigType} onValueChange={setSigType} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="sig-none" />
            <Label htmlFor="sig-none">None</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="sig-image" />
            <Label htmlFor="sig-image">Upload Image</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="font" id="sig-font" />
            <Label htmlFor="sig-font">Generate from Name</Label>
          </div>
        </RadioGroup>

        {sigType === "image" && (
          <div className="space-y-4 border p-4 rounded-md bg-muted/20">
            <div>
              <Label>Upload Signature Image</Label>
              <div className="mt-2 flex items-center gap-4">
                <Button variant="outline" type="button" onClick={() => document.getElementById("sig-upload")?.click()} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Select File
                </Button>
                <input
                  type="file"
                  id="sig-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImage}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Upload a transparent PNG image for the best results.
              </p>
            </div>
            {sigImageUrl && (
              <div className="mt-4 p-4 border rounded bg-white relative max-w-sm">
                <img src={sigImageUrl} alt="Signature" className="max-h-24 object-contain" />
                <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full" onClick={() => setSigImageUrl("")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {sigType === "font" && (
          <div className="space-y-4 border p-4 rounded-md bg-muted/20">
            <div className="space-y-2">
              <Label>Name for Signature</Label>
              <Input
                value={sigName}
                onChange={(e) => setSigName(e.target.value)}
                placeholder="e.g. John Doe"
                className="max-w-md bg-white"
              />
            </div>
            
            {sigName && (
              <div className="space-y-3 pt-2">
                <Label>Select Realistic Signature Style</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 bg-white p-4 border rounded-md max-h-[300px] overflow-y-auto">
                  {SIGNATURE_FONTS.map(font => (
                    <div
                      key={font}
                      onClick={() => setSigFont(font)}
                      className={`relative flex items-center justify-center p-4 border rounded-md cursor-pointer hover:border-primary transition-all overflow-hidden ${sigFont === font ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                      style={{ height: '80px' }}
                    >
                      <span 
                        style={{ fontFamily: font, fontSize: '1.8rem', whiteSpace: 'nowrap', color: '#1e293b' }}
                      >
                        {sigName}
                      </span>
                      {sigFont === font && (
                        <div className="absolute top-2 right-2 text-primary">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Signature Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

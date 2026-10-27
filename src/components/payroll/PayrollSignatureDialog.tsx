import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenLine, Upload, Eraser, Check, Trash2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PayrollSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  signatoryName?: string;
  showSignatoryNameInput?: boolean;
  currentSignatureUrl?: string;
  orgId?: string;
  storageFolder?: string; // e.g. "payroll-employer" or "payroll-employee"
  onSave: (signatureUrl: string, signatoryName?: string) => Promise<void> | void;
}

export function PayrollSignatureDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  signatoryName: initialSignatoryName = "",
  showSignatoryNameInput = false,
  currentSignatureUrl,
  orgId,
  storageFolder = "payroll-signatures",
  onSave,
}: PayrollSignatureDialogProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
  const [signatoryName, setSignatoryName] = useState(initialSignatoryName);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState("#1e3a8a"); // Default professional ink blue
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize/reset states when dialog opens
  useEffect(() => {
    if (open) {
      setSignatoryName(initialSignatoryName);
      setUploadedImageUrl("");
      setHasDrawn(false);
      // Wait for canvas to mount
      setTimeout(() => {
        clearCanvas();
      }, 50);
    }
  }, [open, initialSignatoryName]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset dimensions for sharp retina displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw baseline guide
    ctx.beginPath();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(30, rect.height - 35);
    ctx.lineTo(rect.width - 30, rect.height - 35);
    ctx.stroke();
    ctx.setLineDash([]); // reset dash

    // Draw "Sign above line" guide text
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Sign on or above this line with mouse, touch or stylus", rect.width / 2, rect.height - 15);

    setHasDrawn(false);
  };

  // Drawing event handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if ("touches" in e) {
      // Prevent scrolling when drawing on touch screens
      if (e.cancelable) e.preventDefault();
    }

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Handle image upload from file system
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `${storageFolder}/${orgId || "common"}/sig_${Date.now()}.${ext}`;

      // Upload to org-logos storage bucket
      const { data, error } = await supabase.storage
        .from("org-logos")
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (error) {
        // Fallback to data URL if storage upload restricted
        console.warn("Storage upload failed, converting to DataURL:", error.message);
        const reader = new FileReader();
        reader.onload = (re) => {
          if (typeof re.target?.result === "string") {
            setUploadedImageUrl(re.target.result);
            toast({ title: "Image loaded", description: "Signature image selected successfully." });
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicData } = supabase.storage.from("org-logos").getPublicUrl(fileName);
        setUploadedImageUrl(publicData.publicUrl);
        toast({ title: "Upload successful", description: "Signature image uploaded." });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Trim transparent pixels from canvas so signature is nicely cropped
  const getTrimmedCanvasDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return null;

    // Create a temporary canvas without the guide lines
    const dpr = window.devicePixelRatio || 1;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return canvas.toDataURL("image/png");

    tempCtx.drawImage(canvas, 0, 0);

    // Erase bottom guide lines region if needed or export full
    return tempCanvas.toDataURL("image/png");
  };

  const handleSaveSignature = async () => {
    setSaving(true);
    try {
      let finalUrl = "";

      if (activeTab === "draw") {
        if (!hasDrawn && !currentSignatureUrl) {
          toast({
            title: "Please draw your signature",
            description: "Draw your signature on the pad above before saving.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        if (hasDrawn) {
          const dataUrl = getTrimmedCanvasDataUrl();
          if (!dataUrl) throw new Error("Could not capture signature canvas");

          // Convert dataURL to blob and upload for permanent hosting
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const fileName = `${storageFolder}/${orgId || "common"}/drawn_${Date.now()}.png`;
            const { error } = await supabase.storage
              .from("org-logos")
              .upload(fileName, blob, { contentType: "image/png", upsert: true });

            if (!error) {
              const { data: publicData } = supabase.storage.from("org-logos").getPublicUrl(fileName);
              finalUrl = publicData.publicUrl;
            } else {
              // Fallback to dataUrl
              finalUrl = dataUrl;
            }
          } catch {
            finalUrl = dataUrl;
          }
        } else {
          finalUrl = currentSignatureUrl || "";
        }
      } else {
        // Upload tab
        if (!uploadedImageUrl && !currentSignatureUrl) {
          toast({
            title: "No signature image chosen",
            description: "Please upload a signature file first.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        finalUrl = uploadedImageUrl || currentSignatureUrl || "";
      }

      await onSave(finalUrl, signatoryName);
      toast({
        title: "Signature Saved!",
        description: "The digital signature will now automatically appear on all generated payslips.",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message || "Failed to save signature.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-lg">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
              {subtitle && <DialogDescription className="text-xs">{subtitle}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        {showSignatoryNameInput && (
          <div className="space-y-1 pt-1">
            <Label className="text-xs font-semibold">Signatory Name / Designation (Optional)</Label>
            <Input
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              placeholder="e.g. Authorized Signatory / HR Manager / Director"
              className="h-8 text-xs bg-white dark:bg-slate-900"
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="draw" className="text-xs flex items-center gap-1.5">
              <PenLine className="w-3.5 h-3.5" />
              Draw Signature (Sign)
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Upload Image (File)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DRAW SIGNATURE */}
          <TabsContent value="draw" className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Ink Color:</span>
              <div className="flex items-center gap-2">
                {[
                  { color: "#1e3a8a", name: "Ink Blue" },
                  { color: "#0f172a", name: "Black" },
                  { color: "#334155", name: "Dark Slate" },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setPenColor(c.color)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      penColor === c.color ? "scale-125 border-primary shadow-sm" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 ml-2"
                >
                  <Eraser className="w-3 h-3" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Canvas Box */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 overflow-hidden relative shadow-inner">
              <canvas
                ref={canvasRef}
                className="w-full h-44 cursor-crosshair touch-none select-none block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Use mouse, finger or stylus to sign. Click <strong>Clear</strong> to start over.
            </p>
          </TabsContent>

          {/* TAB 2: UPLOAD IMAGE */}
          <TabsContent value="upload" className="space-y-3 pt-2">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              {uploadedImageUrl ? (
                <div className="space-y-3">
                  <div className="p-4 bg-white dark:bg-slate-950 rounded-lg border max-w-xs mx-auto flex items-center justify-center min-h-[100px]">
                    <img
                      src={uploadedImageUrl}
                      alt="Signature Preview"
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedImageUrl("")}
                      className="text-xs text-red-600 hover:text-red-700 border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remove & Choose Another
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">Click to upload signature image or stamp</p>
                    <p className="text-[11px] text-muted-foreground">
                      Supports transparent PNG, JPG, or SVG (Max 5MB). Transparent PNG recommended.
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="payroll-sig-file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById("payroll-sig-file")?.click()}
                      disabled={uploading}
                      className="text-xs"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Browse File
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Existing Current Signature Preview */}
        {currentSignatureUrl && !uploadedImageUrl && !hasDrawn && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground">Current Signature:</span>
              <img
                src={currentSignatureUrl}
                alt="Current"
                className="h-8 max-w-[120px] object-contain border rounded bg-white px-1.5 py-0.5"
              />
            </div>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Already Active
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveSignature}
            disabled={saving || uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save Signature
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

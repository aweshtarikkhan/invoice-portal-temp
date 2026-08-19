import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, Upload, MapPin, Phone, Building, Settings, Sparkles, Eraser, Trash2, Undo, Redo, Square, Type, Image as ImageIcon, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, PenTool, Calendar, ArrowRight, Share2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import html2canvas from "html2canvas";





import { removeBackground } from '@imgly/background-removal';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ShareCampaignDialog } from "@/components/marketing/ShareCampaignDialog";

type PosterTemplate = {
  id: string;
  festival_name: string;
  bg_image_url: string;
  default_text: string;
};

type CanvasElementType = "text" | "image" | "shape";

type CanvasElement = {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  zIndex: number;
  
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  
  width?: number;
  height?: number;
  maxWidth?: number;
  bgColor?: string;
  opacity?: number;
  borderRadius?: number;

  src?: string;
};

type ViewState = "categories" | "gallery" | "preview" | "editor";

const GRADIENT_MAP: Record<string, string> = {
  "Raksha Bandhan": "linear-gradient(135deg, #e11d48, #9f1239)",
  "Ganesh Chaturthi": "linear-gradient(135deg, #f59e0b, #d97706)",
  "Dussehra": "linear-gradient(135deg, #ea580c, #c2410c)",
  "Diwali": "linear-gradient(135deg, #d97706, #b45309)",
  "Christmas": "linear-gradient(135deg, #dc2626, #991b1b)",
  "New Year": "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  "Makar Sankranti": "linear-gradient(135deg, #f59e0b, #eab308)",
  "Republic Day": "linear-gradient(135deg, #f97316, #22c55e)",
  "Holi": "linear-gradient(135deg, #db2777, #9333ea, #3b82f6)",
  "Eid": "linear-gradient(135deg, #059669, #065f46)",
  "Independence Day": "linear-gradient(135deg, #f97316, #ffffff, #22c55e)",
  "Navratri": "linear-gradient(135deg, #16a34a, #047857)",
};

const TITLE_COLOR_MAP: Record<string, string> = {
  "Raksha Bandhan": "#ffe4e6",
  "Ganesh Chaturthi": "#fef3c7",
  "Dussehra": "#ffedd5",
  "Diwali": "#fef3c7",
  "Christmas": "#fef2f2",
  "New Year": "#eff6ff",
  "Makar Sankranti": "#fef9c3",
  "Republic Day": "#ffffff",
  "Holi": "#ffffff",
  "Eid": "#ecfdf5",
  "Independence Day": "#0f172a",
  "Navratri": "#f0fdf4",
};

const FONT_FAMILIES = [
  { value: "system-ui, sans-serif", label: "Default" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Playfair Display', serif", label: "Playfair" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Brush Script MT', cursive", label: "Cursive" },
  { value: "'Courier New', monospace", label: "Typewriter" }
];

export default function MarketingPostersPage() {
  const org = useAppStore((s) => s.organization);
  const [templates, setTemplates] = useState<PosterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("categories");
  const [showFooterBox, setShowFooterBox] = useState(false);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<CanvasElement[][]>([]);
  const historyIndexRef = useRef<number>(-1);

  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [bgStyle, setBgStyle] = useState<"normal" | "gradient" | "darken">("normal");

  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePosterDataUrl, setSharePosterDataUrl] = useState<string | null>(null);
  const [preparingShare, setPreparingShare] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (view !== "editor") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && activeElementId) {
        removeElement(activeElementId);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeElementId, view, history, historyIndex]);

  const updateElements = (newElements: CanvasElement[]) => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    
    // slice up to current index + 1 to discard any redo future
    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push(newElements);
    if (newHistory.length > 50) newHistory.shift();
    
    const newIndex = newHistory.length - 1;
    
    historyRef.current = newHistory;
    historyIndexRef.current = newIndex;
    
    setHistory(newHistory);
    setHistoryIndex(newIndex);
    setElements(newElements);
  };

  const undo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setElements(historyRef.current[newIndex]);
      setActiveElementId(null);
    }
  };

  const redo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      const newIndex = currentIndex + 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setElements(historyRef.current[newIndex]);
      setActiveElementId(null);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("poster_templates")
      .select("*")
      .order("created_at", { ascending: true });
      
    let processedData: any[] = [];
    if (!error && data) {
      processedData = data.map((t: any) => ({ ...t }));
    } else if (error) {
      toast.error("Failed to load templates");
    }

    // Load local posters from dynamic folders
    const localPosters = import.meta.glob('@/assets/posters/**/*.png', { eager: true, as: 'url' }) as Record<string, string>;
    const dynamicTemplates: PosterTemplate[] = [];
    const festivalsWithLocalPosters = new Set<string>();
    
    Object.keys(localPosters).forEach((path, index) => {
       const parts = path.split('/');
       const festival = parts[parts.length - 2];
       festivalsWithLocalPosters.add(festival);
       dynamicTemplates.push({
          id: `local_${festival}_${index}`,
          festival_name: festival,
          bg_image_url: localPosters[path],
          default_text: "Wishing you a happy " + festival
       });
    });

    // Remove Supabase templates for festivals that now have local posters
    processedData = processedData.filter(t => !festivalsWithLocalPosters.has(t.festival_name));
    processedData = [...processedData, ...dynamicTemplates];

    const FESTIVAL_ORDER = ["Raksha Bandhan", "Ganesh Chaturthi", "Dussehra", "Navratri", "Diwali", "Christmas", "New Year", "Makar Sankranti", "Republic Day", "Holi", "Eid", "Independence Day"];
    const missingFestivals = FESTIVAL_ORDER.filter(f => !processedData.some((p: any) => p.festival_name === f));
    missingFestivals.forEach(f => {
       processedData.push({
          id: `temp_${f}`,
          festival_name: f,
          bg_image_url: "",
          default_text: "Wishing you a happy " + f
       });
    });

    setTemplates(processedData);
    setLoading(false);
  };

  const buildDefaultPoster = (t: PosterTemplate) => {
    let bizName = org?.name || "Your Business Name";
    let phone = (org as any)?.phone || "";
    let address = "";
    const addr = (org as any)?.address;
    if (typeof addr === "string") address = addr;
    else if (typeof addr === "object" && addr !== null) {
      address = [addr.street1, addr.street2, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
    }
    const logoUrl = (org as any)?.logo_url || "";

    const initialElements: CanvasElement[] = [];
    
    // Bottom Sleek Footer Shape
    initialElements.push({ id: "footer-box", type: "shape", width: 400, height: 60, bgColor: "#000000", opacity: 70, borderRadius: 0, x: 0, y: 440, zIndex: 20 });

    // Business Name (Centered, x=200 since text has translateX(-50%))
    initialElements.push({ id: "biz-name", type: "text", text: bizName.toUpperCase(), color: "#ffffff", fontSize: 16, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, x: 200, y: 448, zIndex: 21, maxWidth: 360 });
    
    // Contact Info (Phone + Address in one line, Centered)
    const contactParts = [];
    if (phone) contactParts.push(`📞 ${phone}`);
    if (address) {
      const shortAddr = address.length > 40 ? address.substring(0, 40) + '...' : address;
      contactParts.push(`📍 ${shortAddr}`);
    }
    const contactText = contactParts.join("  |  ");
    
    if (contactText) {
      initialElements.push({ id: "biz-contact", type: "text", text: contactText, color: "#e2e8f0", fontSize: 10, fontFamily: "system-ui, sans-serif", fontWeight: 500, x: 200, y: 475, zIndex: 21, maxWidth: 380 });
    }

    // Logo (Top Center for best visibility)
    if (logoUrl) {
      // image does not have translateX(-50%), so center x = (400 - 70) / 2 = 165
      initialElements.push({ id: "biz-logo", type: "image", src: logoUrl, width: 70, height: 70, x: 165, y: 20, zIndex: 30 });
    }

    setElements(initialElements);
    setHistory([initialElements]);
    setHistoryIndex(0);
    setActiveElementId(null);
  };

  const handleSelectTemplate = (t: PosterTemplate) => {
    setSelectedTemplate(t);
    buildDefaultPoster(t);
    setView("preview");
  };

  const getGradient = (festival?: string) => GRADIENT_MAP[festival || ""] || "linear-gradient(135deg, #1e293b, #0f172a)";
  const getTitleColor = (festival?: string) => TITLE_COLOR_MAP[festival || ""] || "#ffffff";

  const hexToRgba = (hex: string, alpha: number) => {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  };

  const handlePointerDownElement = (id: string, e: React.PointerEvent) => {
    if (view !== "editor") return;
    
    e.stopPropagation();
    setDraggingId(id);
    setActiveElementId(id);
    
    const el = elements.find(b => b.id === id);
    if (!el) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = el.x;
    const initialY = el.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setElements(prev => prev.map(b => 
        b.id === id ? { ...b, x: initialX + dx, y: initialY + dy } : b
      ));
    };

    const handlePointerUp = () => {
      setDraggingId(null);
      setElements(currentEls => {
        setTimeout(() => updateElements([...currentEls]), 0);
        return currentEls;
      });
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const addText = (presetText = "New Text", fontSize = 24, fontWeight = 700) => {
    const newId = Date.now().toString();
    const maxZ = Math.max(0, ...elements.map(e => e.zIndex));
    updateElements([...elements, { id: newId, type: "text", text: presetText, color: "#ffffff", fontSize, fontFamily: "system-ui, sans-serif", fontWeight, x: 200, y: 250, zIndex: maxZ + 1 }]);
    setActiveElementId(newId);
  };

  const addShape = () => {
    const newId = Date.now().toString();
    const maxZ = Math.max(0, ...elements.map(e => e.zIndex));
    updateElements([...elements, { id: newId, type: "shape", width: 250, height: 80, bgColor: "#000000", opacity: 60, borderRadius: 12, x: 75, y: 350, zIndex: maxZ + 1 }]);
    setActiveElementId(newId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newId = Date.now().toString();
      const maxZ = Math.max(0, ...elements.map(el => el.zIndex));
      updateElements([...elements, { id: newId, type: "image", src: url, width: 120, height: 120, x: 20, y: 20, zIndex: maxZ + 1 }]);
      setActiveElementId(newId);
    }
  };

  const removeBgFromActiveImage = async () => {
    const activeEl = elements.find(e => e.id === activeElementId);
    if (!activeEl || activeEl.type !== "image" || !activeEl.src) return;
    setRemovingBg(true);
    try {
      const blob = await removeBackground(activeEl.src);
      const transparentUrl = URL.createObjectURL(blob);
      updateActiveElement({ src: transparentUrl });
      toast.success("Background removed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove background");
    } finally {
      setRemovingBg(false);
    }
  };

  const updateActiveElement = (updates: Partial<CanvasElement>) => {
    if (!activeElementId) return;
    setElements(prev => prev.map(b => b.id === activeElementId ? { ...b, ...updates } : b));
  };

  const commitActiveElementChange = () => {
    setElements(currentEls => {
      setTimeout(() => updateElements([...currentEls]), 0);
      return currentEls;
    });
  };

  const removeElement = (id: string) => {
    setElements(currentEls => {
      const filtered = currentEls.filter(b => b.id !== id);
      setTimeout(() => updateElements(filtered), 0);
      return filtered;
    });
    if (activeElementId === id) setActiveElementId(null);
  };

  const clearAllElements = () => {
    updateElements([]);
    setActiveElementId(null);
    toast.success("All elements cleared!");
  };

  const reorderActiveElement = (direction: "up" | "down") => {
    if (!activeElementId) return;
    const el = elements.find(e => e.id === activeElementId);
    if (!el) return;
    setElements(prev => {
      const newElements = [...prev];
      const index = newElements.findIndex(e => e.id === activeElementId);
      if (direction === "up") newElements[index] = { ...el, zIndex: el.zIndex + 1 };
      else newElements[index] = { ...el, zIndex: Math.max(0, el.zIndex - 1) };
      setTimeout(() => updateElements(newElements), 0);
      return newElements;
    });
  };

  const handleGeneratePrompt = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAI(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const promptText = `You are a marketing expert. The user wants a poster for: "${aiPrompt}".
First, check if this is related to a festival, holiday, or celebration.
If it is NOT related to a festival, respond EXACTLY with the string: "ERROR: NOT_A_FESTIVAL".
If it IS related to a festival, return a JSON object with this exact format:
{
  "festivalName": "Short Catchy Festival Title",
  "message": "A short 1-2 line marketing message for businesses to wish their customers."
}
Only output the raw JSON or the ERROR string, no markdown, no other text.`;
      
      const result = await model.generateContent(promptText);
      const response = result.response.text().trim();
      
      if (response.includes("ERROR: NOT_A_FESTIVAL") || response.includes("NOT_A_FESTIVAL")) {
         toast.error("Only social media images for festival purposes are allowed.");
         return;
      }
      
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      const maxZ = Math.max(0, ...elements.map(e => e.zIndex));
      updateElements([
        ...elements,
        { id: Date.now().toString(), type: "text", text: data.festivalName, color: "#ffffff", fontSize: 36, fontFamily: "system-ui, sans-serif", fontWeight: 900, x: 200, y: 150, zIndex: maxZ + 1 },
        { id: (Date.now() + 1).toString(), type: "text", text: data.message, color: "#ffffff", fontSize: 16, fontFamily: "system-ui, sans-serif", fontWeight: 700, x: 200, y: 220, zIndex: maxZ + 2 }
      ]);
      toast.success("Generated poster text!");
      setAiPrompt("");
    } catch(err) {
      console.error(err);
      toast.error("Failed to generate text from prompt");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setActiveElementId(null);
    setDownloading(true);
    await new Promise(r => setTimeout(r, 50));
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `poster-${selectedTemplate?.festival_name || "download"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Poster downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate poster:", error);
      toast.error("Failed to generate poster. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareCampaign = async () => {
    if (!posterRef.current) return;
    setActiveElementId(null);
    setPreparingShare(true);
    console.log("Starting share campaign capture...");
    await new Promise(r => setTimeout(r, 50));
    try {
      console.log("Calling html2canvas...");
      const canvas = await Promise.race([
        html2canvas(posterRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
        }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("html2canvas timeout")), 8000))
      ]);
      console.log("html2canvas resolved", !!canvas);
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        setSharePosterDataUrl(dataUrl);
        setShareDialogOpen(true);
        console.log("Set dialog open to true");
      }
    } catch (error) {
      console.error("Failed to capture poster for sharing:", error);
      toast.error("Failed to prepare poster for sharing.");
    } finally {
      console.log("Resetting preparingShare to false");
      setPreparingShare(false);
    }
  };

  const activeBlock = elements.find(b => b.id === activeElementId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // GALLERY VIEW
  // ─────────────────────────────────────────────────────────────────
  if (view === "categories") {
    const FESTIVAL_ORDER = ["Raksha Bandhan", "Ganesh Chaturthi", "Dussehra", "Navratri", "Diwali", "Christmas", "New Year", "Makar Sankranti", "Republic Day", "Holi", "Eid", "Independence Day"]; const existingCats = Array.from(new Set(templates.map(t => t.festival_name))); const categories = Array.from(new Set([...FESTIVAL_ORDER, ...existingCats])).sort((a, b) => { const indexA = FESTIVAL_ORDER.indexOf(a); const indexB = FESTIVAL_ORDER.indexOf(b); if (indexA === -1 && indexB === -1) return a.localeCompare(b); if (indexA === -1) return 1; if (indexB === -1) return -1; return indexA - indexB; });
    return (
      <div className="space-y-8 max-w-[1200px] mx-auto p-4">
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" /> Marketing Posters
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select an upcoming festival or event. We will automatically generate a beautiful, branded poster for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
      const count = templates.filter(t => t.festival_name === category).length;
            const categoryTemplate = templates.find(t => t.festival_name === category);
            return (
              <div
                key={category}
                className="group cursor-pointer rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={() => {
                  setSelectedCategory(category);
                  setView("gallery");
                }}
              >
                <div
                  className="aspect-[4/5] relative flex flex-col justify-end p-6 bg-muted"
                >
                  {categoryTemplate?.bg_image_url && (
                    <img
                      src={categoryTemplate.bg_image_url}
                      alt={category}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-2xl text-white mb-2 tracking-wide drop-shadow-md">
                      {category}
                    </h3>
                    <div className="flex items-center text-white/80 text-sm font-medium drop-shadow-md">
                      <Calendar className="w-4 h-4 mr-2" />
                      {count} {count === 1 ? 'Template' : 'Templates'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "gallery") {
    const categoryTemplates = templates.filter(t => t.festival_name === selectedCategory);
    return (
      <div className="space-y-8 max-w-[1200px] mx-auto p-4 animate-in fade-in slide-in-from-right-8 duration-300">
        <div className="text-center space-y-4 py-8 relative">
          <Button variant="ghost" className="absolute left-0 top-8" onClick={() => setView("categories")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Categories
          </Button>
          <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3">
            {selectedCategory}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a poster design from the {selectedCategory} collection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryTemplates.map((t, idx) => (
            <div
              key={t.id}
              className="group cursor-pointer rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              onClick={() => handleSelectTemplate(t)}
            >
              <div
                className="aspect-[4/5] relative flex flex-col justify-end p-6 bg-muted"
              >
                {t.bg_image_url && (
                  <img
                    src={t.bg_image_url}
                    alt={t.festival_name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-bold text-xl text-white mb-2 tracking-wide drop-shadow-md">
                    Design {idx + 1}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER CANVAS (Used in both Preview & Editor views)
  // ─────────────────────────────────────────────────────────────────
  const renderCanvas = () => (
    <div
      ref={posterRef}
      className="relative overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ring-1 ring-border"
      style={{
        width: 400,
        height: 500,
        backgroundColor: "#111",
      }}
    >
      {!selectedTemplate?.bg_image_url && (
        <div 
           className="absolute inset-0 pointer-events-none"
           style={{ background: getGradient(selectedTemplate?.festival_name) }}
        />
      )}

      {selectedTemplate?.bg_image_url && (
        <img
          src={selectedTemplate.bg_image_url}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0 }}
          crossOrigin="anonymous"
          alt="background"
        />
      )}

      {bgStyle !== "normal" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: bgStyle === "gradient" ? getGradient(selectedTemplate?.festival_name) : "#000000",
            opacity: bgStyle === "gradient" ? 0.45 : 0.4,
            mixBlendMode: bgStyle === "gradient" ? "overlay" : "normal"
          }}
        />
      )}

      {elements.sort((a, b) => a.zIndex - b.zIndex).map(el => {
        const isActive = activeElementId === el.id && view === "editor";
        const borderStyle = isActive ? "2px solid #3b82f6" : "2px solid transparent";
        const outlineStyle = isActive ? "outline outline-4 outline-blue-500/20" : "none";
        
        if (el.type === "text") {
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.type === "shape" ? el.x : (el.x /* For backwards compatibility, text might be center-anchored? Wait, previously text was transformed. Let's keep it consistent. */),
                top: el.y,
                transform: 'translateX(-50%)', // Only text uses translateX in our old code
                color: el.color,
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                cursor: view === "editor" ? (draggingId === el.id ? 'grabbing' : 'grab') : 'default',
                zIndex: el.zIndex,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                textShadow: "2px 2px 6px rgba(0,0,0,0.7)",
                border: borderStyle,
                outline: outlineStyle,
                padding: "4px 8px",
                borderRadius: 4,
                width: "max-content",
                maxWidth: el.maxWidth ? `${el.maxWidth}px` : "100%",
                userSelect: "none"
              }}
              onPointerDown={(e) => handlePointerDownElement(el.id, e)}
            >
              {el.text}
            </div>
          );
        }
        
        if (el.type === "shape") {
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                backgroundColor: el.bgColor ? hexToRgba(el.bgColor, el.opacity ?? 100) : "transparent",
                borderRadius: el.borderRadius,
                backdropFilter: (el.opacity ?? 100) > 0 && (el.opacity ?? 100) < 100 ? "blur(8px)" : "none",
                cursor: view === "editor" ? (draggingId === el.id ? 'grabbing' : 'grab') : 'default',
                zIndex: el.zIndex,
                border: borderStyle,
                outline: outlineStyle,
              }}
              onPointerDown={(e) => handlePointerDownElement(el.id, e)}
            />
          );
        }

        if (el.type === "image") {
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                cursor: view === "editor" ? (draggingId === el.id ? 'grabbing' : 'grab') : 'default',
                zIndex: el.zIndex,
                border: borderStyle,
                outline: outlineStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPointerDown={(e) => handlePointerDownElement(el.id, e)}
            >
              {el.src && <img src={el.src} alt="layer" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />}
            </div>
          );
        }
        return null;
      })}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // PREVIEW VIEW
  // ─────────────────────────────────────────────────────────────────
  if (view === "preview") {
    const bizNameEl = elements.find(e => e.id === "biz-name");
    const bizPhoneEl = elements.find(e => e.id === "biz-phone");
    const bizAddressEl = elements.find(e => e.id === "biz-address");

    const handleQuickTextChange = (id: string, val: string) => {
      setElements(prev => prev.map(e => e.id === id ? { ...e, text: val } : e));
    };

    const handleQuickLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setElements(prev => {
        if (prev.some(el => el.id === "biz-logo")) {
          return prev.map(el => el.id === "biz-logo" ? { ...el, src: url, opacity: 100 } : el);
        } else {
          return [...prev, { id: "biz-logo", type: "image", src: url, width: 80, height: 80, x: 20, y: 20, zIndex: 30 }];
        }
      });
    };

    const updateLogoPosition = (pos: string) => {
      let lx = 20, ly = 20;
      if (pos === "top-right") { lx = 300; ly = 20; }
      if (pos === "bottom-left") { lx = 20; ly = 320; }
      if (pos === "bottom-right") { lx = 300; ly = 320; }
      if (pos === "center") { lx = 160; ly = 160; }
      setElements(prev => prev.map(e => e.id === "biz-logo" ? { ...e, x: lx, y: ly, opacity: pos === "hidden" ? 0 : 100 } : e));
    };

    const updateFooterPosition = (pos: string) => {
      const boxY = pos === "bottom" ? 400 : (pos === "top" ? 0 : -1000);
      const nameY = boxY + 20;
      const phoneY = boxY + 50;
      const addressY = boxY + 50;
      setElements(prev => prev.map(e => {
        if (e.id === "footer-box") return { ...e, y: boxY, opacity: pos === "hidden" ? 0 : (showFooterBox ? 70 : 0) };
        if (e.id === "biz-name") return { ...e, y: nameY, opacity: pos === "hidden" ? 0 : 100 };
        if (e.id === "biz-phone") return { ...e, y: phoneY, opacity: pos === "hidden" ? 0 : 100 };
        if (e.id === "biz-address") return { ...e, y: addressY, opacity: pos === "hidden" ? 0 : 100 };
        return e;
      }));
    };

    const handleToggleFooterBox = (checked: boolean) => {
      setShowFooterBox(checked);
      setElements(prev => prev.map(e => {
        if (e.id === "footer-box") {
          // If the footer is not hidden by position, apply the new opacity
          // We can check if it's currently at -1000 to know if it's hidden. Wait, the position dropdown state is not stored separately.
          // Let's just update the opacity if it's not off-screen.
          return { ...e, opacity: (e.y !== -1000 && checked) ? 70 : 0 };
        }
        return e;
      }));
    };

    const categoryTemplates = templates.filter(t => t.festival_name === selectedCategory);
    const currentIndex = categoryTemplates.findIndex(t => t.id === selectedTemplate?.id);
    const hasNextTemplate = currentIndex !== -1 && currentIndex < categoryTemplates.length - 1;
    const hasPrevTemplate = currentIndex > 0;

    const handleNextTemplate = () => {
      if (hasNextTemplate) handleSelectTemplate(categoryTemplates[currentIndex + 1]);
    };

    const handlePrevTemplate = () => {
      if (hasPrevTemplate) handleSelectTemplate(categoryTemplates[currentIndex - 1]);
    };

    return (
      <div className="max-w-[1200px] mx-auto p-4 flex flex-col min-h-[80vh] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="w-full flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => setView("gallery")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Gallery
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevTemplate} disabled={!hasPrevTemplate}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">{selectedTemplate?.festival_name} Poster</h2>
            <Button variant="outline" size="icon" onClick={handleNextTemplate} disabled={!hasNextTemplate}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="bg-muted p-8 rounded-2xl shadow-inner border pointer-events-none">
              {renderCanvas()}
            </div>
            <div className="flex gap-4 mt-8">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-700" onClick={handleDownload} disabled={downloading || preparingShare}>
                {downloading ? "Generating..." : <><Download className="mr-2 h-5 w-5" /> Download Now</>}
              </Button>
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={handleShareCampaign} disabled={preparingShare || downloading}>
                {preparingShare ? "Preparing..." : <><Share2 className="mr-2 h-5 w-5" /> Share Campaign</>}
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2" onClick={() => setView("editor")}>
                <PenTool className="mr-2 h-5 w-5" /> Advanced Edit
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-5">
                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Quick Settings
                </h3>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Company Details</Label>
                  <Input 
                    value={bizNameEl?.text || ""} 
                    onChange={e => handleQuickTextChange("biz-name", e.target.value)} 
                    placeholder="Business Name"
                  />
                  <Input 
                    value={bizPhoneEl?.text || ""} 
                    onChange={e => handleQuickTextChange("biz-phone", e.target.value)} 
                    placeholder="Phone Number"
                  />
                  <Input 
                    value={bizAddressEl?.text || ""} 
                    onChange={e => handleQuickTextChange("biz-address", e.target.value)} 
                    placeholder="Address"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Footer Position</Label>
                  <Select defaultValue="bottom" onValueChange={updateFooterPosition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t mt-4">
                  <Label htmlFor="footer-bg-switch" className="text-xs font-semibold uppercase text-muted-foreground cursor-pointer">
                    Dark Background
                  </Label>
                  <Switch 
                    id="footer-bg-switch" 
                    checked={showFooterBox} 
                    onCheckedChange={handleToggleFooterBox} 
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">Company Logo</Label>
                  <Label
                    htmlFor="quick-logo-upload"
                    className="flex h-9 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload Custom Logo
                  </Label>
                  <Input type="file" accept="image/*" onChange={handleQuickLogoUpload} className="hidden" id="quick-logo-upload" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Logo Position</Label>
                  <Select defaultValue="top-left" onValueChange={updateLogoPosition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
        <ShareCampaignDialog 
          open={shareDialogOpen} 
          onOpenChange={setShareDialogOpen} 
          posterDataUrl={sharePosterDataUrl} 
          festivalName={selectedTemplate?.festival_name || "Festival"} 
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // EDITOR VIEW
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-300" onPointerDown={() => setActiveElementId(null)}>
      
      {/* ───── Modern Header ───── */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView("preview")} title="Back to Preview">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Editor
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2"></div>
          <Button size="sm" onClick={handleShareCampaign} disabled={preparingShare || downloading || !selectedTemplate} className="bg-blue-600 hover:bg-blue-700 text-white mr-2">
            {preparingShare ? "Preparing..." : <><Share2 className="mr-2 h-4 w-4" /> Share Campaign</>}
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading || preparingShare || !selectedTemplate} className="bg-orange-600 hover:bg-orange-700 text-white">
            {downloading ? "Generating..." : <><Download className="mr-2 h-4 w-4" /> Download Poster</>}
          </Button>
        </div>
      </div>

      {/* ───── Canva-style Top Bar for Active Element Properties ───── */}
      <div className="bg-card/80 backdrop-blur border rounded-xl p-3 shadow-sm min-h-[64px] flex items-center" onPointerDown={(e) => e.stopPropagation()}>
        {!activeBlock ? (
          <div className="text-sm text-muted-foreground w-full text-center">
            Select an element to edit its properties
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2 border-r pr-4">
              <span className="text-xs font-semibold uppercase text-muted-foreground">{activeBlock.type}</span>
            </div>

            {activeBlock.type === "text" && (
              <>
                <Select 
                  value={activeBlock.fontFamily} 
                  onValueChange={(val: string) => {
                    updateActiveElement({ fontFamily: val });
                    setTimeout(commitActiveElementChange, 100);
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }} className="text-xs">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Label className="text-xs">Size</Label>
                  <Input 
                    type="number"
                    className="h-8 w-[70px] text-xs"
                    value={activeBlock.fontSize || 24}
                    onChange={(e) => updateActiveElement({ fontSize: Number(e.target.value) })}
                    onBlur={commitActiveElementChange}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Color</Label>
                  <input 
                    type="color" 
                    value={activeBlock.color || "#ffffff"} 
                    onChange={(e) => updateActiveElement({ color: e.target.value })}
                    onBlur={commitActiveElementChange}
                    className="h-8 w-8 cursor-pointer p-0 bg-transparent border-0 rounded" 
                  />
                </div>
                
                <Input 
                   value={activeBlock.text || ""} 
                   onChange={e => updateActiveElement({ text: e.target.value })}
                   onBlur={commitActiveElementChange}
                   className="h-8 w-[200px] text-xs"
                   placeholder="Edit text..."
                />
              </>
            )}

            {activeBlock.type === "shape" && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Color</Label>
                  <input 
                    type="color" 
                    value={activeBlock.bgColor || "#000000"} 
                    onChange={(e) => updateActiveElement({ bgColor: e.target.value })}
                    onBlur={commitActiveElementChange}
                    className="h-8 w-8 cursor-pointer p-0 bg-transparent border-0 rounded" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Opacity</Label>
                  <Input 
                    type="number"
                    className="h-8 w-[70px] text-xs"
                    min={10} max={100}
                    value={activeBlock.opacity || 100}
                    onChange={(e) => updateActiveElement({ opacity: Number(e.target.value) })}
                    onBlur={commitActiveElementChange}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Rounding</Label>
                  <Input 
                    type="number"
                    className="h-8 w-[70px] text-xs"
                    min={0} max={100}
                    value={activeBlock.borderRadius || 0}
                    onChange={(e) => updateActiveElement({ borderRadius: Number(e.target.value) })}
                    onBlur={commitActiveElementChange}
                  />
                </div>
              </>
            )}

            {activeBlock.type === "image" && (
              <>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="h-8 text-xs" 
                  onClick={removeBgFromActiveImage} 
                  disabled={removingBg}
                >
                  {removingBg ? "Processing..." : <><Eraser className="mr-2 h-3 w-3" /> Remove BG</>}
                </Button>
              </>
            )}

            {(activeBlock.type === "image" || activeBlock.type === "shape") && (
                <div className="flex items-center gap-2 border-l pl-4 ml-2">
                  <Label className="text-xs">Size</Label>
                  <Input 
                    type="number"
                    className="h-8 w-[70px] text-xs"
                    min={30} max={500}
                    value={activeBlock.width || 100}
                    onChange={(e) => updateActiveElement(activeBlock.type === "image" ? { width: Number(e.target.value), height: Number(e.target.value) } : { width: Number(e.target.value) })}
                    onBlur={commitActiveElementChange}
                  />
                </div>
            )}
            
            {activeBlock.type === "shape" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Height</Label>
                  <Input 
                    type="number"
                    className="h-8 w-[70px] text-xs"
                    min={10} max={500}
                    value={activeBlock.height || 100}
                    onChange={(e) => updateActiveElement({ height: Number(e.target.value) })}
                    onBlur={commitActiveElementChange}
                  />
                </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reorderActiveElement('up')} title="Bring Forward">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reorderActiveElement('down')} title="Send Backward">
                <ArrowDown className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-1"></div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeElement(activeBlock.id)} title="Delete (Del key)">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0" onPointerDown={(e) => e.stopPropagation()}>
        {/* ───── Left: Tools ───── */}
        <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider">Add Elements</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-9" onClick={() => addText()}>
                  <Type className="mr-2 h-4 w-4" /> Text
                </Button>
                <Button variant="outline" className="h-9" onClick={addShape}>
                  <Square className="mr-2 h-4 w-4" /> Shape
                </Button>
                <Label
                  htmlFor="img-upload"
                  className="flex h-9 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> Image
                </Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" />
              </div>
              
              <Label className="text-xs font-semibold uppercase tracking-wider pt-2 block">Company Details</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => addBusinessPreset('name')}>
                  <Building className="mr-1 h-3 w-3" /> Biz Name
                </Button>
                <Button variant="secondary" size="sm" onClick={() => addBusinessPreset('phone')}>
                  <Phone className="mr-1 h-3 w-3" /> Phone
                </Button>
                <Button variant="secondary" size="sm" onClick={() => addBusinessPreset('address')}>
                  <MapPin className="mr-1 h-3 w-3" /> Address
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider">Background Filter</Label>
                <Select value={bgStyle} onValueChange={(val: any) => setBgStyle(val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">None (Original Image)</SelectItem>
                    <SelectItem value="gradient">Gradient Overlay</SelectItem>
                    <SelectItem value="darken">Darkened Overlay</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="destructive" className="w-full h-8 text-xs mt-2" onClick={clearAllElements}>
                  <Trash2 className="mr-2 h-3 w-3" /> Clear Canvas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ───── Center: Live Preview ───── */}
        <div className="lg:col-span-9 flex flex-col items-center justify-start h-full relative" onPointerDown={() => setActiveElementId(null)}>
          <div className="sticky top-0 bg-muted p-4 md:p-8 rounded-xl w-full flex justify-center items-center select-none shadow-inner border min-h-[600px]">
            {renderCanvas()}
          </div>
        </div>
      </div>

      <ShareCampaignDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen} 
        posterDataUrl={sharePosterDataUrl} 
        festivalName={selectedTemplate?.festival_name || "Festival"} 
      />
    </div>
  );
}

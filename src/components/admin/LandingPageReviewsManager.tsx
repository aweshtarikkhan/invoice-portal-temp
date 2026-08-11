import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

const DEFAULT_REVIEWS = [
  { name: "Rajesh Sharma", role: "Owner, Sharma Hardware · Jaipur", quote: "Pehle Excel pe bill banata tha, ab WhatsApp pe seedha bhej deta hoon. Customer 5 minute mein UPI se paisa de deta hai.", rating: 5 },
  { name: "Priya Mehta", role: "Founder, Mehta Textiles · Surat", quote: "GSTR-1 file karne mein pehle CA ko 3 din lagte the. Assay Biz se 10 minute mein JSON ready ho jata hai. Game changer.", rating: 5 },
  { name: "Amit Patel", role: "CA, Patel & Associates · Ahmedabad", quote: "My 40+ clients moved from Tally + Vyapar to Assay Biz. The HSN summary and 3B export saves us hours every month.", rating: 5 },
  { name: "Sneha Iyer", role: "Freelance Designer · Bengaluru", quote: "Clean, fast, no bloat. The portal link means clients pay without me chasing. Worth every rupee.", rating: 5 },
];

export function LandingPageReviewsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_settings").select("value").eq("key", "landing_page_reviews").maybeSingle();
    
    if (data && data.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(parsed);
        } else {
          setReviews(DEFAULT_REVIEWS);
        }
      } catch(e) {
        setReviews(DEFAULT_REVIEWS);
      }
    } else {
      setReviews(DEFAULT_REVIEWS);
    }
    setLoading(false);
  };

  const handleReviewChange = (index: number, field: string, value: any) => {
    const newReviews = [...reviews];
    newReviews[index][field] = value;
    setReviews(newReviews);
  };

  const handleAddReview = () => {
    const newReviews = [...reviews, { name: "", role: "", quote: "", rating: 5 }];
    setReviews(newReviews);
  };

  const handleRemoveReview = (index: number) => {
    const newReviews = reviews.filter((_, i) => i !== index);
    setReviews(newReviews);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("update_platform_setting", { 
      p_key: "landing_page_reviews", 
      p_value: JSON.stringify(reviews) 
    });
    
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reviews Saved", description: "Landing page reviews updated successfully." });
    }
  };

  if (loading) return <div><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>;

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription className="text-slate-400 mt-1">Manage the testimonials shown on the landing page.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddReview} className="border-slate-700 hover:bg-slate-800 text-slate-100">
            <Plus className="h-4 w-4 mr-2" /> Add Review
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviews.map((rev, idx) => (
            <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative group">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-900/30" onClick={() => handleRemoveReview(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Name</Label>
                   <Input className="bg-slate-800 border-slate-700" value={rev.name} onChange={e => handleReviewChange(idx, "name", e.target.value)} />
                </div>
                <div className="space-y-2">
                   <Label>Role / Company</Label>
                   <Input className="bg-slate-800 border-slate-700" value={rev.role} onChange={e => handleReviewChange(idx, "role", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-2">
                   <Label>Quote</Label>
                   <Textarea className="bg-slate-800 border-slate-700" value={rev.quote} onChange={e => handleReviewChange(idx, "quote", e.target.value)} />
                </div>
                <div className="space-y-2">
                   <Label>Rating (1-5)</Label>
                   <Input type="number" min="1" max="5" className="bg-slate-800 border-slate-700" value={rev.rating} onChange={e => handleReviewChange(idx, "rating", Number(e.target.value))} />
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
             <div className="col-span-1 lg:col-span-2 text-center py-6 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
               No reviews found. Click "Add Review" to create one.
             </div>
          )}
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Reviews
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

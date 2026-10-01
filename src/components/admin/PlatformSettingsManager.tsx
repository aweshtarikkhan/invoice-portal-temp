import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Sliders } from "lucide-react";

export function PlatformSettingsManager() {
  const [settings, setSettings] = useState<Record<string, string>>({
    trial_days: "14",
    trial_plan_name: "suite",
    yearly_discount_pct: "20",
    allow_free_plan: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_settings").select("*");
    if (data && data.length > 0) {
      const map: Record<string, string> = {};
      data.forEach(s => {
        map[s.key] = s.value;
      });
      setSettings(prev => ({ ...prev, ...map }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;
    for (const [key, value] of Object.entries(settings)) {
      // 1. Direct upsert
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) {
        // Fallback to RPC
        try {
          await supabase.rpc("update_platform_setting", { p_key: key, p_value: value });
        } catch (rpcErr: any) {
          hasError = true;
          toast({ title: "Error Saving Setting", description: error.message || rpcErr.message, variant: "destructive" });
          break;
        }
      }
    }
    setSaving(false);
    if (!hasError) {
      toast({ title: "Settings Saved! ⚙️", description: "Global platform settings updated successfully." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
      </div>
    );
  }

  return (
    <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Global Platform Settings</CardTitle>
            <CardDescription className="text-slate-500 text-xs">Configure trials, default subscription plans, and discounts.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trial Duration (Days)</Label>
            <Input 
              className="bg-slate-50 border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              value={settings.trial_days || ""}
              onChange={e => setSettings({ ...settings, trial_days: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Default Trial Plan</Label>
            <Input 
              className="bg-slate-50 border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              value={settings.trial_plan_name || ""}
              onChange={e => setSettings({ ...settings, trial_plan_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Yearly Discount (%)</Label>
            <Input 
              className="bg-slate-50 border-slate-300 text-slate-900 font-semibold focus:border-indigo-600 h-10"
              value={settings.yearly_discount_pct || ""}
              onChange={e => setSettings({ ...settings, yearly_discount_pct: e.target.value })}
            />
          </div>
          <div className="space-y-3 sm:col-span-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold text-slate-800">Allow Free Plan</Label>
                <p className="text-xs text-slate-500">If disabled, the Free plan will be hidden from the public pricing page and upgrade modal.</p>
              </div>
              <Switch 
                checked={settings.allow_free_plan !== "false"}
                onCheckedChange={checked => setSettings({ ...settings, allow_free_plan: checked ? "true" : "false" })}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20">
          {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Platform Settings
        </Button>
      </CardContent>
    </Card>
  );
}

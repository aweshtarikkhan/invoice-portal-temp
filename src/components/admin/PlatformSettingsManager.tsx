import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

export function PlatformSettingsManager() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(s => map[s.key] = s.value);
      setSettings(map);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase.rpc("update_platform_setting", { p_key: key, p_value: value });
      if (error) {
        hasError = true;
        toast({ title: "Error", description: error.message, variant: "destructive" });
        break;
      }
    }
    setSaving(false);
    if (!hasError) {
      toast({ title: "Settings Saved", description: "Platform settings updated successfully." });
    }
  };

  if (loading) return <div><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>;

  return (
    <Card className="bg-slate-900 border-slate-800 text-white max-w-2xl">
      <CardHeader>
        <CardTitle>Global Platform Settings</CardTitle>
        <CardDescription className="text-slate-400">Configure trials and discounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Trial Duration (Days)</Label>
            <Input 
              className="bg-slate-800 border-slate-700"
              value={settings.trial_days || ""}
              onChange={e => setSettings({ ...settings, trial_days: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Default Trial Plan</Label>
            <Input 
              className="bg-slate-800 border-slate-700"
              value={settings.trial_plan_name || ""}
              onChange={e => setSettings({ ...settings, trial_plan_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Yearly Discount (%)</Label>
            <Input 
              className="bg-slate-800 border-slate-700"
              value={settings.yearly_discount_pct || ""}
              onChange={e => setSettings({ ...settings, yearly_discount_pct: e.target.value })}
            />
          </div>
          <div className="space-y-3 col-span-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Free Plan</Label>
                <p className="text-xs text-slate-400">If disabled, the Free plan will be hidden from the pricing page and upgrade modal.</p>
              </div>
              <Switch 
                checked={settings.allow_free_plan !== "false"}
                onCheckedChange={checked => setSettings({ ...settings, allow_free_plan: checked ? "true" : "false" })}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}

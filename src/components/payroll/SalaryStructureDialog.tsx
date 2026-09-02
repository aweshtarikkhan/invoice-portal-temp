import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import {
  SalaryStructure,
  DEFAULT_SALARY_STRUCTURE,
  generateStandardIndianSalaryStructure,
  parseEmployeeSalaryStructure
} from "@/lib/salary-calculator";
import { Calculator, Sparkles, CheckCircle2, IndianRupee, ShieldCheck, Wallet, Clock } from "lucide-react";

interface SalaryStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  currency?: string;
  onSaved?: () => void;
}

export function SalaryStructureDialog({
  open,
  onOpenChange,
  employee,
  currency = "INR",
  onSaved,
}: SalaryStructureDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SalaryStructure>(DEFAULT_SALARY_STRUCTURE);

  useEffect(() => {
    if (open && employee) {
      const parsed = parseEmployeeSalaryStructure(employee);
      setForm(parsed);
    }
  }, [open, employee]);

  const handleApplyStandard = (grossVal?: number) => {
    const g = grossVal !== undefined ? grossVal : form.monthly_gross;
    const std = generateStandardIndianSalaryStructure(g, {
      pf_applicable: form.pf_applicable,
      pf_capped: form.pf_capped,
      esic_applicable: g <= 21000,
      pt_applicable: form.pt_applicable,
      pt_amount: form.pt_amount || 200,
      payment_mode: form.payment_mode,
    });
    setForm(std);
    toast({
      title: "Standard Indian Structure Applied",
      description: `Basic (50%), HRA (20%), Standard Allowances, PF & PT calculated for ${formatCurrency(g, currency)}.`,
    });
  };

  const handleGrossChange = (val: number) => {
    const g = Math.max(0, val);
    setForm((prev) => {
      // Auto adjust Basic & HRA if standard percentages are kept
      const basic = +(g * 0.50).toFixed(2);
      const hra = +(g * 0.20).toFixed(2);
      const sum = basic + hra + prev.da + prev.conveyance + prev.medical + prev.food_allowance + prev.performance_bonus + prev.other_allowances;
      const special = Math.max(0, +(g - sum).toFixed(2));
      return {
        ...prev,
        monthly_gross: g,
        basic,
        hra,
        special_allowance: special,
        esic_applicable: g <= 21000,
      };
    });
  };

  const handleFieldChange = (field: keyof SalaryStructure, val: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field !== 'special_allowance' && field !== 'monthly_gross') {
        // Auto-recalculate special allowance as balancing amount
        const sum = Number(next.basic || 0) +
          Number(next.hra || 0) +
          Number(next.da || 0) +
          Number(next.conveyance || 0) +
          Number(next.medical || 0) +
          Number(next.food_allowance || 0) +
          Number(next.performance_bonus || 0) +
          Number(next.other_allowances || 0);
        next.special_allowance = Math.max(0, +(next.monthly_gross - sum).toFixed(2));
      }
      return next;
    });
  };

  // Preview computations
  const totalEarnings = +(
    Number(form.basic || 0) +
    Number(form.hra || 0) +
    Number(form.da || 0) +
    Number(form.conveyance || 0) +
    Number(form.medical || 0) +
    Number(form.special_allowance || 0) +
    Number(form.food_allowance || 0) +
    Number(form.performance_bonus || 0) +
    Number(form.other_allowances || 0)
  ).toFixed(2);

  let estPf = 0;
  const pfRate = (Number(form.pf_percent) || 12) / 100;
  if (form.pf_applicable) {
    const pfBase = Number(form.basic || 0) + Number(form.da || 0);
    estPf = form.pf_capped ? +(Math.min(pfBase, 15000) * pfRate).toFixed(2) : +(pfBase * pfRate).toFixed(2);
  }

  let estEsic = 0;
  const esicRate = (Number(form.esic_percent) || 0.75) / 100;
  if (form.esic_applicable && (form.esic_custom_limit ? true : form.monthly_gross <= 21000)) {
    estEsic = +(totalEarnings * esicRate).toFixed(2);
  }

  const estPt = form.pt_applicable ? Number(form.pt_amount || 200) : 0;
  const estTds = Number(form.tds_amount || 0);
  const estLoan = Number(form.loan_emi || 0);
  const estOtherDed = Number(form.other_deductions || 0);

  const totalDeductions = +(estPf + estEsic + estPt + estTds + estLoan + estOtherDed).toFixed(2);
  const netTakeHome = Math.max(0, +(totalEarnings - totalDeductions).toFixed(2));

  const handleSave = async () => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("employees")
        .update({
          monthly_salary: form.monthly_gross,
          basic_percent: form.basic_percent || 50,
          hra_percent: form.hra_percent || 20,
          pf_applicable: form.pf_applicable,
          esic_applicable: form.esic_applicable,
          salary_structure: form,
        })
        .eq("id", employee.id);

      if (error) throw error;

      toast({
        title: "Salary Structure Saved",
        description: `Updated salary & benefits structure for ${employee.name}.`,
      });

      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Employee Salary & Benefits Structure</DialogTitle>
                <DialogDescription>
                  Configure earnings, allowances, benefits & statutory deductions for <strong className="text-foreground">{employee?.name}</strong> {employee?.employee_code && `(${employee.employee_code})`}
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
              onClick={() => handleApplyStandard()}
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-blue-600" />
              Auto-Standard Preset (50:20)
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-2">
          {/* Main Controls - 2 Cols */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Top Base Gross Input */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="gross-input" className="font-bold text-base flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  Monthly Gross Salary (CTC)
                </Label>
                <p className="text-xs text-muted-foreground">Fixed monthly cost-to-company before deductions</p>
              </div>
              <div className="relative w-full sm:w-56">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                <Input
                  id="gross-input"
                  type="number"
                  min="0"
                  step="500"
                  className="pl-8 text-lg font-bold"
                  value={form.monthly_gross || ""}
                  onChange={(e) => handleGrossChange(Number(e.target.value))}
                  placeholder="e.g. 50000"
                />
              </div>
            </div>

            <Tabs defaultValue="earnings" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="earnings" className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  Earnings & Allowances
                </TabsTrigger>
                <TabsTrigger value="deductions" className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Deductions & Statutory
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Earnings & Allowances */}
              <TabsContent value="earnings" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Basic Salary */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Basic Salary</Label>
                      <span className="text-[10px] text-muted-foreground">50% of CTC</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.basic || ""}
                        onChange={(e) => handleFieldChange("basic", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* HRA */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">HRA (House Rent Allowance)</Label>
                      <span className="text-[10px] text-muted-foreground">20% of CTC (40% Basic)</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.hra || ""}
                        onChange={(e) => handleFieldChange("hra", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Dearness Allowance (DA) */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Dearness Allowance (DA)</Label>
                      <span className="text-[10px] text-muted-foreground">Cost of living</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.da || ""}
                        onChange={(e) => handleFieldChange("da", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Conveyance Allowance */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Conveyance Allowance</Label>
                      <span className="text-[10px] text-muted-foreground">Transport support</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.conveyance || ""}
                        onChange={(e) => handleFieldChange("conveyance", Number(e.target.value))}
                        placeholder="1600"
                      />
                    </div>
                  </div>

                  {/* Medical Allowance */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Medical Allowance</Label>
                      <span className="text-[10px] text-muted-foreground">Health benefit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.medical || ""}
                        onChange={(e) => handleFieldChange("medical", Number(e.target.value))}
                        placeholder="1250"
                      />
                    </div>
                  </div>

                  {/* Special Allowance */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card border-blue-200 dark:border-blue-900 bg-blue-50/20">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs text-blue-700 dark:text-blue-300">Special Allowance</Label>
                      <span className="text-[10px] text-blue-600 font-medium">Balancing component</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm font-medium"
                        value={form.special_allowance || ""}
                        onChange={(e) => handleFieldChange("special_allowance", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Food / Meal Coupons */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Food / Meal Allowance</Label>
                      <span className="text-[10px] text-muted-foreground">Optional perk</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.food_allowance || ""}
                        onChange={(e) => handleFieldChange("food_allowance", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Performance Bonus / Regular Incentive */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Regular Monthly Bonus</Label>
                      <span className="text-[10px] text-muted-foreground">Performance incentive</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="pl-7 h-9 text-sm"
                        value={form.performance_bonus || ""}
                        onChange={(e) => handleFieldChange("performance_bonus", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Other Allowances */}
                  <div className="p-3 rounded-lg border bg-card col-span-1 sm:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Other Custom Allowances & Benefits</Label>
                      <span className="text-[10px] text-muted-foreground">Custom name & amount</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Allowance Name / Purpose</Label>
                        <Input
                          type="text"
                          className="h-9 text-sm"
                          value={form.other_allowances_label || ""}
                          onChange={(e) => handleFieldChange("other_allowances_label", e.target.value)}
                          placeholder="e.g. Internet, Travel, Fuel, Phone"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Monthly Amount (₹)</Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            className="pl-7 h-9 text-sm"
                            value={form.other_allowances || ""}
                            onChange={(e) => handleFieldChange("other_allowances", Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overtime & Shift Timing Settings */}
                  <div className="space-y-2.5 p-3.5 rounded-lg border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 col-span-1 sm:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Overtime Pay Configuration (Automatic Timing Detection)
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Auto-calculated when employee logs in beyond standard shift hours (e.g. &gt; 9 hours / day)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-white dark:bg-slate-900 border-amber-300 text-amber-800 dark:text-amber-300"
                        onClick={() => {
                          const stdH = Number(form.standard_shift_hours || 9);
                          const autoRate = Math.round(Number(form.monthly_gross || 0) / (26 * stdH));
                          handleFieldChange("overtime_rate_per_hour", autoRate);
                          toast({ title: "Overtime Rate Auto-Calculated", description: `Set to ₹${autoRate}/hr based on CTC.` });
                        }}
                      >
                        Auto-Calculate Rate
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Standard Work Hours / Day</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="1"
                          max="24"
                          className="h-8 text-xs bg-white dark:bg-slate-900"
                          value={form.standard_shift_hours || 9}
                          onChange={(e) => handleFieldChange("standard_shift_hours", Number(e.target.value))}
                          placeholder="9"
                        />
                        <span className="text-[10px] text-muted-foreground">Extra hours above this threshold count as Overtime</span>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Overtime Rate (₹ / Hour)</Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            step="5"
                            className="pl-7 h-8 text-xs bg-white dark:bg-slate-900 font-semibold text-emerald-700"
                            value={form.overtime_rate_per_hour || ""}
                            onChange={(e) => handleFieldChange("overtime_rate_per_hour", Number(e.target.value))}
                            placeholder="e.g. 150 or 200"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Hourly price added to employee's monthly payout</span>
                      </div>
                    </div>
                  </div>

                </div>
              </TabsContent>

              {/* TAB 2: Deductions & Statutory */}
              <TabsContent value="deductions" className="space-y-4 pt-2">
                <div className="space-y-3">
                  
                  {/* PF Rule */}
                  <div className="p-3.5 rounded-lg border bg-card space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="font-semibold text-sm">Provident Fund (EPF - Employee Contribution)</Label>
                          {form.pf_applicable && (
                            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
                              {form.pf_percent || 12}% on Basic
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Statutory retirement contribution. Default 12% with optional ₹15,000 ceiling.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={form.pf_applicable}
                          onCheckedChange={(c) => handleFieldChange("pf_applicable", c)}
                        />
                      </div>
                    </div>

                    {form.pf_applicable && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">PF Percentage (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              className="h-8 text-xs font-semibold"
                              value={form.pf_percent !== undefined ? form.pf_percent : 12}
                              onChange={(e) => handleFieldChange("pf_percent", Number(e.target.value))}
                              placeholder="12"
                            />
                            <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground">%</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">Default 12% on (Basic + DA)</span>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Statutory Wage Cap</Label>
                          <div className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 rounded border h-8">
                            <span className="text-xs text-muted-foreground">Cap at ₹15,000 / mo</span>
                            <Switch
                              id="pf-cap"
                              checked={form.pf_capped}
                              onCheckedChange={(c) => handleFieldChange("pf_capped", c)}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {form.pf_capped ? `Max deduction ₹${Math.round(15000 * ((form.pf_percent || 12) / 100))}/mo` : "Calculated on actual basic"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ESIC Rule */}
                  <div className="p-3.5 rounded-lg border bg-card space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="font-semibold text-sm">Employee State Insurance (ESIC)</Label>
                          {form.esic_applicable && (
                            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px]">
                              {form.esic_percent || 0.75}% on Gross
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Medical insurance for monthly wages up to ₹21,000 (default 0.75%).
                        </p>
                      </div>
                      <Switch
                        checked={form.esic_applicable}
                        onCheckedChange={(c) => handleFieldChange("esic_applicable", c)}
                      />
                    </div>

                    {form.esic_applicable && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">ESIC Percentage (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.05"
                              min="0"
                              max="100"
                              className="h-8 text-xs font-semibold"
                              value={form.esic_percent !== undefined ? form.esic_percent : 0.75}
                              onChange={(e) => handleFieldChange("esic_percent", Number(e.target.value))}
                              placeholder="0.75"
                            />
                            <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground">%</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">Statutory standard: 0.75%</span>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Wage Limit Check</Label>
                          <div className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 rounded border h-8">
                            <span className="text-xs text-muted-foreground">Apply to all (Ignore ₹21k limit)</span>
                            <Switch
                              id="esic-limit"
                              checked={!!form.esic_custom_limit}
                              onCheckedChange={(c) => handleFieldChange("esic_custom_limit", c)}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {form.monthly_gross > 21000 && !form.esic_custom_limit ? "Exempt (> ₹21,000)" : "Eligible for deduction"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Professional Tax (PT) */}
                  <div className="p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="font-semibold text-sm">Professional Tax (PT)</Label>
                      <p className="text-xs text-muted-foreground">State statutory tax (Typically ₹200/mo or custom state slab).</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {form.pt_applicable && (
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            className="pl-6 h-8 text-xs font-semibold"
                            value={form.pt_amount}
                            onChange={(e) => handleFieldChange("pt_amount", Number(e.target.value))}
                            placeholder="200"
                          />
                        </div>
                      )}
                      <Switch
                        checked={form.pt_applicable}
                        onCheckedChange={(c) => handleFieldChange("pt_applicable", c)}
                      />
                    </div>
                  </div>

                  {/* TDS & Advance Recovery */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                      <Label className="font-semibold text-xs">Monthly TDS / Income Tax (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          className="pl-7 h-9 text-sm"
                          value={form.tds_amount || ""}
                          onChange={(e) => handleFieldChange("tds_amount", Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                      <Label className="font-semibold text-xs">Loan / Advance EMI (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          className="pl-7 h-9 text-sm"
                          value={form.loan_emi || ""}
                          onChange={(e) => handleFieldChange("loan_emi", Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Other Custom Deductions */}
                    <div className="p-3 rounded-lg border bg-card col-span-1 sm:col-span-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-xs">Other Custom Recurring Deductions</Label>
                        <span className="text-[10px] text-muted-foreground">Custom name & amount</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Deduction Name / Purpose</Label>
                          <Input
                            type="text"
                            className="h-9 text-sm"
                            value={form.other_deductions_label || ""}
                            onChange={(e) => handleFieldChange("other_deductions_label", e.target.value)}
                            placeholder="e.g. Uniform, Mess, Security Deposit, Advance"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Monthly Deduction (₹)</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              className="pl-7 h-9 text-sm"
                              value={form.other_deductions || ""}
                              onChange={(e) => handleFieldChange("other_deductions", Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold">Default Salary Payment Mode</Label>
                    <Select
                      value={form.payment_mode || "bank_transfer"}
                      onValueChange={(v: any) => handleFieldChange("payment_mode", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Direct Transfer (NEFT/RTGS/IMPS)</SelectItem>
                        <SelectItem value="cheque">Bank Cheque</SelectItem>
                        <SelectItem value="upi">UPI / Digital Payment</SelectItem>
                        <SelectItem value="cash">Cash in Hand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </TabsContent>
            </Tabs>

          </div>

          {/* Right Column: Live Take-Home Preview Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-blue-200 dark:border-blue-900 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm sticky top-4">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-foreground">Monthly Salary Preview</h3>
                  <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                    Live Calculation
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Gross Monthly CTC:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(form.monthly_gross, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t text-emerald-700 dark:text-emerald-400">
                    <span>Total Earnings (Sum):</span>
                    <span className="font-bold">{formatCurrency(totalEarnings, currency)}</span>
                  </div>
                  <div className="pl-2 space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>• Basic:</span> <span>{formatCurrency(form.basic, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• HRA:</span> <span>{formatCurrency(form.hra, currency)}</span>
                    </div>
                    {form.da > 0 && (
                      <div className="flex justify-between">
                        <span>• DA:</span> <span>{formatCurrency(form.da, currency)}</span>
                      </div>
                    )}
                    {form.conveyance > 0 && (
                      <div className="flex justify-between">
                        <span>• Conveyance:</span> <span>{formatCurrency(form.conveyance, currency)}</span>
                      </div>
                    )}
                    {form.medical > 0 && (
                      <div className="flex justify-between">
                        <span>• Medical:</span> <span>{formatCurrency(form.medical, currency)}</span>
                      </div>
                    )}
                    {form.special_allowance > 0 && (
                      <div className="flex justify-between">
                        <span>• Special Allw:</span> <span>{formatCurrency(form.special_allowance, currency)}</span>
                      </div>
                    )}
                    {form.food_allowance > 0 && (
                      <div className="flex justify-between">
                        <span>• Food/Meal:</span> <span>{formatCurrency(form.food_allowance, currency)}</span>
                      </div>
                    )}
                    {form.performance_bonus > 0 && (
                      <div className="flex justify-between">
                        <span>• Bonus/Incentive:</span> <span>{formatCurrency(form.performance_bonus, currency)}</span>
                      </div>
                    )}
                    {form.other_allowances > 0 && (
                      <div className="flex justify-between">
                        <span>• {form.other_allowances_label || "Other Allw"}:</span> <span>{formatCurrency(form.other_allowances, currency)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between py-1 border-t text-red-600 dark:text-red-400">
                    <span>Total Deductions:</span>
                    <span className="font-bold">- {formatCurrency(totalDeductions, currency)}</span>
                  </div>
                  <div className="pl-2 space-y-1 text-[11px] text-muted-foreground">
                    {form.pf_applicable && (
                      <div className="flex justify-between">
                        <span>• PF ({form.pf_percent || 12}%):</span> <span>- {formatCurrency(estPf, currency)}</span>
                      </div>
                    )}
                    {estEsic > 0 && (
                      <div className="flex justify-between">
                        <span>• ESIC ({form.esic_percent || 0.75}%):</span> <span>- {formatCurrency(estEsic, currency)}</span>
                      </div>
                    )}
                    {estPt > 0 && (
                      <div className="flex justify-between">
                        <span>• Prof. Tax (PT):</span> <span>- {formatCurrency(estPt, currency)}</span>
                      </div>
                    )}
                    {estTds > 0 && (
                      <div className="flex justify-between">
                        <span>• TDS / Tax:</span> <span>- {formatCurrency(estTds, currency)}</span>
                      </div>
                    )}
                    {estLoan > 0 && (
                      <div className="flex justify-between">
                        <span>• Loan EMI:</span> <span>- {formatCurrency(estLoan, currency)}</span>
                      </div>
                    )}
                    {estOtherDed > 0 && (
                      <div className="flex justify-between">
                        <span>• {form.other_deductions_label || "Other Ded"}:</span> <span>- {formatCurrency(estOtherDed, currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Net Take-Home Pay
                  </p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(netTakeHome, currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Annual CTC: {formatCurrency(form.monthly_gross * 12, currency)}
                  </p>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Attendance Pro-Rata Note:
                  </p>
                  <p>
                    When calculating payroll for a custom period (e.g. 21st to 20th), unapproved leaves / loss of pay (LOP) will automatically deduct from these earnings proportionately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Saving Structure..." : "Save Salary Structure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

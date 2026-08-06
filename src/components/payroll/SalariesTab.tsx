import React, { useRef, useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription as DDesc } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  addDays,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import {
  Calculator,
  Calendar,
  Sparkles,
  FileText,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Pencil,
  Eye,
  Sliders,
  DollarSign,
  Download,
  Clock,
  HardHat,
  Printer,
  CalendarDays,
  Check,
  Edit3,
} from "lucide-react";
import {
  SalaryStructure,
  EmployeeCalculatedSalary,
  calculateEmployeeSalaryForPeriod,
  generateStandardIndianSalaryStructure,
  parseEmployeeSalaryStructure,
  WagerCalculatedSalary,
  WagerDayRecord,
  calculateWagerSalaryForPeriod,
} from "@/lib/salary-calculator";
import { SalaryStructureDialog } from "./SalaryStructureDialog";
import { PayslipModal } from "./PayslipModal";
import { WagerSlipModal } from "./WagerSlipModal";
import { postPayrollJournal, postWagerPaymentJournal, PayrollJournalData } from "@/lib/accounting";

export function SalariesTab() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const currency = (org as any)?.currency || "INR";
  const dailyWagesEnabled = !!(org as any)?.daily_wages_enabled;

  // Date Range Selection (Flexible Start & End Date)
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return format(startOfMonth(now), "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return format(endOfMonth(now), "yyyy-MM-dd");
  });

  // Data states
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [employeeShifts, setEmployeeShifts] = useState<Record<string, string>>({});
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRun, setSavingRun] = useState(false);

  // Sub-tab view: 'calc' | 'wagers' | 'master' | 'history'
  const [subTab, setSubTab] = useState<string>("calc");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Overrides map for monthly calculation: empId -> { bonus, overtime, overtime_hours, overtime_rate, tds, other_deductions, notes }
  const [overrides, setOverrides] = useState<Record<string, any>>({});

  // Wager Overrides map: empId -> { rate, overtime_rate, bonus, deductions, notes }
  const [wagerOverrides, setWagerOverrides] = useState<Record<string, any>>({});

  // Modals for Monthly
  const [selectedEmpForStructure, setSelectedEmpForStructure] = useState<any | null>(null);
  const [structureModalOpen, setStructureModalOpen] = useState(false);

  const [selectedSlipForView, setSelectedSlipForView] = useState<EmployeeCalculatedSalary | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Overtime Details Breakdown Modal
  const [selectedOtBreakdown, setSelectedOtBreakdown] = useState<EmployeeCalculatedSalary | null>(null);
  const [otBreakdownModalOpen, setOtBreakdownModalOpen] = useState(false);

  // Adjustments modal for monthly
  const [overrideModalEmp, setOverrideModalEmp] = useState<any | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    bonus: 0,
    overtime_rate: 0,
    overtime_hours: 0,
    overtime: 0,
    tds: 0,
    other_deductions: 0,
    notes: "",
  });

  // Wager Time Punch Editor Modal
  const [selectedWagerForPunches, setSelectedWagerForPunches] = useState<any | null>(null);
  const [wagerPunchModalOpen, setWagerPunchModalOpen] = useState(false);
  const [editingDayDate, setEditingDayDate] = useState<string | null>(null);
  const [editingDayIn, setEditingDayIn] = useState("09:00");
  const [editingDayOut, setEditingDayOut] = useState("18:00");
  const [editingDayStatus, setEditingDayStatus] = useState("present");
  const [savingDayPunch, setSavingDayPunch] = useState(false);

  // Wager Adjustments Modal
  const [wagerAdjustEmp, setWagerAdjustEmp] = useState<WagerCalculatedSalary | null>(null);
  const [wagerAdjustModalOpen, setWagerAdjustModalOpen] = useState(false);
  const [wagerAdjustForm, setWagerAdjustForm] = useState({
    rate: 0,
    overtime_rate: 0,
    bonus: 0,
    deductions: 0,
    notes: "",
  });

  // Wager Slip View Modal
  const [selectedWagerSlip, setSelectedWagerSlip] = useState<WagerCalculatedSalary | null>(null);
  const [wagerSlipModalOpen, setWagerSlipModalOpen] = useState(false);

  // Load all foundational data
  const loadData = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const [
        empRes,
        attRes,
        attOverviewRes,
        leavesRes,
        holRes,
        runsRes,
        empShiftsRes,
        shiftsRes,
      ] = await Promise.all([
        (supabase as any).from("employees").select("*").eq("org_id", org.id).order("name"),
        (supabase as any).from("attendances").select("*").eq("org_id", org.id).gte("date", startDate).lte("date", endDate),
        (supabase as any).from("attendance").select("*").eq("org_id", org.id).gte("attendance_date", startDate).lte("attendance_date", endDate),
        (supabase as any).from("leaves").select("*").eq("org_id", org.id),
        (supabase as any).from("holidays").select("*").eq("org_id", org.id),
        (supabase as any).from("payroll_runs").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
        (supabase as any).from("employee_shifts").select("*").eq("org_id", org.id),
        (supabase as any).from("shifts").select("*").eq("org_id", org.id),
      ]);

      const combinedAttendance = [...(attRes.data || []), ...(attOverviewRes.data || [])];

      const empShiftMap: Record<string, string> = {};
      (empShiftsRes.data || []).forEach((es: any) => {
        if (es.employee_id && es.shift_id) {
          empShiftMap[es.employee_id] = es.shift_id;
        }
      });

      setEmployees((empRes.data || []).filter((e: any) => e.is_active !== false));
      setAttendanceLogs(combinedAttendance);
      setLeaves(leavesRes.data || []);
      setHolidays(holRes.data || []);
      setPayrollRuns(runsRes.data || []);
      setEmployeeShifts(empShiftMap);
      setShifts(shiftsRes.data || []);
    } catch (err: any) {
      toast({ title: "Failed to load payroll data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [org?.id, startDate, endDate]);

  // Quick Preset Handlers
  const handleSetPreset = (type: "this_month" | "last_month" | "this_week" | "last_week" | "21_to_20" | "26_to_25" | "16_to_15") => {
    const now = new Date();
    if (type === "this_month") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (type === "last_month") {
      const last = subMonths(now, 1);
      setStartDate(format(startOfMonth(last), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(last), "yyyy-MM-dd"));
    } else if (type === "this_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = addDays(monday, 6);
      setStartDate(format(monday, "yyyy-MM-dd"));
      setEndDate(format(sunday, "yyyy-MM-dd"));
    } else if (type === "last_week") {
      const day = now.getDay();
      const diff = now.getDate() - day - 6; // Last Monday
      const monday = new Date(now.setDate(diff));
      const sunday = addDays(monday, 6);
      setStartDate(format(monday, "yyyy-MM-dd"));
      setEndDate(format(sunday, "yyyy-MM-dd"));
    } else if (type === "21_to_20") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 21);
      const end = new Date(now.getFullYear(), now.getMonth(), 20);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    } else if (type === "26_to_25") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
      const end = new Date(now.getFullYear(), now.getMonth(), 25);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    } else if (type === "16_to_15") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 16);
      const end = new Date(now.getFullYear(), now.getMonth(), 15);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    }
  };

  // Perform Calculations for Monthly Staff
  const monthlyEmployees = useMemo(() => {
    return employees.filter((e) => !e.wage_type || e.wage_type === "monthly");
  }, [employees]);

  const calculatedSalaries: EmployeeCalculatedSalary[] = useMemo(() => {
    if (!monthlyEmployees.length || !startDate || !endDate) return [];
    return calculateEmployeeSalaryForPeriod({
      employees: monthlyEmployees,
      startDate,
      endDate,
      attendanceLogs,
      leaves,
      holidays,
      weeklyOffs: [0], // Sundays as standard off
      employeeShifts,
      shifts,
      overrides,
    });
  }, [monthlyEmployees, startDate, endDate, attendanceLogs, leaves, holidays, employeeShifts, shifts, overrides]);

  // Perform Calculations for Daily & Hourly Wagers
  const wagerEmployees = useMemo(() => {
    return employees.filter((e) => e.wage_type === "daily" || e.wage_type === "hourly");
  }, [employees]);

  const calculatedWagers: WagerCalculatedSalary[] = useMemo(() => {
    if (!wagerEmployees.length || !startDate || !endDate) return [];
    return calculateWagerSalaryForPeriod({
      employees: wagerEmployees,
      startDate,
      endDate,
      attendanceLogs,
      shifts,
      employeeShifts,
      overrides: wagerOverrides,
    });
  }, [wagerEmployees, startDate, endDate, attendanceLogs, shifts, employeeShifts, wagerOverrides]);

  // Filtered Monthly
  const filteredSalaries = useMemo(() => {
    if (!searchQuery.trim()) return calculatedSalaries;
    const q = searchQuery.toLowerCase();
    return calculatedSalaries.filter(
      (s) =>
        s.employee_name.toLowerCase().includes(q) ||
        (s.employee_code && s.employee_code.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q))
    );
  }, [calculatedSalaries, searchQuery]);

  // Filtered Wagers
  const filteredWagers = useMemo(() => {
    if (!searchQuery.trim()) return calculatedWagers;
    const q = searchQuery.toLowerCase();
    return calculatedWagers.filter(
      (w) =>
        w.employee_name.toLowerCase().includes(q) ||
        (w.employee_code && w.employee_code.toLowerCase().includes(q)) ||
        (w.designation && w.designation.toLowerCase().includes(q))
    );
  }, [calculatedWagers, searchQuery]);

  // Monthly Totals
  const totals = useMemo(() => {
    return calculatedSalaries.reduce(
      (acc, s) => {
        acc.gross += s.total_earned_gross;
        acc.deductions += s.total_deductions;
        acc.net += s.net_pay;
        acc.payableDays += s.payable_days;
        acc.lopDays += s.lop_days;
        acc.overtimeHours += s.overtime_hours;
        acc.overtimePay += s.overtime_pay;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0, payableDays: 0, lopDays: 0, overtimeHours: 0, overtimePay: 0 }
    );
  }, [calculatedSalaries]);

  // Wager Totals
  const wagerTotals = useMemo(() => {
    return calculatedWagers.reduce(
      (acc, w) => {
        acc.base += w.base_wage_amount;
        acc.overtime += w.overtime_amount;
        acc.bonus += w.bonus_amount;
        acc.deductions += w.advances_deductions;
        acc.net += w.net_payable;
        acc.daysWorked += w.days_worked;
        acc.hoursWorked += w.total_hours_worked;
        acc.otHours += w.total_overtime_hours;
        return acc;
      },
      { base: 0, overtime: 0, bonus: 0, deductions: 0, net: 0, daysWorked: 0, hoursWorked: 0, otHours: 0 }
    );
  }, [calculatedWagers]);

  const totalPeriodDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  // Open Monthly Override Dialog
  const openOverrideDialog = (empId: string) => {
    const emp = monthlyEmployees.find((e) => e.id === empId);
    const calc = calculatedSalaries.find((c) => c.employee_id === empId);
    if (!emp || !calc) return;

    const current = overrides[empId] || {};
    const rate = current.overtime_rate !== undefined ? current.overtime_rate : calc.overtime_hourly_rate;
    const hours = current.overtime_hours !== undefined ? current.overtime_hours : calc.auto_overtime_hours;
    const otAmount = current.overtime !== undefined ? current.overtime : +(hours * rate).toFixed(2);

    setOverrideForm({
      bonus: current.bonus !== undefined ? current.bonus : (calc.bonus_incentive || 0),
      overtime_rate: rate,
      overtime_hours: hours,
      overtime: otAmount,
      tds: current.tds !== undefined ? current.tds : (calc.tds_deduction || 0),
      other_deductions: current.other_deductions !== undefined ? current.other_deductions : (calc.other_deductions || 0),
      notes: current.notes || "",
    });
    setOverrideModalEmp(emp);
    setOverrideModalOpen(true);
  };

  const handleOverrideRateOrHoursChange = (field: "overtime_rate" | "overtime_hours", val: number) => {
    const nextForm = { ...overrideForm, [field]: val };
    const computedOt = +(Number(nextForm.overtime_hours || 0) * Number(nextForm.overtime_rate || 0)).toFixed(2);
    nextForm.overtime = computedOt;
    setOverrideForm(nextForm);
  };

  const saveOverride = () => {
    if (!overrideModalEmp) return;
    setOverrides({
      ...overrides,
      [overrideModalEmp.id]: {
        bonus: Number(overrideForm.bonus) || 0,
        overtime_rate: Number(overrideForm.overtime_rate) || 0,
        overtime_hours: Number(overrideForm.overtime_hours) || 0,
        overtime: Number(overrideForm.overtime) || 0,
        tds: Number(overrideForm.tds) || 0,
        other_deductions: Number(overrideForm.other_deductions) || 0,
        notes: overrideForm.notes || "",
      },
    });
    setOverrideModalOpen(false);
    toast({ title: "Adjustments Applied", description: `Updated calculations for ${overrideModalEmp.name}` });
  };

  // Open Wager Adjust Dialog
  const openWagerAdjustDialog = (w: WagerCalculatedSalary) => {
    const cur = wagerOverrides[w.employee_id] || {};
    setWagerAdjustForm({
      rate: cur.rate !== undefined ? cur.rate : w.rate,
      overtime_rate: cur.overtime_rate !== undefined ? cur.overtime_rate : w.overtime_rate,
      bonus: cur.bonus !== undefined ? cur.bonus : w.bonus_amount,
      deductions: cur.deductions !== undefined ? cur.deductions : w.advances_deductions,
      notes: cur.notes || w.notes || "",
    });
    setWagerAdjustEmp(w);
    setWagerAdjustModalOpen(true);
  };

  const saveWagerAdjust = () => {
    if (!wagerAdjustEmp) return;
    setWagerOverrides({
      ...wagerOverrides,
      [wagerAdjustEmp.employee_id]: {
        rate: Number(wagerAdjustForm.rate) || 0,
        overtime_rate: Number(wagerAdjustForm.overtime_rate) || 0,
        bonus: Number(wagerAdjustForm.bonus) || 0,
        deductions: Number(wagerAdjustForm.deductions) || 0,
        notes: wagerAdjustForm.notes || "",
      },
    });
    setWagerAdjustModalOpen(false);
    toast({ title: "Wager Rate & Adjustments Updated", description: `Recalculated payout for ${wagerAdjustEmp.employee_name}` });
  };

  // Save Single Day Punch from Modal
  const handleSaveDayPunch = async () => {
    if (!org?.id || !selectedWagerForPunches || !editingDayDate) return;
    setSavingDayPunch(true);
    try {
      const clockInIso = editingDayIn ? `${editingDayDate}T${editingDayIn}:00` : null;
      const clockOutIso = editingDayOut ? `${editingDayDate}T${editingDayOut}:00` : null;

      // Find existing log
      const existing = attendanceLogs.find(
        (a) => a.employee_id === selectedWagerForPunches.employee_id && (a.date === editingDayDate || a.attendance_date === editingDayDate)
      );

      if (existing?.id) {
        await (supabase as any).from("attendances").update({
          clock_in_time: clockInIso,
          clock_out_time: clockOutIso,
          status: editingDayStatus,
        }).eq("id", existing.id);
      } else {
        await (supabase as any).from("attendances").insert({
          org_id: org.id,
          employee_id: selectedWagerForPunches.employee_id,
          date: editingDayDate,
          clock_in_time: clockInIso,
          clock_out_time: clockOutIso,
          status: editingDayStatus,
        });
      }

      toast({ title: "Punch Recorded", description: `Updated time for ${format(parseISO(editingDayDate), "dd MMM yyyy")}` });
      setEditingDayDate(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingDayPunch(false);
    }
  };

  // Process and Save Payroll Run
  const handleSavePayrollRun = async () => {
    if (!org?.id || calculatedSalaries.length === 0) return;
    setSavingRun(true);
    try {
      const monthLabel = format(parseISO(startDate), "MMMM yyyy");
      const title = `Payroll (${format(parseISO(startDate), "dd MMM")} - ${format(parseISO(endDate), "dd MMM yyyy")})`;

      const { data: run, error: runError } = await (supabase as any)
        .from("payroll_runs")
        .insert({
          org_id: org.id,
          title,
          month: format(parseISO(startDate), "yyyy-MM"),
          start_date: startDate,
          end_date: endDate,
          total_employees: calculatedSalaries.length,
          total_gross: totals.gross,
          total_deductions: totals.deductions,
          total_net: totals.net,
          status: "completed",
          metadata: JSON.stringify({
            calculated_at: new Date().toISOString(),
            total_overtime_hours: totals.overtimeHours,
            total_overtime_pay: totals.overtimePay,
            overrides,
          }),
        })
        .select("*")
        .single();

      if (runError) throw runError;

      const payslipRows = calculatedSalaries.map((s) => ({
        run_id: run.id,
        org_id: org.id,
        employee_id: s.employee_id,
        working_days: s.working_days,
        present_days: s.present_days,
        paid_leave_days: s.paid_leave_days,
        lop_days: s.lop_days,
        gross_salary: s.total_earned_gross,
        basic: s.earned_basic,
        hra: s.earned_hra,
        allowances: +(s.earned_da + s.earned_conveyance + s.earned_medical + s.earned_special_allowance + s.earned_food_allowance + s.earned_other_allowances + s.bonus_incentive + s.overtime_pay).toFixed(2),
        pf_employee: s.pf_employee,
        esic_employee: s.esic_employee,
        tds: s.tds_deduction,
        other_deductions: +(s.pt_deduction + s.loan_deduction + s.other_deductions).toFixed(2),
        net_pay: s.net_pay,
        payment_status: "unpaid",
        details: s.details,
      }));

      const { error: psError } = await (supabase as any).from("payslips").insert(payslipRows);
      if (psError) throw psError;

      // ── Business expense entry (backward compat with P&L / Dashboard) ──
      if (totals.net > 0) {
        await (supabase as any).from("business_expenses").insert({
          org_id: org.id,
          category: "Salary",
          description: `Payroll — ${monthLabel}`,
          amount: +totals.net.toFixed(2),
          expense_date: endDate,
          is_recurring: false,
        });
      }

      // ── Double-entry journal entry for proper accounting ──
      try {
        const journalData: PayrollJournalData = {
          runId: run.id,
          entryDate: endDate,
          monthLabel,
          totalGross: totals.gross,
          totalBasic: calculatedSalaries.reduce((s, c) => s + c.earned_basic, 0),
          totalHra: calculatedSalaries.reduce((s, c) => s + c.earned_hra, 0),
          totalAllowances: calculatedSalaries.reduce((s, c) => s + c.earned_da + c.earned_conveyance + c.earned_medical + c.earned_special_allowance + c.earned_food_allowance + c.earned_other_allowances, 0),
          totalOvertimePay: totals.overtimePay,
          totalBonusIncentive: calculatedSalaries.reduce((s, c) => s + c.bonus_incentive, 0),
          totalPfEmployee: calculatedSalaries.reduce((s, c) => s + c.pf_employee, 0),
          totalPfEmployer: calculatedSalaries.reduce((s, c) => s + c.pf_employer, 0),
          totalEsicEmployee: calculatedSalaries.reduce((s, c) => s + c.esic_employee, 0),
          totalEsicEmployer: calculatedSalaries.reduce((s, c) => s + c.esic_employer, 0),
          totalTds: calculatedSalaries.reduce((s, c) => s + c.tds_deduction, 0),
          totalPt: calculatedSalaries.reduce((s, c) => s + c.pt_deduction, 0),
          totalOtherDeductions: calculatedSalaries.reduce((s, c) => s + c.loan_deduction + c.other_deductions, 0),
          totalNetPay: totals.net,
        };
        await postPayrollJournal(org.id, journalData);
      } catch (e) {
        console.error("Failed to post payroll journal:", e);
      }

      toast({
        title: "Payroll Run Created Successfully",
        description: `Saved payroll run for ${calculatedSalaries.length} employees with total net payout of ${formatCurrency(totals.net, currency)}. Journal entry posted.`,
      });

      loadData();
      setSubTab("history");
    } catch (err: any) {
      toast({ title: "Failed to save payroll run", description: err.message, variant: "destructive" });
    } finally {
      setSavingRun(false);
    }
  };

  // Bulk Apply Standard Structure to Monthly Employees
  const handleBulkApplyStandardStructure = async () => {
    if (!monthlyEmployees.length || !org?.id) return;
    if (!confirm(`Apply standard Indian salary structure (50% Basic, 20% HRA, Conveyance, Medical, PF, PT & 9h Overtime Rate) to all ${monthlyEmployees.length} active monthly salaried employees?`)) return;

    setLoading(true);
    try {
      for (const emp of monthlyEmployees) {
        const std = generateStandardIndianSalaryStructure(Number(emp.monthly_salary) || 0, {
          pf_applicable: emp.pf_applicable,
          esic_applicable: (Number(emp.monthly_salary) || 0) <= 21000,
        });

        await (supabase as any)
          .from("employees")
          .update({
            basic_percent: 50,
            hra_percent: 20,
            pf_applicable: std.pf_applicable,
            esic_applicable: std.esic_applicable,
            salary_structure: std,
          })
          .eq("id", emp.id);
      }

      toast({
        title: "All Employees Updated",
        description: "Standard Indian salary structure & overtime settings configured successfully.",
      });

      loadData();
    } catch (err: any) {
      toast({ title: "Bulk update failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card with Date Range & Presets */}
      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">HR Salary & Wages Calculation</h2>
                  <p className="text-xs text-muted-foreground">
                    Monthly staff CTC breakdown, daily & hourly wager calculation, manual punch logging, and overtime tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkApplyStandardStructure}
                className="text-xs border-blue-200 bg-white dark:bg-slate-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Auto-Standardize Monthly Salaries
              </Button>
              <Button
                size="sm"
                onClick={handleSavePayrollRun}
                disabled={savingRun || calculatedSalaries.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {savingRun ? "Saving Run..." : "Save & Process Payroll"}
              </Button>
            </div>
          </div>

          {/* Date Picker & Preset Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-2 border-t border-slate-200 dark:border-slate-800">
            
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Payroll Cycle Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs font-medium bg-white dark:bg-slate-900"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Payroll Cycle End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs font-medium bg-white dark:bg-slate-900"
              />
            </div>

            {/* Quick Cycle Presets */}
            <div className="md:col-span-6 space-y-1">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Quick Cycle Presets ({totalPeriodDays} Days Selected)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-white dark:bg-slate-900"
                  onClick={() => handleSetPreset("this_month")}
                >
                  This Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-white dark:bg-slate-900"
                  onClick={() => handleSetPreset("this_week")}
                >
                  This Week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-white dark:bg-slate-900"
                  onClick={() => handleSetPreset("last_month")}
                >
                  Last Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-white dark:bg-slate-900"
                  onClick={() => handleSetPreset("21_to_20")}
                >
                  21st to 20th
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-white dark:bg-slate-900"
                  onClick={() => handleSetPreset("26_to_25")}
                >
                  26th to 25th
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main Sub Tabs */}
      <Tabs value={subTab} onValueChange={setSubTab} className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1">
            <TabsTrigger value="calc" className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" />
              Monthly Salaried ({calculatedSalaries.length})
            </TabsTrigger>

            {dailyWagesEnabled && (
              <TabsTrigger value="wagers" className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-semibold">
                <HardHat className="w-4 h-4 text-amber-600" />
                Daily & Hourly Wagers ({calculatedWagers.length})
              </TabsTrigger>
            )}

            <TabsTrigger value="master" className="flex items-center gap-1.5">
              <Settings2 className="w-4 h-4" />
              Salary Structure Config
            </TabsTrigger>

            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Payroll Runs ({payrollRuns.length})
            </TabsTrigger>
          </TabsList>

          {(subTab === "calc" || subTab === "wagers") && (
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search staff by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* TAB 1: Monthly Salaried Staff */}
        <TabsContent value="calc" className="space-y-4">
          
          {/* Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Total Gross Earnings</p>
                  <p className="text-2xl font-black text-foreground">{formatCurrency(totals.gross, currency)}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">
                    Incl. {totals.overtimeHours.toFixed(1)}h OT ({formatCurrency(totals.overtimePay, currency)})
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Statutory Deductions</p>
                  <p className="text-2xl font-black text-red-600">{formatCurrency(totals.deductions, currency)}</p>
                  <p className="text-[11px] text-muted-foreground">PF + ESI + PT + TDS</p>
                </div>
                <div className="p-2.5 bg-red-50 dark:bg-red-950 text-red-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
                    Total Net Monthly Payout
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.net, currency)}
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    Across {calculatedSalaries.length} employees
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Auto Overtime & Attendance</p>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                    {totals.overtimeHours.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hrs OT</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {totals.payableDays.toFixed(1)} Payable / {totals.lopDays.toFixed(1)} LOP Days
                  </p>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Monthly Staff Salary Calculation</CardTitle>
                  <CardDescription>
                    Prorated based on {totalPeriodDays} days interval ({format(parseISO(startDate), "dd MMM yyyy")} to {format(parseISO(endDate), "dd MMM yyyy")})
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Base CTC</TableHead>
                    <TableHead className="text-center">Payable / LOP</TableHead>
                    <TableHead className="text-right">Overtime (&gt;9h Auto)</TableHead>
                    <TableHead className="text-right">Earned Gross</TableHead>
                    <TableHead className="text-right">Basic + HRA</TableHead>
                    <TableHead className="text-right">Allowances</TableHead>
                    <TableHead className="text-right">Deductions (PF/PT/TDS)</TableHead>
                    <TableHead className="text-right font-bold">Net Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                        No monthly salaried employee records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalaries.map((s) => {
                      const hasOverrides = !!overrides[s.employee_id];
                      return (
                        <TableRow key={s.employee_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/70">
                          
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                  {s.employee_name}
                                  {hasOverrides && (
                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                                      Adjusted
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>{s.employee_code || "EMP"}</span>
                                  {s.designation && <span>• {s.designation}</span>}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            <span className="font-semibold text-foreground">
                              {formatCurrency(s.base_monthly_gross, currency)}
                            </span>
                            <div className="text-[11px] text-muted-foreground">
                              {formatCurrency(s.per_day_salary, currency)}/day
                            </div>
                          </TableCell>

                          <TableCell className="text-center whitespace-nowrap">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {s.payable_days}
                            </span>
                            <span className="text-muted-foreground text-xs"> / {s.total_days}</span>
                            {s.lop_days > 0 && (
                              <div className="text-[11px] text-red-600 font-semibold">
                                -{s.lop_days} LOP
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            {s.overtime_hours > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedOtBreakdown(s);
                                  setOtBreakdownModalOpen(true);
                                }}
                                className="text-right hover:opacity-80 transition-opacity"
                              >
                                <div className="font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                                  <span>+{formatCurrency(s.overtime_pay, currency)}</span>
                                  <Eye className="w-3 h-3 text-amber-600" />
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {s.overtime_hours}h @ {formatCurrency(s.overtime_hourly_rate, currency)}/h
                                </div>
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right font-semibold text-foreground whitespace-nowrap">
                            {formatCurrency(s.total_earned_gross, currency)}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap text-xs">
                            <div className="font-medium">{formatCurrency(s.earned_basic + s.earned_hra, currency)}</div>
                            <div className="text-[10px] text-muted-foreground">
                              B: {formatCurrency(s.earned_basic, currency)} | H: {formatCurrency(s.earned_hra, currency)}
                            </div>
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap text-xs">
                            <div className="font-medium">
                              {formatCurrency(
                                s.earned_da +
                                  s.earned_conveyance +
                                  s.earned_medical +
                                  s.earned_special_allowance +
                                  s.earned_food_allowance +
                                  s.earned_other_allowances +
                                  s.bonus_incentive,
                                currency
                              )}
                            </div>
                            {s.bonus_incentive > 0 && (
                              <div className="text-[10px] text-emerald-600 font-semibold">
                                +{formatCurrency(s.bonus_incentive, currency)} Bonus
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap text-xs">
                            <div className="font-bold text-red-600">
                              -{formatCurrency(s.total_deductions, currency)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              PF: {formatCurrency(s.pf_employee, currency)} | PT: {formatCurrency(s.pt_deduction, currency)}
                            </div>
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(s.net_pay, currency)}
                            </div>
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 gap-1 border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
                                onClick={() => openOverrideDialog(s.employee_id)}
                                title="Adjust Overtime, Bonus, Deductions"
                              >
                                <Sliders className="w-3 h-3 text-amber-700" />
                                Adjust
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 gap-1"
                                onClick={() => {
                                  setSelectedSlipForView(s);
                                  setSlipModalOpen(true);
                                }}
                              >
                                <Eye className="w-3 h-3 text-primary" />
                                Payslip
                              </Button>
                            </div>
                          </TableCell>

                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Daily & Hourly Wagers Tab (Visible when daily_wages_enabled is ON) */}
        {dailyWagesEnabled && (
          <TabsContent value="wagers" className="space-y-4">
            
            {/* Wager KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-amber-800 font-medium">Active Wager Workers</p>
                    <p className="text-2xl font-black text-amber-900 dark:text-amber-400">{calculatedWagers.length}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {wagerTotals.daysWorked} Total Days / {wagerTotals.hoursWorked}h Clocked
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                    <HardHat className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium">Base Wage Total</p>
                    <p className="text-2xl font-black text-foreground">{formatCurrency(wagerTotals.base, currency)}</p>
                    <p className="text-[11px] text-muted-foreground">Direct daily / hourly base wages</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium">Wager Overtime & Bonus</p>
                    <p className="text-2xl font-black text-amber-600">{formatCurrency(wagerTotals.overtime + wagerTotals.bonus, currency)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {wagerTotals.otHours.toFixed(1)}h Extra Overtime Clocked
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                      Total Net Wager Payout
                    </p>
                    <p className="text-2xl font-black text-emerald-600">
                      {formatCurrency(wagerTotals.net, currency)}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      After -{formatCurrency(wagerTotals.deductions, currency)} advance deductions
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wager Payout Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <HardHat className="w-5 h-5 text-amber-600" />
                      Daily & Hourly Wager Payout Calculation
                    </CardTitle>
                    <CardDescription>
                      Calculated from exact clocked in/out hours and daily attendance records ({format(parseISO(startDate), "dd MMM yyyy")} to {format(parseISO(endDate), "dd MMM yyyy")})
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Wage Model & Rate</TableHead>
                      <TableHead className="text-center">Days / Hours Worked</TableHead>
                      <TableHead className="text-right">Base Wage</TableHead>
                      <TableHead className="text-right">Overtime Pay</TableHead>
                      <TableHead className="text-right">Bonus / Incentives</TableHead>
                      <TableHead className="text-right">Advances / Deductions</TableHead>
                      <TableHead className="text-right font-bold">Net Payout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWagers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          <HardHat className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-sm">No Daily or Hourly Wage Workers found.</p>
                          <p className="text-xs mt-1">Add daily or hourly wager staff from the Employees page to compute their wages.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWagers.map((w) => {
                        const hasAdj = !!wagerOverrides[w.employee_id];
                        return (
                          <TableRow key={w.employee_id} className="hover:bg-amber-50/30 dark:hover:bg-slate-900/50">
                            
                            <TableCell className="font-medium">
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                {w.employee_name}
                                {hasAdj && (
                                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                                    Adjusted
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>{w.employee_code || "WAG"}</span>
                                {w.designation && <span> • {w.designation}</span>}
                              </div>
                            </TableCell>

                            <TableCell>
                              {w.wage_type === "daily" ? (
                                <div>
                                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-xs font-bold">
                                    Daily: {formatCurrency(w.rate, currency)}/day
                                  </Badge>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    Shift: {w.standard_shift_hours}h | OT: {formatCurrency(w.overtime_rate, currency)}/h
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-900 border-purple-300 text-xs font-bold">
                                    Hourly: {formatCurrency(w.rate, currency)}/hr
                                  </Badge>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    OT: {formatCurrency(w.overtime_rate, currency)}/h
                                  </div>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-center whitespace-nowrap">
                              <div className="font-bold text-foreground">
                                {w.days_worked} <span className="text-xs font-normal text-muted-foreground">days</span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono">
                                {w.total_hours_worked}h total ({w.total_overtime_hours}h OT)
                              </div>
                            </TableCell>

                            <TableCell className="text-right font-semibold whitespace-nowrap">
                              {formatCurrency(w.base_wage_amount, currency)}
                            </TableCell>

                            <TableCell className="text-right whitespace-nowrap">
                              {w.overtime_amount > 0 ? (
                                <div className="text-amber-700 font-semibold">
                                  +{formatCurrency(w.overtime_amount, currency)}
                                  <div className="text-[10px] text-muted-foreground">{w.total_overtime_hours} hrs</div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right whitespace-nowrap">
                              {w.bonus_amount > 0 ? (
                                <span className="text-emerald-700 font-semibold">
                                  +{formatCurrency(w.bonus_amount, currency)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right whitespace-nowrap">
                              {w.advances_deductions > 0 ? (
                                <span className="text-red-600 font-bold">
                                  -{formatCurrency(w.advances_deductions, currency)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right whitespace-nowrap">
                              <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(w.net_payable, currency)}
                              </div>
                            </TableCell>

                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1 bg-white hover:bg-slate-50 border-slate-300"
                                  onClick={() => {
                                    setSelectedWagerForPunches(w);
                                    setWagerPunchModalOpen(true);
                                  }}
                                  title="View & Edit Check-in / Out Punches"
                                >
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  Punches ({w.day_records.filter(d => d.status !== 'absent' || d.hours_worked > 0).length}d)
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1 bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
                                  onClick={() => openWagerAdjustDialog(w)}
                                  title="Adjust Rates & Advances"
                                >
                                  <Sliders className="w-3 h-3 text-amber-700" />
                                  Adjust
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900"
                                  onClick={() => {
                                    setSelectedWagerSlip(w);
                                    setWagerSlipModalOpen(true);
                                  }}
                                  title="View & Print Wage Voucher / Slip"
                                >
                                  <Printer className="w-3 h-3 text-emerald-700" />
                                  Wage Slip
                                </Button>
                              </div>
                            </TableCell>

                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </TabsContent>
        )}

        {/* TAB 3: Master Salary Structures */}
        <TabsContent value="master" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Monthly Employee Salary & Benefit Profiles</CardTitle>
                  <CardDescription>
                    Configure Indian salary components (Basic, HRA, Conveyance, PF, ESIC, PT, TDS) and individual overtime rules.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Monthly Gross (CTC)</TableHead>
                    <TableHead className="text-right">Basic % (Amt)</TableHead>
                    <TableHead className="text-right">HRA % (Amt)</TableHead>
                    <TableHead className="text-center">PF (12%)</TableHead>
                    <TableHead className="text-center">ESIC (0.75%)</TableHead>
                    <TableHead className="text-center">PT</TableHead>
                    <TableHead className="text-right">OT Rate (₹/h)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyEmployees.map((emp) => {
                    const struct = parseEmployeeSalaryStructure(emp);
                    return (
                      <TableRow key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                        <TableCell className="font-medium">
                          <div className="font-semibold">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {emp.employee_code || "EMP"} {emp.designation && `• ${emp.designation}`}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-bold text-foreground">
                          {formatCurrency(struct.monthly_gross, currency)}
                        </TableCell>

                        <TableCell className="text-right text-xs">
                          <div className="font-medium">{struct.basic_percent}%</div>
                          <div className="text-muted-foreground">{formatCurrency(struct.basic, currency)}</div>
                        </TableCell>

                        <TableCell className="text-right text-xs">
                          <div className="font-medium">{struct.hra_percent}%</div>
                          <div className="text-muted-foreground">{formatCurrency(struct.hra, currency)}</div>
                        </TableCell>

                        <TableCell className="text-center">
                          {struct.pf_applicable ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                              {struct.pf_capped ? "12% Capped" : "12% Full"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 text-[10px]">
                              N/A
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {struct.esic_applicable ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]">
                              0.75%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 text-[10px]">
                              N/A
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center text-xs">
                          {struct.pt_applicable ? `₹${struct.pt_amount}/mo` : "N/A"}
                        </TableCell>

                        <TableCell className="text-right font-mono font-medium text-amber-700">
                          {formatCurrency(struct.overtime_rate_per_hour, currency)}/h
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 gap-1 text-primary border-primary/30"
                            onClick={() => {
                              setSelectedEmpForStructure(emp);
                              setStructureModalOpen(true);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                            Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Payroll Run History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Saved Payroll Runs</CardTitle>
              <CardDescription>
                Historical processed payroll cycles and generated employee payslips.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle Title / Period</TableHead>
                    <TableHead className="text-center">Employees</TableHead>
                    <TableHead className="text-right">Total Gross</TableHead>
                    <TableHead className="text-right">Total Deductions</TableHead>
                    <TableHead className="text-right font-bold">Total Net Paid</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No saved payroll runs yet. Click "Save & Process Payroll" on the calculated salaries tab.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollRuns.map((run) => (
                      <TableRow key={run.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-medium">
                          <div className="font-bold text-foreground">{run.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {run.start_date} to {run.end_date}
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-bold">
                          {run.total_employees}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(run.total_gross, currency)}
                        </TableCell>

                        <TableCell className="text-right text-red-600 font-semibold">
                          -{formatCurrency(run.total_deductions, currency)}
                        </TableCell>

                        <TableCell className="text-right font-black text-emerald-600">
                          {formatCurrency(run.total_net, currency)}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {format(parseISO(run.created_at), "dd MMM yyyy, hh:mm a")}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 capitalize text-xs">
                            {run.status || "Completed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Salary Structure Configuration Dialog */}
      {structureModalOpen && (
        <SalaryStructureDialog
          open={structureModalOpen}
          onOpenChange={setStructureModalOpen}
          employee={selectedEmpForStructure}
          currency={currency}
          onSaved={loadData}
        />
      )}

      {/* Monthly Payslip Modal */}
      {slipModalOpen && selectedSlipForView && (
        <PayslipModal
          open={slipModalOpen}
          onOpenChange={setSlipModalOpen}
          salary={selectedSlipForView}
          organization={org}
          currency={currency}
        />
      )}

      {/* Monthly Overtime Breakdown Modal */}
      {otBreakdownModalOpen && selectedOtBreakdown && (
        <Dialog open={otBreakdownModalOpen} onOpenChange={setOtBreakdownModalOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Overtime Daily Log: {selectedOtBreakdown.employee_name}
              </DialogTitle>
              <CardDescription>
                Auto-calculated overtime on days exceeding standard shift hours ({selectedOtBreakdown.start_date} to {selectedOtBreakdown.end_date})
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Total Extra OT:</span>
                  <span className="font-bold text-foreground ml-1.5">{selectedOtBreakdown.overtime_hours} Hours</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-bold text-foreground ml-1.5">{formatCurrency(selectedOtBreakdown.overtime_hourly_rate, currency)}/h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total OT Pay:</span>
                  <span className="font-bold text-emerald-700 ml-1.5">+{formatCurrency(selectedOtBreakdown.overtime_pay, currency)}</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead className="text-right">Worked</TableHead>
                    <TableHead className="text-right">Shift</TableHead>
                    <TableHead className="text-right font-bold text-amber-700">Overtime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOtBreakdown.overtime_breakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-xs text-muted-foreground">
                        No individual overtime log entries recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedOtBreakdown.overtime_breakdown.map((row, idx) => (
                      <TableRow key={idx} className="text-xs">
                        <TableCell className="font-medium">{format(parseISO(row.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-mono">{row.clock_in ? format(parseISO(row.clock_in), "hh:mm a") : "-"}</TableCell>
                        <TableCell className="font-mono">{row.clock_out ? format(parseISO(row.clock_out), "hh:mm a") : "-"}</TableCell>
                        <TableCell className="text-right font-semibold">{row.worked_hours}h</TableCell>
                        <TableCell className="text-right text-muted-foreground">{row.standard_hours}h</TableCell>
                        <TableCell className="text-right font-bold text-amber-700">+{row.overtime_hours}h</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => setOtBreakdownModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Monthly Adjustments Modal */}
      {overrideModalOpen && overrideModalEmp && (
        <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Adjust Salary & Overtime: {overrideModalEmp.name}
              </DialogTitle>
              <CardDescription>
                Customize overtime hours, price per hour, bonus, and deductions for this payroll period.
              </CardDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-2">
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Overtime Calculation (Extra Hours & Hourly Price)
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Overtime Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={overrideForm.overtime_hours || ""}
                      onChange={(e) => handleOverrideRateOrHoursChange("overtime_hours", Number(e.target.value))}
                      placeholder="0"
                      className="h-8 text-xs bg-white dark:bg-slate-900 font-semibold text-amber-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Hourly Rate (₹ / hr)</Label>
                    <Input
                      type="number"
                      step="10"
                      value={overrideForm.overtime_rate || ""}
                      onChange={(e) => handleOverrideRateOrHoursChange("overtime_rate", Number(e.target.value))}
                      placeholder="0"
                      className="h-8 text-xs bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-amber-200/60 dark:border-amber-900/60 text-xs">
                  <span className="text-muted-foreground font-medium">Calculated Overtime Pay:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(overrideForm.overtime, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Performance Bonus / Incentive (₹)</Label>
                <Input
                  type="number"
                  value={overrideForm.bonus || ""}
                  onChange={(e) => setOverrideForm({ ...overrideForm, bonus: Number(e.target.value) })}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Monthly TDS Adjustment (₹)</Label>
                <Input
                  type="number"
                  value={overrideForm.tds || ""}
                  onChange={(e) => setOverrideForm({ ...overrideForm, tds: Number(e.target.value) })}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Other One-Time Deductions (₹)</Label>
                <Input
                  type="number"
                  value={overrideForm.other_deductions || ""}
                  onChange={(e) => setOverrideForm({ ...overrideForm, other_deductions: Number(e.target.value) })}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveOverride} className="bg-blue-600 hover:bg-blue-700 text-white">
                Apply Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Wager Adjustments Modal */}
      {wagerAdjustModalOpen && wagerAdjustEmp && (
        <Dialog open={wagerAdjustModalOpen} onOpenChange={setWagerAdjustModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                Adjust Wager Rates & Advances: {wagerAdjustEmp.employee_name}
              </DialogTitle>
              <CardDescription>
                Customize {wagerAdjustEmp.wage_type === "daily" ? "daily rate (₹/day)" : "hourly rate (₹/hr)"}, overtime rate, bonuses, and advance deductions.
              </CardDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    {wagerAdjustEmp.wage_type === "daily" ? "Daily Rate (₹ / day)" : "Hourly Rate (₹ / hr)"}
                  </Label>
                  <Input
                    type="number"
                    value={wagerAdjustForm.rate || ""}
                    onChange={(e) => setWagerAdjustForm({ ...wagerAdjustForm, rate: Number(e.target.value) })}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Overtime Rate (₹ / hr)</Label>
                  <Input
                    type="number"
                    value={wagerAdjustForm.overtime_rate || ""}
                    onChange={(e) => setWagerAdjustForm({ ...wagerAdjustForm, overtime_rate: Number(e.target.value) })}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bonus / Food / Site Incentive (₹)</Label>
                <Input
                  type="number"
                  value={wagerAdjustForm.bonus || ""}
                  onChange={(e) => setWagerAdjustForm({ ...wagerAdjustForm, bonus: Number(e.target.value) })}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Advance Paid / Penalty Deduction (₹)</Label>
                <Input
                  type="number"
                  value={wagerAdjustForm.deductions || ""}
                  onChange={(e) => setWagerAdjustForm({ ...wagerAdjustForm, deductions: Number(e.target.value) })}
                  placeholder="0"
                  className="h-8 text-xs font-bold text-red-600"
                />
                <p className="text-[11px] text-muted-foreground">Will be deducted from final net wage payout.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Remarks / Notes</Label>
                <Input
                  value={wagerAdjustForm.notes}
                  onChange={(e) => setWagerAdjustForm({ ...wagerAdjustForm, notes: e.target.value })}
                  placeholder="e.g. Paid ₹500 advance on site"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setWagerAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveWagerAdjust} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                Apply Wager Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Wager Punch Editor & Time Logs Modal */}
      {wagerPunchModalOpen && selectedWagerForPunches && (
        <Dialog open={wagerPunchModalOpen} onOpenChange={setWagerPunchModalOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Time Logs & Manual Punches: {selectedWagerForPunches.employee_name}
              </DialogTitle>
              <CardDescription>
                View, set, or adjust exact clock-in and clock-out times for each day in this pay cycle ({startDate} to {endDate}).
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              
              {/* If actively editing a day punch */}
              {editingDayDate && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-blue-900">
                      Edit Punch for {format(parseISO(editingDayDate), "EEEE, dd MMMM yyyy")}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingDayDate(null)}>
                      Cancel
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <select
                        value={editingDayStatus}
                        onChange={(e) => setEditingDayStatus(e.target.value)}
                        className="w-full h-8 text-xs border rounded px-2 bg-white"
                      >
                        <option value="present">Present (Full Day)</option>
                        <option value="half_day">Half Day</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Clock In Time</Label>
                      <Input
                        type="time"
                        value={editingDayIn}
                        onChange={(e) => setEditingDayIn(e.target.value)}
                        className="h-8 text-xs bg-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Clock Out Time</Label>
                      <Input
                        type="time"
                        value={editingDayOut}
                        onChange={(e) => setEditingDayOut(e.target.value)}
                        className="h-8 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveDayPunch} disabled={savingDayPunch} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                      {savingDayPunch ? "Saving..." : "Save Daily Punch"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Day Records Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead className="text-right">Worked</TableHead>
                    <TableHead className="text-right">OT</TableHead>
                    <TableHead className="text-right font-bold">Day Wage</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWagerForPunches.day_records.map((d: WagerDayRecord) => {
                    const isPresent = d.status === "present" || d.status === "late" || d.status === "half_day" || d.hours_worked > 0;
                    return (
                      <TableRow key={d.date} className={isPresent ? "hover:bg-slate-50" : "opacity-60 bg-slate-50/40"}>
                        <TableCell className="font-medium text-xs">
                          {format(parseISO(d.date), "dd MMM")} ({d.day_name})
                        </TableCell>

                        <TableCell>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            d.status === "present" ? "bg-emerald-100 text-emerald-800" :
                            d.status === "half_day" ? "bg-orange-100 text-orange-800" :
                            d.status === "late" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {d.status}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          {d.clock_in ? format(parseISO(d.clock_in), "hh:mm a") : "-"}
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          {d.clock_out ? format(parseISO(d.clock_out), "hh:mm a") : "-"}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-xs">
                          {d.hours_worked > 0 ? `${d.hours_worked}h` : "-"}
                        </TableCell>

                        <TableCell className="text-right text-xs">
                          {d.overtime_hours > 0 ? (
                            <span className="text-amber-700 font-bold">+{d.overtime_hours}h</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell className="text-right font-bold text-xs">
                          {d.day_amount > 0 ? formatCurrency(d.day_amount, currency) : "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setEditingDayDate(d.date);
                              setEditingDayStatus(d.status === "absent" ? "present" : d.status);
                              if (d.clock_in) {
                                try { setEditingDayIn(format(parseISO(d.clock_in), "HH:mm")); } catch {}
                              } else {
                                setEditingDayIn("09:00");
                              }
                              if (d.clock_out) {
                                try { setEditingDayOut(format(parseISO(d.clock_out), "HH:mm")); } catch {}
                              } else {
                                setEditingDayOut("18:00");
                              }
                            }}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {isPresent ? "Edit" : "Set"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => setWagerPunchModalOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Wager Payment Voucher / Slip Modal */}
      {wagerSlipModalOpen && selectedWagerSlip && (
        <WagerSlipModal
          slip={selectedWagerSlip}
          org={org}
          currency={currency}
          onClose={() => setWagerSlipModalOpen(false)}
        />
      )}

    </div>
  );
}

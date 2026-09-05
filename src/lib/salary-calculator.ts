import { eachDayOfInterval, format, parseISO } from "date-fns";

export interface SalaryStructure {
  monthly_gross: number;
  basic: number;
  basic_percent: number;
  hra: number;
  hra_percent: number;
  da: number;
  conveyance: number;
  medical: number;
  special_allowance: number;
  food_allowance: number;
  performance_bonus: number;
  other_allowances: number;
  other_allowances_label?: string; // Custom name for other allowances (e.g. "Internet Allowance")
  
  // Overtime & Shift settings
  overtime_rate_per_hour: number; // ₹ per hour (e.g. ₹150 / ₹200)
  standard_shift_hours: number;    // default 9 hours
  overtime_rate_type?: 'fixed' | 'auto_calculated';

  // Deductions
  pf_applicable: boolean;
  pf_percent?: number; // default 12%
  pf_capped: boolean; // Capped at 12% of ₹15,000 = ₹1,800
  esic_applicable: boolean;
  esic_percent?: number; // default 0.75%
  esic_custom_limit?: boolean; // allow ESIC calculation regardless of 21k gross limit
  pt_applicable: boolean;
  pt_amount: number;
  tds_amount: number;
  loan_emi: number;
  other_deductions: number;
  other_deductions_label?: string; // Custom name for other deductions (e.g. "Uniform Charge", "Mess Fee")
  
  payment_mode?: 'bank_transfer' | 'cheque' | 'cash' | 'upi';
}

export const DEFAULT_SALARY_STRUCTURE: SalaryStructure = {
  monthly_gross: 0,
  basic: 0,
  basic_percent: 50,
  hra: 0,
  hra_percent: 20,
  da: 0,
  conveyance: 1600,
  medical: 1250,
  special_allowance: 0,
  food_allowance: 0,
  performance_bonus: 0,
  other_allowances: 0,
  other_allowances_label: "Other Allowances",
  
  overtime_rate_per_hour: 0, // 0 = auto-calculated based on daily wage / 9 hrs
  standard_shift_hours: 9,
  overtime_rate_type: 'auto_calculated',

  pf_applicable: true,
  pf_percent: 12,
  pf_capped: true,
  esic_applicable: false,
  esic_percent: 0.75,
  esic_custom_limit: false,
  pt_applicable: true,
  pt_amount: 200,
  tds_amount: 0,
  loan_emi: 0,
  other_deductions: 0,
  other_deductions_label: "Other Deductions",
  payment_mode: 'bank_transfer'
};

/**
 * Auto-balances Indian standard salary components given a Monthly Gross / CTC.
 * - Basic: 50% of Gross
 * - HRA: 20% of Gross (40% of Basic)
 * - Conveyance: ₹1,600 (or prorated)
 * - Medical: ₹1,250 (or prorated)
 * - Special Allowance: Balance remaining
 * - Overtime: Default auto hourly rate based on standard 9 hours
 * - PF: 12% on Basic (capped at ₹1,800 if pf_capped is true)
 * - ESI: 0.75% on Gross if Gross <= ₹21,000
 * - PT: ₹200
 */
export function generateStandardIndianSalaryStructure(gross: number, options: Partial<SalaryStructure> = {}): SalaryStructure {
  const g = Math.max(0, Number(gross) || 0);
  const basic = +(g * 0.50).toFixed(2);
  const hra = +(g * 0.20).toFixed(2);
  const conveyance = g >= 20000 ? 1600 : +(g * 0.05).toFixed(2);
  const medical = g >= 25000 ? 1250 : +(g * 0.04).toFixed(2);
  const da = options.da || 0;
  const food = options.food_allowance || 0;
  const bonus = options.performance_bonus || 0;
  const otherAllw = options.other_allowances || 0;

  const currentSum = basic + hra + conveyance + medical + da + food + bonus + otherAllw;
  const special_allowance = Math.max(0, +(g - currentSum).toFixed(2));

  // Overtime rate: if not specified, default to round(g / (26 working days * 9 hrs)) or round(g / (30 * 9))
  const standard_shift_hours = options.standard_shift_hours ?? 9;
  const autoOvertimeRate = g > 0 ? Math.round(g / (26 * standard_shift_hours)) : 0;
  const overtime_rate_per_hour = options.overtime_rate_per_hour !== undefined ? options.overtime_rate_per_hour : autoOvertimeRate;

  const pf_applicable = options.pf_applicable !== undefined ? options.pf_applicable : (g >= 15000);
  const pf_percent = options.pf_percent !== undefined ? Number(options.pf_percent) : 12;
  const pf_capped = options.pf_capped !== undefined ? options.pf_capped : true;
  const esic_applicable = options.esic_applicable !== undefined ? options.esic_applicable : (g <= 21000 && g > 0);
  const esic_percent = options.esic_percent !== undefined ? Number(options.esic_percent) : 0.75;
  const esic_custom_limit = options.esic_custom_limit !== undefined ? options.esic_custom_limit : false;
  const pt_applicable = options.pt_applicable !== undefined ? options.pt_applicable : (g >= 10000);
  const pt_amount = pt_applicable ? (options.pt_amount ?? 200) : 0;

  return {
    monthly_gross: g,
    basic,
    basic_percent: 50,
    hra,
    hra_percent: 20,
    da,
    conveyance,
    medical,
    special_allowance,
    food_allowance: food,
    performance_bonus: bonus,
    other_allowances: otherAllw,
    other_allowances_label: options.other_allowances_label || "Other Allowances",
    overtime_rate_per_hour,
    standard_shift_hours,
    overtime_rate_type: options.overtime_rate_type || 'auto_calculated',
    pf_applicable,
    pf_percent,
    pf_capped,
    esic_applicable,
    esic_percent,
    esic_custom_limit,
    pt_applicable,
    pt_amount,
    tds_amount: options.tds_amount || 0,
    loan_emi: options.loan_emi || 0,
    other_deductions: options.other_deductions || 0,
    other_deductions_label: options.other_deductions_label || "Other Deductions",
    payment_mode: options.payment_mode || 'bank_transfer',
  };
}

export function parseEmployeeSalaryStructure(emp: any): SalaryStructure {
  const g = Number(emp.monthly_salary) || 0;
  const custom = emp.salary_structure && typeof emp.salary_structure === 'object' ? emp.salary_structure : {};

  if (Object.keys(custom).length > 0 && custom.monthly_gross !== undefined) {
    const stdHours = Number(custom.standard_shift_hours || 9);
    const autoOt = g > 0 ? Math.round(g / (26 * stdHours)) : 0;

    return {
      ...DEFAULT_SALARY_STRUCTURE,
      ...custom,
      monthly_gross: Number(custom.monthly_gross || g),
      basic: Number(custom.basic ?? +(g * (Number(emp.basic_percent || 50) / 100)).toFixed(2)),
      hra: Number(custom.hra ?? +(g * (Number(emp.hra_percent || 20) / 100)).toFixed(2)),
      overtime_rate_per_hour: Number(custom.overtime_rate_per_hour !== undefined ? custom.overtime_rate_per_hour : autoOt),
      standard_shift_hours: stdHours,
      pf_applicable: custom.pf_applicable !== undefined ? !!custom.pf_applicable : !!emp.pf_applicable,
      pf_percent: custom.pf_percent !== undefined ? Number(custom.pf_percent) : 12,
      pf_capped: custom.pf_capped !== undefined ? !!custom.pf_capped : true,
      esic_applicable: custom.esic_applicable !== undefined ? !!custom.esic_applicable : !!emp.esic_applicable,
      esic_percent: custom.esic_percent !== undefined ? Number(custom.esic_percent) : 0.75,
      esic_custom_limit: !!custom.esic_custom_limit,
      pt_applicable: custom.pt_applicable !== undefined ? !!custom.pt_applicable : true,
      pt_amount: custom.pt_amount !== undefined ? Number(custom.pt_amount) : 200,
      other_deductions_label: custom.other_deductions_label || "Other Deductions",
      other_allowances_label: custom.other_allowances_label || "Other Allowances",
    };
  }

  return generateStandardIndianSalaryStructure(g, {
    basic_percent: Number(emp.basic_percent || 50),
    hra_percent: Number(emp.hra_percent || 20),
    pf_applicable: !!emp.pf_applicable,
    esic_applicable: !!emp.esic_applicable,
  });
}

export interface AttendanceRecordLike {
  employee_id: string;
  date?: string;
  attendance_date?: string;
  status: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
}

export interface OvertimeDayBreakdown {
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  worked_hours: number;
  standard_hours: number;
  overtime_hours: number;
}

export interface CalculateSalaryParams {
  employees: any[];
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  attendanceLogs: any[]; // from 'attendances' and/or 'attendance'
  leaves: any[];         // approved leaves
  holidays: any[];       // org holidays
  weeklyOffs: number[];  // e.g. [0] for Sunday
  employeeShifts?: Record<string, string>; // empId -> shiftId
  shifts?: any[];        // list of shifts (to calculate start_time vs end_time)
  overrides?: Record<string, {
    bonus?: number;
    overtime?: number;
    overtime_hours?: number;
    overtime_rate?: number;
    other_deductions?: number;
    tds?: number;
    notes?: string;
  }>;
}

export interface EmployeeCalculatedSalary {
  employee_id: string;
  employee_name: string;
  employee_code?: string;
  designation?: string;
  pan?: string;
  bank_account?: string;
  bank_ifsc?: string;
  payment_mode?: string;
  
  // Date and Attendance
  start_date: string;
  end_date: string;
  total_days: number;
  working_days: number;
  present_days: number;
  half_days: number;
  paid_leave_days: number;
  holidays_and_offs: number;
  payable_days: number;
  lop_days: number;
  
  // Base Salary Rate
  base_monthly_gross: number;
  per_day_salary: number;
  
  // Overtime Breakdown
  auto_overtime_hours: number;
  overtime_hours: number;
  overtime_hourly_rate: number;
  overtime_days_count: number;
  overtime_breakdown: OvertimeDayBreakdown[];
  overtime_pay: number;

  // Earned Gross components (Prorated based on payable days)
  earned_basic: number;
  earned_hra: number;
  earned_da: number;
  earned_conveyance: number;
  earned_medical: number;
  earned_special_allowance: number;
  earned_food_allowance: number;
  earned_other_allowances: number;
  bonus_incentive: number;
  total_earned_gross: number;
  
  // Deductions
  pf_employee: number;
  esic_employee: number;
  pt_deduction: number;
  tds_deduction: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  
  // Net
  net_pay: number;
  payment_status: 'unpaid' | 'paid';
  
  // Details JSON to save in payslip
  details: any;
}

export function calculateEmployeeSalaryForPeriod({
  employees,
  startDate,
  endDate,
  attendanceLogs,
  leaves,
  holidays,
  weeklyOffs = [0],
  employeeShifts = {},
  shifts = [],
  overrides = {},
}: CalculateSalaryParams): EmployeeCalculatedSalary[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const intervalDays = eachDayOfInterval({ start, end });
  const totalDays = intervalDays.length;
  if (totalDays <= 0) return [];

  // Build attendance lookup: empId|date -> full attendance log
  const attLogMap: Record<string, any> = {};
  (attendanceLogs || []).forEach((a) => {
    const d = a.date || a.attendance_date;
    if (d && a.employee_id) {
      // If multiple records for same day, prioritize one with clock_out_time
      const key = `${a.employee_id}|${d}`;
      if (!attLogMap[key] || (!attLogMap[key].clock_out_time && a.clock_out_time)) {
        attLogMap[key] = a;
      }
    }
  });

  // Approved leave lookup: empId|date -> true
  const leaveMap: Record<string, boolean> = {};
  (leaves || []).filter(l => l.status === 'approved').forEach((l) => {
    try {
      const ls = parseISO(l.start_date);
      const le = parseISO(l.end_date);
      const lDays = eachDayOfInterval({ start: ls, end: le });
      lDays.forEach(ld => {
        leaveMap[`${l.employee_id}|${format(ld, 'yyyy-MM-dd')}`] = true;
      });
    } catch {}
  });

  // Holiday lookup: date -> true
  const holMap: Record<string, boolean> = {};
  (holidays || []).forEach(h => {
    if (h.date) holMap[h.date] = true;
  });

  return employees.map((emp) => {
    const struct = parseEmployeeSalaryStructure(emp);
    const empOverrides = overrides[emp.id] || {};

    let present = 0;
    let halfDays = 0;
    let paidLeaves = 0;
    let holidaysAndOffs = 0;
    let absent = 0;

    let auto_overtime_hours = 0;
    let overtime_days_count = 0;
    const overtime_breakdown: OvertimeDayBreakdown[] = [];

    // Find assigned shift duration in hours
    const empShiftId = employeeShifts[emp.id];
    const shift = (shifts || []).find((s: any) => s.id === empShiftId);
    let shiftDurationHours = struct.standard_shift_hours || 9;

    if (shift && shift.start_time && shift.end_time) {
      const [sh, sm] = shift.start_time.slice(0, 5).split(':').map(Number);
      const [eh, em] = shift.end_time.slice(0, 5).split(':').map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMins > 0) {
        shiftDurationHours = +(diffMins / 60).toFixed(2);
      }
    }

    intervalDays.forEach((dayDate) => {
      const ds = format(dayDate, 'yyyy-MM-dd');
      const isOff = weeklyOffs.includes(dayDate.getDay());
      const isHoliday = !!holMap[ds];

      if (leaveMap[`${emp.id}|${ds}`]) {
        paidLeaves++;
        return;
      }

      if (isOff || isHoliday) {
        holidaysAndOffs++;
        return;
      }

      const log = attLogMap[`${emp.id}|${ds}`];
      const status = log?.status;

      const PRESENT_STATUSES = ['present', 'wfh', 'od', 'on_duty'];
      const PAID_LEAVE_STATUSES = ['paid_leave', 'approved_leave', 'casual', 'sick', 'el_pl', 'comp_off', 'maternity', 'paternity'];

      if (status && PRESENT_STATUSES.includes(status)) {
        present++;
      } else if (status === 'half_day' || status === 'half-day') {
        halfDays++;
      } else if (status === 'late') {
        present++; // Late counts as present for salary calculation
      } else if (status && PAID_LEAVE_STATUSES.includes(status)) {
        paidLeaves++;
      } else if (status === 'holiday') {
        holidaysAndOffs++;
      } else if (status === 'absent' || status === 'lwp' || status === 'ncns') {
        absent++;
      } else if (log && log.clock_in_time) {
        // If has clock_in_time without explicit absent status
        present++;
      } else {
        absent++;
      }

      // --- AUTOMATIC OVERTIME CALCULATION ---
      // Check if employee checked in for more than standard shift hours (e.g. 9 hours)
      if (log?.clock_in_time && log?.clock_out_time) {
        try {
          const inTime = new Date(log.clock_in_time).getTime();
          const outTime = new Date(log.clock_out_time).getTime();
          const durationHours = (outTime - inTime) / (1000 * 60 * 60);

          if (durationHours > shiftDurationHours) {
            const extraHours = +(durationHours - shiftDurationHours).toFixed(2);
            if (extraHours >= 0.25) { // At least 15 minutes
              auto_overtime_hours += extraHours;
              overtime_days_count++;
              overtime_breakdown.push({
                date: ds,
                clock_in: log.clock_in_time,
                clock_out: log.clock_out_time,
                worked_hours: +durationHours.toFixed(2),
                standard_hours: shiftDurationHours,
                overtime_hours: extraHours,
              });
            }
          }
        } catch {}
      }
    });

    const payableDays = +(present + (halfDays * 0.5) + paidLeaves + holidaysAndOffs).toFixed(2);
    const lopDays = Math.max(0, +(totalDays - payableDays).toFixed(2));
    const prorationRatio = totalDays > 0 ? (payableDays / totalDays) : 0;

    const baseMonthlyGross = struct.monthly_gross;
    const perDayRate = totalDays > 0 ? +(baseMonthlyGross / totalDays).toFixed(2) : 0;

    // Prorated Earnings
    const earned_basic = +(struct.basic * prorationRatio).toFixed(2);
    const earned_hra = +(struct.hra * prorationRatio).toFixed(2);
    const earned_da = +(struct.da * prorationRatio).toFixed(2);
    const earned_conveyance = +(struct.conveyance * prorationRatio).toFixed(2);
    const earned_medical = +(struct.medical * prorationRatio).toFixed(2);
    const earned_special_allowance = +(struct.special_allowance * prorationRatio).toFixed(2);
    const earned_food_allowance = +(struct.food_allowance * prorationRatio).toFixed(2);
    const earned_other_allowances = +(struct.other_allowances * prorationRatio).toFixed(2);

    // Overtime Rate and Calculation
    const defaultHourlyRate = struct.overtime_rate_per_hour > 0
      ? struct.overtime_rate_per_hour
      : (baseMonthlyGross > 0 ? Math.round(baseMonthlyGross / (26 * shiftDurationHours)) : 0);

    const overtime_hourly_rate = Number(empOverrides.overtime_rate ?? defaultHourlyRate);
    const overtime_hours = Number(empOverrides.overtime_hours ?? +auto_overtime_hours.toFixed(2));
    
    // Total Overtime Pay
    const autoOvertimePay = +(overtime_hours * overtime_hourly_rate).toFixed(2);
    const overtime_pay = Number(empOverrides.overtime !== undefined ? empOverrides.overtime : autoOvertimePay);

    // Bonus / Incentive
    const bonus_incentive = Number(empOverrides.bonus ?? struct.performance_bonus ?? 0);

    const total_earned_gross = +(
      earned_basic +
      earned_hra +
      earned_da +
      earned_conveyance +
      earned_medical +
      earned_special_allowance +
      earned_food_allowance +
      earned_other_allowances +
      bonus_incentive +
      overtime_pay
    ).toFixed(2);

    // Deductions Calculation (as per configured rates / Indian statutory guidelines)
    // 1. Employee PF: pf_percent % of (Earned Basic + Earned DA)
    let pf_employee = 0;
    const pfRate = (Number(struct.pf_percent) || 12) / 100;
    if (struct.pf_applicable) {
      const pfWage = earned_basic + earned_da;
      if (struct.pf_capped) {
        // Capped at pfRate of ₹15,000 (prorated if LOP)
        const cappedBase = Math.min(pfWage, 15000 * prorationRatio);
        pf_employee = +(cappedBase * pfRate).toFixed(2);
      } else {
        pf_employee = +(pfWage * pfRate).toFixed(2);
      }
    }

    // 2. Employee ESIC: esic_percent % of Gross
    let esic_employee = 0;
    const esicRate = (Number(struct.esic_percent) || 0.75) / 100;
    if (struct.esic_applicable && (struct.esic_custom_limit ? true : baseMonthlyGross <= 21000)) {
      esic_employee = +(total_earned_gross * esicRate).toFixed(2);
    }

    // 3. Professional Tax (PT): standard amount (if earned gross > 0)
    let pt_deduction = 0;
    if (struct.pt_applicable && total_earned_gross > 0) {
      pt_deduction = struct.pt_amount || 200;
    }

    // 4. TDS (Tax Deducted at Source)
    const tds_deduction = Number(empOverrides.tds ?? struct.tds_amount ?? 0);

    // 5. Loan / Advance Deduction
    const loan_deduction = Number(struct.loan_emi ?? 0);

    // 6. Other custom deductions
    const other_deductions = Number(empOverrides.other_deductions ?? struct.other_deductions ?? 0);

    const total_deductions = +(
      pf_employee +
      esic_employee +
      pt_deduction +
      tds_deduction +
      loan_deduction +
      other_deductions
    ).toFixed(2);

    const net_pay = Math.max(0, +(total_earned_gross - total_deductions).toFixed(2));

    const details = {
      salary_structure: struct,
      pf_percent: struct.pf_percent || 12,
      esic_percent: struct.esic_percent || 0.75,
      other_deductions_label: struct.other_deductions_label || 'Other Deductions',
      other_allowances_label: struct.other_allowances_label || 'Other Allowances',
      attendance_breakdown: {
        total_days: totalDays,
        present_days: present,
        half_days: halfDays,
        paid_leave_days: paidLeaves,
        holidays_and_offs: holidaysAndOffs,
        absent_days: absent,
        payable_days: payableDays,
        lop_days: lopDays,
      },
      overtime: {
        auto_hours: +auto_overtime_hours.toFixed(2),
        billed_hours: overtime_hours,
        hourly_rate: overtime_hourly_rate,
        total_pay: overtime_pay,
        days_count: overtime_days_count,
        breakdown: overtime_breakdown,
      },
      earnings_breakdown: {
        basic: earned_basic,
        hra: earned_hra,
        da: earned_da,
        conveyance: earned_conveyance,
        medical: earned_medical,
        special_allowance: earned_special_allowance,
        food_allowance: earned_food_allowance,
        other_allowances: earned_other_allowances,
        other_allowances_label: struct.other_allowances_label || 'Other Allowances',
        bonus_incentive,
        overtime_pay,
      },
      deductions_breakdown: {
        pf_employee,
        pf_percent: struct.pf_percent || 12,
        esic_employee,
        esic_percent: struct.esic_percent || 0.75,
        professional_tax: pt_deduction,
        tds: tds_deduction,
        loan_recovery: loan_deduction,
        other_deductions,
        other_deductions_label: struct.other_deductions_label || 'Other Deductions',
      }
    };

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      employee_code: emp.employee_code || '',
      designation: emp.designation || '',
      pan: emp.pan || '',
      bank_account: emp.bank_account || '',
      bank_ifsc: emp.bank_ifsc || '',
      payment_mode: struct.payment_mode || 'bank_transfer',
      
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      working_days: totalDays - holidaysAndOffs,
      present_days: present,
      half_days: halfDays,
      paid_leave_days: paidLeaves,
      holidays_and_offs: holidaysAndOffs,
      payable_days: payableDays,
      lop_days: lopDays,
      
      base_monthly_gross: baseMonthlyGross,
      per_day_salary: perDayRate,

      auto_overtime_hours: +auto_overtime_hours.toFixed(2),
      overtime_hours,
      overtime_hourly_rate,
      overtime_days_count,
      overtime_breakdown,
      overtime_pay,
      
      earned_basic,
      earned_hra,
      earned_da,
      earned_conveyance,
      earned_medical,
      earned_special_allowance,
      earned_food_allowance,
      earned_other_allowances,
      bonus_incentive,
      total_earned_gross,
      
      pf_employee,
      esic_employee,
      pt_deduction,
      tds_deduction,
      loan_deduction,
      other_deductions,
      total_deductions,
      
      net_pay,
      payment_status: 'unpaid',
      details,
    };
  });
}

export interface WagerDayRecord {
  date: string;
  day_name: string;
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  day_amount: number;
}

export interface WagerCalculatedSalary {
  employee_id: string;
  employee_name: string;
  employee_code?: string;
  designation?: string;
  phone?: string;
  wage_type: 'daily' | 'hourly';
  rate: number;
  overtime_rate: number;
  standard_shift_hours: number;
  
  start_date: string;
  end_date: string;
  total_days_in_period: number;
  days_worked: number;
  total_hours_worked: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  
  base_wage_amount: number;
  overtime_amount: number;
  bonus_amount: number;
  advances_deductions: number;
  net_payable: number;
  
  day_records: WagerDayRecord[];
  notes?: string;
}

export interface CalculateWagersParams {
  employees: any[];
  startDate: string;
  endDate: string;
  attendanceLogs: any[];
  shifts?: any[];
  employeeShifts?: Record<string, string>;
  overrides?: Record<string, {
    rate?: number;
    overtime_rate?: number;
    bonus?: number;
    deductions?: number;
    notes?: string;
  }>;
}

export function calculateWagerSalaryForPeriod({
  employees,
  startDate,
  endDate,
  attendanceLogs,
  shifts = [],
  employeeShifts = {},
  overrides = {},
}: CalculateWagersParams): WagerCalculatedSalary[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const intervalDays = eachDayOfInterval({ start, end });
  const totalDaysInPeriod = intervalDays.length;
  if (totalDaysInPeriod <= 0) return [];

  // Build attendance lookup: empId|date -> log
  const attLogMap: Record<string, any> = {};
  (attendanceLogs || []).forEach((a) => {
    const d = a.date || a.attendance_date;
    if (d && a.employee_id) {
      const key = `${a.employee_id}|${d}`;
      if (!attLogMap[key] || (!attLogMap[key].clock_out_time && a.clock_out_time)) {
        attLogMap[key] = a;
      }
    }
  });

  // Filter only wager employees
  const wagerEmps = employees.filter((e) => e.wage_type === 'daily' || e.wage_type === 'hourly');

  return wagerEmps.map((emp) => {
    const wageType: 'daily' | 'hourly' = emp.wage_type === 'hourly' ? 'hourly' : 'daily';
    const empOverride = overrides[emp.id] || {};

    const defaultRate = wageType === 'daily' 
      ? Number(emp.daily_rate || (emp.monthly_salary ? +(emp.monthly_salary / 26).toFixed(2) : 500))
      : Number(emp.hourly_rate || (emp.monthly_salary ? +(emp.monthly_salary / (26 * 8)).toFixed(2) : 75));

    const rate = Number(empOverride.rate !== undefined ? empOverride.rate : defaultRate);

    // Standard shift hours
    const empShiftId = employeeShifts[emp.id];
    const shift = (shifts || []).find((s: any) => s.id === empShiftId);
    let standardShiftHours = 9;

    if (shift && shift.start_time && shift.end_time) {
      const [sh, sm] = shift.start_time.slice(0, 5).split(':').map(Number);
      const [eh, em] = shift.end_time.slice(0, 5).split(':').map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMins > 0) {
        standardShiftHours = +(diffMins / 60).toFixed(2);
      }
    }

    const defaultOtRate = wageType === 'daily'
      ? +(rate / standardShiftHours).toFixed(2)
      : rate;
    const overtimeRate = Number(empOverride.overtime_rate !== undefined ? empOverride.overtime_rate : defaultOtRate);

    let daysWorked = 0;
    let totalHoursWorked = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let baseWageAmount = 0;

    const dayRecords: WagerDayRecord[] = [];

    intervalDays.forEach((dayDate) => {
      const ds = format(dayDate, 'yyyy-MM-dd');
      const dayName = format(dayDate, 'EEE');
      const log = attLogMap[`${emp.id}|${ds}`];

      let hoursWorked = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let dayAmount = 0;
      let dayStatus = log?.status || 'absent';

      if (log?.clock_in_time && log?.clock_out_time) {
        try {
          const inTime = new Date(log.clock_in_time).getTime();
          const outTime = new Date(log.clock_out_time).getTime();
          const diffHrs = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
          hoursWorked = +diffHrs.toFixed(2);
        } catch {}
      } else if (log?.clock_in_time && !log?.clock_out_time) {
        // If checked in only, assume standard hours or 8 hours
        hoursWorked = standardShiftHours;
      }

      if (hoursWorked > 0 || dayStatus === 'present' || dayStatus === 'late' || dayStatus === 'half_day') {
        if (dayStatus === 'half_day') {
          daysWorked += 0.5;
          if (hoursWorked === 0) hoursWorked = +(standardShiftHours / 2).toFixed(2);
        } else {
          daysWorked += 1;
          if (hoursWorked === 0) hoursWorked = standardShiftHours;
          if (dayStatus === 'absent') dayStatus = 'present';
        }

        totalHoursWorked += hoursWorked;

        if (hoursWorked > standardShiftHours) {
          regularHours = standardShiftHours;
          overtimeHours = +(hoursWorked - standardShiftHours).toFixed(2);
        } else {
          regularHours = hoursWorked;
          overtimeHours = 0;
        }

        totalRegularHours += regularHours;
        totalOvertimeHours += overtimeHours;

        if (wageType === 'daily') {
          dayAmount = dayStatus === 'half_day' ? +(rate * 0.5).toFixed(2) : rate;
        } else {
          dayAmount = +(regularHours * rate).toFixed(2);
        }

        baseWageAmount += dayAmount;
      }

      dayRecords.push({
        date: ds,
        day_name: dayName,
        status: dayStatus,
        clock_in: log?.clock_in_time || null,
        clock_out: log?.clock_out_time || null,
        hours_worked: hoursWorked,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        day_amount: dayAmount,
      });
    });

    const overtimeAmount = +(totalOvertimeHours * overtimeRate).toFixed(2);
    const bonusAmount = Number(empOverride.bonus ?? 0);
    const advancesDeductions = Number(empOverride.deductions ?? 0);

    const netPayable = Math.max(0, +(baseWageAmount + overtimeAmount + bonusAmount - advancesDeductions).toFixed(2));

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      employee_code: emp.employee_code || '',
      designation: emp.designation || '',
      phone: emp.phone || '',
      wage_type: wageType,
      rate,
      overtime_rate: overtimeRate,
      standard_shift_hours: standardShiftHours,
      
      start_date: startDate,
      end_date: endDate,
      total_days_in_period: totalDaysInPeriod,
      days_worked: +daysWorked.toFixed(1),
      total_hours_worked: +totalHoursWorked.toFixed(2),
      total_regular_hours: +totalRegularHours.toFixed(2),
      total_overtime_hours: +totalOvertimeHours.toFixed(2),
      
      base_wage_amount: +baseWageAmount.toFixed(2),
      overtime_amount: overtimeAmount,
      bonus_amount: bonusAmount,
      advances_deductions: advancesDeductions,
      net_payable: netPayable,
      
      day_records: dayRecords,
      notes: empOverride.notes || '',
    };
  });
}

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CalendarDays, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

function computeShiftStatus(clockInTime: string, shift: any): string {
  if (!clockInTime) return "absent";
  try {
    const d = new Date(clockInTime);
    if (isNaN(d.getTime())) return "present";
    const clockInMins = d.getHours() * 60 + d.getMinutes();

    const effectiveShift = shift || {
      start_time: "09:00",
      grace_minutes: 15,
      late_end: "10:30",
      half_day_end: "14:00",
    };

    const toMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.slice(0, 5).split(":").map(Number);
      return h * 60 + m;
    };
    const startTimeMins = toMins(effectiveShift.start_time || "09:00");
    const graceMins = effectiveShift.grace_minutes ?? 15;
    const graceEnd = startTimeMins + graceMins;
    const lateEnd = toMins(effectiveShift.late_end || "10:30");
    const halfEnd = toMins(effectiveShift.half_day_end || "14:00");

    if (clockInMins <= graceEnd) return "present";
    if (clockInMins <= lateEnd) return "late";
    if (clockInMins <= halfEnd) return "half_day";
    return "half_day";
  } catch {
    return "present";
  }
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "—";
  try {
    const trimmed = String(timeStr).trim();
    if (!trimmed || trimmed === "-") return "—";
    if (/\b(AM|PM)\b/i.test(trimmed)) return trimmed;
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const [h, m] = trimmed.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m), 0, 0);
      return format(d, "hh:mm a");
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return format(d, "hh:mm a");
    }
    return trimmed;
  } catch {
    return timeStr || "—";
  }
}

function getStatusBadge(status: string, leaveType?: string) {
  const norm = (status || "").toLowerCase().replace("-", "_").trim();

  if (norm === "present") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        Present
      </span>
    );
  }
  if (norm === "late") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        Late
      </span>
    );
  }
  if (norm === "half_day") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
        Half Day
      </span>
    );
  }
  if (norm === "absent") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        Absent
      </span>
    );
  }
  if (norm === "leave" || norm === "paid_leave" || norm === "approved_leave") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
        {leaveType ? `Leave (${leaveType})` : "Leave"}
      </span>
    );
  }
  if (norm === "holiday") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Holiday
      </span>
    );
  }
  if (norm === "wfh") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
        WFH
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
      {status ? status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ") : "Present"}
    </span>
  );
}

export default function HRReportsPage() {
  const org = useAppStore((s) => s.organization);
  
  const [headcount, setHeadcount] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [totalLeaveDays, setTotalLeaveDays] = useState(0);
  const [totalPayrollCost, setTotalPayrollCost] = useState(0);
  
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!org?.id) return;
    
    const fetchData = async () => {
      // Employees
      const { data: employees } = await supabase
        .from("employees")
        .select("*")
        .eq("org_id", org.id);
        
      if (employees) {
        setHeadcount(employees.length);
        setActiveEmployees(employees.filter(e => e.status !== 'inactive').length); // Adjust status check based on actual data
      }

      // Leaves
      const currentYear = new Date().getFullYear();
      const { data: leaves } = await supabase
        .from("leaves")
        .select("*, employees(id, name, designation)")
        .eq("org_id", org.id)
        .eq("status", "approved");

      let totalDays = 0;
      const leaveCounts: Record<string, number> = {};
      
      if (leaves) {
        leaves.forEach(l => {
          if (l.start_date && l.start_date.startsWith(currentYear.toString())) {
            const start = new Date(l.start_date);
            const end = new Date(l.end_date || l.start_date);
            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
            totalDays += days;
            
            const type = l.leave_type || 'Other';
            leaveCounts[type] = (leaveCounts[type] || 0) + days;
          }
        });
        
        setTotalLeaveDays(totalDays);
        setLeaveData(Object.keys(leaveCounts).map(key => ({
          name: key,
          value: leaveCounts[key]
        })));
      }

      // Payslips
      const { data: payslips } = await supabase
        .from("payslips")
        .select("*")
        .eq("org_id", org.id);
        
      if (payslips) {
        let totalCost = 0;
        const monthlyCost: Record<string, number> = {};
        
        payslips.forEach(p => {
          const cost = Number(p.net_pay) || 0;
          totalCost += cost;
          
          if (p.salary_month) {
            monthlyCost[p.salary_month] = (monthlyCost[p.salary_month] || 0) + cost;
          }
        });
        
        setTotalPayrollCost(totalCost);
        
        // Sort months appropriately if they are in "YYYY-MM" format
        const sortedMonths = Object.keys(monthlyCost).sort();
        setPayrollData(sortedMonths.map(m => ({
          month: m,
          cost: monthlyCost[m]
        })));
      }

      // Attendance: Fetch from both 'attendances' (clock-in/out) and 'attendance' (HR status), plus shifts
      const [clockinRes, hrAttRes, shiftsRes, empShiftsRes] = await Promise.all([
        (supabase as any)
          .from("attendances")
          .select("*, employees(id, name, designation)")
          .eq("org_id", org.id)
          .order("date", { ascending: false })
          .limit(60),
        (supabase as any)
          .from("attendance")
          .select("*, employees(id, name, designation)")
          .eq("org_id", org.id)
          .order("attendance_date", { ascending: false })
          .limit(60),
        (supabase as any)
          .from("shifts")
          .select("*")
          .eq("org_id", org.id)
          .order("is_default", { ascending: false }),
        (supabase as any)
          .from("employee_shifts")
          .select("*, shifts(*)")
          .eq("org_id", org.id),
      ]);

      const orgDefaultShift = (shiftsRes?.data || []).find((s: any) => s.is_default) || shiftsRes?.data?.[0] || null;
      const shiftMap: Record<string, any> = {};
      (empShiftsRes?.data || []).forEach((es: any) => {
        shiftMap[es.employee_id] = es.shifts;
      });

      const empMap: Record<string, any> = {};
      (employees || []).forEach((e: any) => {
        empMap[e.id] = e;
      });

      // Map approved leaves by employee_id|date
      const leaveMap: Record<string, { type: string; employeeName?: string; designation?: string }> = {};
      (leaves || []).forEach((l: any) => {
        try {
          if (!l.start_date || !l.employee_id) return;
          const s = new Date(l.start_date);
          const e = new Date(l.end_date || l.start_date);
          for (let cur = new Date(s); cur <= e; cur.setDate(cur.getDate() + 1)) {
            const ds = format(cur, "yyyy-MM-dd");
            leaveMap[`${l.employee_id}|${ds}`] = {
              type: l.leave_type || "Leave",
              employeeName: l.employees?.name,
              designation: l.employees?.designation,
            };
          }
        } catch {}
      });

      const mergedMap: Record<string, any> = {};

      // 1. Process HR manual attendance records
      (hrAttRes?.data || []).forEach((r: any) => {
        const dateStr = r.attendance_date;
        if (!dateStr || !r.employee_id) return;
        const key = `${r.employee_id}|${dateStr}`;
        const emp = r.employees || empMap[r.employee_id];
        mergedMap[key] = {
          id: r.id,
          date: dateStr,
          employee_id: r.employee_id,
          employeeName: emp?.name || "—",
          designation: emp?.designation || "",
          status: r.override_status || r.status || "present",
          clock_in_time: r.clock_in_time || r.check_in_time || null,
          clock_out_time: r.clock_out_time || r.check_out_time || null,
          created_at: r.created_at || dateStr,
        };
      });

      // 2. Process clock-in / clock-out records
      (clockinRes?.data || []).forEach((r: any) => {
        const dateStr = r.date;
        if (!dateStr || !r.employee_id) return;
        const key = `${r.employee_id}|${dateStr}`;
        const emp = r.employees || empMap[r.employee_id];
        const shift = shiftMap[r.employee_id] || orgDefaultShift;

        let calculatedStatus = r.status;
        if (r.clock_in_time && (!calculatedStatus || calculatedStatus === "present")) {
          calculatedStatus = computeShiftStatus(r.clock_in_time, shift);
        }

        const existing = mergedMap[key];
        if (existing) {
          existing.clock_in_time = r.clock_in_time || existing.clock_in_time;
          existing.clock_out_time = r.clock_out_time || existing.clock_out_time;
          if ((!existing.employeeName || existing.employeeName === "—") && emp?.name) {
            existing.employeeName = emp.name;
            existing.designation = emp.designation || "";
          }
          if ((!existing.status || existing.status === "absent" || existing.status === "present") && r.clock_in_time) {
            existing.status = calculatedStatus || "present";
          }
          if (existing.status === "present" && (calculatedStatus === "late" || calculatedStatus === "half_day" || calculatedStatus === "half-day")) {
            existing.status = calculatedStatus;
          }
        } else {
          mergedMap[key] = {
            id: r.id,
            date: dateStr,
            employee_id: r.employee_id,
            employeeName: emp?.name || "—",
            designation: emp?.designation || "",
            status: calculatedStatus || "present",
            clock_in_time: r.clock_in_time || null,
            clock_out_time: r.clock_out_time || null,
            created_at: r.created_at || dateStr,
          };
        }
      });

      // 3. Overlay approved leaves
      Object.keys(leaveMap).forEach((key) => {
        const [empId, dateStr] = key.split("|");
        const leaveInfo = leaveMap[key];
        const emp = empMap[empId];
        if (mergedMap[key]) {
          if (!mergedMap[key].clock_in_time) {
            mergedMap[key].status = "leave";
            mergedMap[key].leaveType = leaveInfo.type;
          }
        } else {
          mergedMap[key] = {
            id: `leave_${key}`,
            date: dateStr,
            employee_id: empId,
            employeeName: leaveInfo.employeeName || emp?.name || "—",
            designation: leaveInfo.designation || emp?.designation || "",
            status: "leave",
            leaveType: leaveInfo.type,
            clock_in_time: null,
            clock_out_time: null,
            created_at: dateStr,
          };
        }
      });

      // 4. Fill in missing employee names
      Object.values(mergedMap).forEach((rec: any) => {
        if ((!rec.employeeName || rec.employeeName === "—") && empMap[rec.employee_id]) {
          rec.employeeName = empMap[rec.employee_id].name;
          rec.designation = empMap[rec.employee_id].designation || "";
        }
      });

      // 5. Sort descending by date, then by time
      const sorted = Object.values(mergedMap).sort((a: any, b: any) => {
        const cmp = b.date.localeCompare(a.date);
        if (cmp !== 0) return cmp;
        return (b.clock_in_time || b.created_at || "").localeCompare(a.clock_in_time || a.created_at || "");
      });

      setRecentAttendance(sorted.slice(0, 30));
    };
    
    fetchData();
  }, [org?.id]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">HR Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and KPIs for Human Resources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Headcount</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{headcount}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeEmployees}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Leave Days (YTD)</CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalLeaveDays}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Payroll Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayrollCost)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Monthly Payroll Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
                    formatter={(value: number) => [formatCurrency(value), 'Cost']}
                  />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Leave Types Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {leaveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {leaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No leave data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-500">Date</TableHead>
                  <TableHead className="text-gray-500">Employee</TableHead>
                  <TableHead className="text-gray-500">Status</TableHead>
                  <TableHead className="text-gray-500">Check In</TableHead>
                  <TableHead className="text-gray-500">Check Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((record, idx) => {
                    const dateVal = record.date || record.attendance_date;
                    const employeeName = record.employeeName || record.employees?.name || "-";
                    const designation = record.designation || record.employees?.designation;
                    const checkIn = formatTime(record.clock_in_time || record.check_in || record.clock_in);
                    const checkOut = formatTime(record.clock_out_time || record.check_out || record.clock_out);
                    const status = record.status || "present";
                    return (
                      <TableRow key={record.id || idx} className="border-gray-200 hover:bg-gray-50/50">
                        <TableCell className="text-gray-600 font-medium">
                          {dateVal ? format(new Date(dateVal), "MMM dd, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900 font-semibold">{employeeName}</div>
                          {designation && <div className="text-xs text-gray-500">{designation}</div>}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(status, record.leaveType)}
                        </TableCell>
                        <TableCell className="text-gray-600 font-medium">{checkIn}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{checkOut}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow className="border-gray-200">
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No recent attendance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

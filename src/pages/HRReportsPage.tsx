import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CalendarDays, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

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
        .select("*")
        .eq("org_id", org.id)
        .eq("status", "approved");

      let totalDays = 0;
      const leaveCounts: Record<string, number> = {};
      
      if (leaves) {
        leaves.forEach(l => {
          if (l.start_date && l.start_date.startsWith(currentYear.toString())) {
            // Very simplified days calculation
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

      // Attendance - fetch from 'attendances' table (clock-in/out records)
      const { data: attendance, error: attErr } = await (supabase as any)
        .from("attendances")
        .select(`
          *,
          employees ( name, designation )
        `)
        .eq("org_id", org.id)
        .order('date', { ascending: false })
        .limit(20);

      if (attErr) console.error("Attendance fetch error:", attErr);
        
      if (attendance && attendance.length > 0) {
        setRecentAttendance(attendance);
      } else {
        // Fallback: try the 'attendance' table (HR-set records)
        const { data: attendance2 } = await (supabase as any)
          .from("attendance")
          .select(`
            *,
            employees ( name, designation )
          `)
          .eq("org_id", org.id)
          .order('attendance_date', { ascending: false })
          .limit(20);
        if (attendance2) setRecentAttendance(attendance2);
      }
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
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
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-9000">
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
                    const employeeName = record.employees?.name || '-';
                    const checkIn = record.check_in || record.clock_in || '-';
                    const checkOut = record.check_out || record.clock_out || '-';
                    const status = record.status || 'present';
                    return (
                      <TableRow key={record.id || idx} className="border-gray-200 hover:bg-gray-50/50">
                        <TableCell className="text-gray-600 font-medium">
                          {dateVal ? format(new Date(dateVal), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 font-semibold">
                          {employeeName}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            status === 'absent' ? 'bg-rose-100 text-rose-700' :
                            status === 'late' ? 'bg-amber-100 text-amber-700' :
                            status === 'half_day' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500">{checkIn}</TableCell>
                        <TableCell className="text-gray-500">{checkOut}</TableCell>
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

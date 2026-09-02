import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { numberToWords } from "@/lib/number-to-words";
import { EmployeeCalculatedSalary } from "@/lib/salary-calculator";
import { Download, Printer, Building2, Calendar, FileText, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slip: EmployeeCalculatedSalary | null;
  organization: any;
  currency?: string;
}

export function PayslipModal({
  open,
  onOpenChange,
  slip,
  organization,
  currency = "INR",
}: PayslipModalProps) {
  if (!slip) return null;

  const orgName = organization?.name || "Company Name";
  const orgAddress = organization?.address || "";
  const orgGst = organization?.gst_number || organization?.tax_id || "";
  
  const formattedStart = format(parseISO(slip.start_date), "dd MMM yyyy");
  const formattedEnd = format(parseISO(slip.end_date), "dd MMM yyyy");
  const netInWords = `${numberToWords(Math.round(slip.net_pay))} Rupees Only`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(orgName, pageWidth / 2, 16, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (orgAddress) doc.text(orgAddress, pageWidth / 2, 22, { align: "center" });
    doc.text(`PAYSLIP FOR PERIOD: ${formattedStart} to ${formattedEnd}`, pageWidth / 2, 28, { align: "center" });

    doc.setLineWidth(0.3);
    doc.line(14, 32, pageWidth - 14, 32);

    // Employee Details Table
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Name:", 14, 38);
    doc.text("Employee ID:", 110, 38);
    doc.text("Designation:", 14, 44);
    doc.text("Pay Period Days:", 110, 44);
    doc.text("Bank Account:", 14, 50);
    doc.text("Payable / LOP Days:", 110, 50);
    doc.text("PAN Number:", 14, 56);
    doc.text("Payment Mode:", 110, 56);

    doc.setFont("helvetica", "normal");
    doc.text(slip.employee_name, 50, 38);
    doc.text(slip.employee_code || "-", 150, 38);
    doc.text(slip.designation || "-", 50, 44);
    doc.text(`${slip.total_days} Days`, 150, 44);
    doc.text(slip.bank_account ? `${slip.bank_account} (${slip.bank_ifsc || ''})` : "-", 50, 50);
    doc.text(`${slip.payable_days} Days / ${slip.lop_days} LOP`, 150, 50);
    doc.text(slip.pan || "-", 50, 56);
    doc.text(slip.payment_mode || "Bank Transfer", 150, 56);

    doc.line(14, 60, pageWidth - 14, 60);

    // Earnings & Deductions Tables
    let y = 66;
    doc.setFont("helvetica", "bold");
    doc.text("EARNINGS & ALLOWANCES", 14, y);
    doc.text("AMOUNT (INR)", 90, y, { align: "right" });
    doc.text("DEDUCTIONS", 110, y);
    doc.text("AMOUNT (INR)", pageWidth - 14, y, { align: "right" });

    doc.line(14, y + 2, pageWidth - 14, y + 2);
    y += 8;

    const otherAllowancesName = slip.details?.other_allowances_label || "Other Allowances";
    const otherDeductionsName = slip.details?.other_deductions_label || "Other Deductions";
    const pfPct = slip.details?.pf_percent ?? 12;
    const esicPct = slip.details?.esic_percent ?? 0.75;

    const earnings = [
      { name: "Basic Salary", amount: slip.earned_basic },
      { name: "House Rent Allowance (HRA)", amount: slip.earned_hra },
      ...(slip.earned_da > 0 ? [{ name: "Dearness Allowance (DA)", amount: slip.earned_da }] : []),
      ...(slip.earned_conveyance > 0 ? [{ name: "Conveyance Allowance", amount: slip.earned_conveyance }] : []),
      ...(slip.earned_medical > 0 ? [{ name: "Medical Allowance", amount: slip.earned_medical }] : []),
      ...(slip.earned_special_allowance > 0 ? [{ name: "Special Allowance", amount: slip.earned_special_allowance }] : []),
      ...(slip.earned_food_allowance > 0 ? [{ name: "Food / Meal Allowance", amount: slip.earned_food_allowance }] : []),
      ...(slip.earned_other_allowances > 0 ? [{ name: otherAllowancesName, amount: slip.earned_other_allowances }] : []),
      ...(slip.bonus_incentive > 0 ? [{ name: "Performance Bonus / Incentive", amount: slip.bonus_incentive }] : []),
      ...(slip.overtime_pay > 0 ? [{ name: `Overtime Pay (${slip.overtime_hours || 0} hrs @ INR ${slip.overtime_hourly_rate || 0}/hr)`, amount: slip.overtime_pay }] : []),
    ];

    const deductions = [
      ...(slip.pf_employee > 0 ? [{ name: `Provident Fund (EPF ${pfPct}%)`, amount: slip.pf_employee }] : []),
      ...(slip.esic_employee > 0 ? [{ name: `Employee State Insurance (ESIC ${esicPct}%)`, amount: slip.esic_employee }] : []),
      ...(slip.pt_deduction > 0 ? [{ name: "Professional Tax (PT)", amount: slip.pt_deduction }] : []),
      ...(slip.tds_deduction > 0 ? [{ name: "Tax Deducted at Source (TDS)", amount: slip.tds_deduction }] : []),
      ...(slip.loan_deduction > 0 ? [{ name: "Loan / Advance Recovery", amount: slip.loan_deduction }] : []),
      ...(slip.other_deductions > 0 ? [{ name: otherDeductionsName, amount: slip.other_deductions }] : []),
    ];

    const maxRows = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      if (earnings[i]) {
        doc.text(earnings[i].name, 14, y);
        doc.text(earnings[i].amount.toFixed(2), 90, y, { align: "right" });
      }
      if (deductions[i]) {
        doc.text(deductions[i].name, 110, y);
        doc.text(deductions[i].amount.toFixed(2), pageWidth - 14, y, { align: "right" });
      }
      y += 6;
    }

    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    // Totals
    doc.setFont("helvetica", "bold");
    doc.text("Total Gross Earnings:", 14, y);
    doc.text(slip.total_earned_gross.toFixed(2), 90, y, { align: "right" });
    doc.text("Total Deductions:", 110, y);
    doc.text(slip.total_deductions.toFixed(2), pageWidth - 14, y, { align: "right" });

    y += 8;
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    // Net Pay Box
    doc.setFontSize(11);
    doc.text("NET SALARY PAYABLE:", 14, y);
    doc.text(`INR ${slip.net_pay.toFixed(2)}`, pageWidth - 14, y, { align: "right" });
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`In Words: ${netInWords}`, 14, y);

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.text("Employer Signature / Seal", 14, y);
    doc.text("Employee Signature", pageWidth - 14, y, { align: "right" });

    doc.save(`Payslip_${slip.employee_name.replace(/\s+/g, "_")}_${slip.start_date}_to_${slip.end_date}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:p-0">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-xl font-bold">Salary Payslip Preview</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1.5" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="w-4 h-4 mr-1.5" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Payslip Card */}
        <div id="printable-payslip" className="border rounded-xl p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm space-y-6">
          
          {/* Header */}
          <div className="border-b pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-xl font-black text-blue-900 dark:text-blue-200">
              <Building2 className="w-6 h-6 text-blue-600" />
              {orgName}
            </div>
            {orgAddress && <p className="text-xs text-muted-foreground">{orgAddress}</p>}
            {orgGst && <p className="text-xs text-muted-foreground">GSTIN / Tax ID: {orgGst}</p>}
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Salary Payslip ({formattedStart} to {formattedEnd})
            </div>
          </div>

          {/* Employee & Attendance Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs">
            <div>
              <span className="text-muted-foreground block">Employee Name</span>
              <strong className="text-sm font-bold text-foreground">{slip.employee_name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Employee ID</span>
              <strong className="font-semibold">{slip.employee_code || "EMP-001"}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Designation</span>
              <strong className="font-semibold">{slip.designation || "Staff"}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Payment Mode</span>
              <strong className="font-semibold capitalize">{slip.payment_mode || "Bank Transfer"}</strong>
            </div>

            <div>
              <span className="text-muted-foreground block">Period Days</span>
              <strong className="font-semibold">{slip.total_days} Days</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Payable Days</span>
              <strong className="font-semibold text-emerald-600">{slip.payable_days} Days</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Loss of Pay (LOP)</span>
              <strong className="font-semibold text-red-600">{slip.lop_days} Days</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Bank Account</span>
              <strong className="font-semibold">{slip.bank_account ? `${slip.bank_account}` : "—"}</strong>
            </div>
          </div>

          {/* Dual Columns: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg overflow-hidden">
            
            {/* Earnings Column */}
            <div className="divide-y">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex justify-between">
                <span>Earnings & Benefits</span>
                <span>Amount</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-semibold">{formatCurrency(slip.earned_basic, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-semibold">{formatCurrency(slip.earned_hra, currency)}</span>
                </div>
                {slip.earned_da > 0 && (
                  <div className="flex justify-between">
                    <span>Dearness Allowance (DA)</span>
                    <span className="font-semibold">{formatCurrency(slip.earned_da, currency)}</span>
                  </div>
                )}
                {slip.earned_conveyance > 0 && (
                  <div className="flex justify-between">
                    <span>Conveyance Allowance</span>
                    <span className="font-semibold">{formatCurrency(slip.earned_conveyance, currency)}</span>
                  </div>
                )}
                {slip.earned_medical > 0 && (
                  <div className="flex justify-between">
                    <span>Medical Allowance</span>
                    <span className="font-semibold">{formatCurrency(slip.earned_medical, currency)}</span>
                  </div>
                )}
                {slip.earned_special_allowance > 0 && (
                  <div className="flex justify-between">
                    <span>Special Allowance</span>
                    <span className="font-semibold">{formatCurrency(slip.earned_special_allowance, currency)}</span>
                  </div>
                )}
                {slip.earned_food_allowance > 0 && (
                  <div className="flex justify-between">
                    <span>Food / Meal Allowance</span>
                    <span className="font-semibold">{formatCurrency(slip.earned_food_allowance, currency)}</span>
                  </div>
                )}
                {slip.earned_other_allowances > 0 && (
                  <div className="flex justify-between">
                    <span>{slip.details?.other_allowances_label || "Other Allowances"}</span>
                    <span className="font-semibold">{formatCurrency(slip.earned_other_allowances, currency)}</span>
                  </div>
                )}
                {slip.bonus_incentive > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Bonus / Performance Incentive</span>
                    <span className="font-semibold">{formatCurrency(slip.bonus_incentive, currency)}</span>
                  </div>
                )}
                {slip.overtime_pay > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Overtime Pay ({slip.overtime_hours} hrs @ {formatCurrency(slip.overtime_hourly_rate, currency)}/hr)</span>
                    <span className="font-semibold">{formatCurrency(slip.overtime_pay, currency)}</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs flex justify-between border-t">
                <span>Total Gross Earnings</span>
                <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(slip.total_earned_gross, currency)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="divide-y border-t md:border-t-0 md:border-l">
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold text-xs flex justify-between">
                <span>Deductions & Statutory</span>
                <span>Amount</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                {slip.pf_employee > 0 ? (
                  <div className="flex justify-between">
                    <span>Provident Fund (EPF {slip.details?.pf_percent ?? 12}%)</span>
                    <span className="font-semibold text-red-600">{formatCurrency(slip.pf_employee, currency)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Provident Fund (EPF)</span>
                    <span>-</span>
                  </div>
                )}

                {slip.esic_employee > 0 ? (
                  <div className="flex justify-between">
                    <span>Employee State Insurance (ESIC {slip.details?.esic_percent ?? 0.75}%)</span>
                    <span className="font-semibold text-red-600">{formatCurrency(slip.esic_employee, currency)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>ESIC</span>
                    <span>-</span>
                  </div>
                )}

                {slip.pt_deduction > 0 && (
                  <div className="flex justify-between">
                    <span>Professional Tax (PT)</span>
                    <span className="font-semibold text-red-600">{formatCurrency(slip.pt_deduction, currency)}</span>
                  </div>
                )}

                {slip.tds_deduction > 0 && (
                  <div className="flex justify-between">
                    <span>TDS / Income Tax</span>
                    <span className="font-semibold text-red-600">{formatCurrency(slip.tds_deduction, currency)}</span>
                  </div>
                )}

                {slip.loan_deduction > 0 && (
                  <div className="flex justify-between">
                    <span>Loan / Advance Recovery</span>
                    <span className="font-semibold text-red-600">{formatCurrency(slip.loan_deduction, currency)}</span>
                  </div>
                )}

                {slip.other_deductions > 0 && (
                  <div className="flex justify-between">
                    <span>{slip.details?.other_deductions_label || "Other Deductions"}</span>
                    <span className="font-semibold text-red-600">{formatCurrency(slip.other_deductions, currency)}</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs flex justify-between border-t">
                <span>Total Deductions</span>
                <span className="text-red-600 dark:text-red-400">- {formatCurrency(slip.total_deductions, currency)}</span>
              </div>
            </div>

          </div>

          {/* Net Salary Payable Box */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300 block">
                Net Salary Payable
              </span>
              <span className="text-xs text-muted-foreground italic">
                Amount in words: <strong className="text-foreground">{netInWords}</strong>
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(slip.net_pay, currency)}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-muted-foreground">
            <div className="border-t pt-2 text-center">
              Authorized Signatory (Employer)
            </div>
            <div className="border-t pt-2 text-center">
              Employee Signature
            </div>
          </div>

        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

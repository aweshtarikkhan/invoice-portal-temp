import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";

interface WagerSlipModalProps {
  slip: any;
  org: any;
  currency: string;
  onClose: () => void;
}

export function WagerSlipModal({ slip, org, currency, onClose }: WagerSlipModalProps) {
  const slipRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const formatDate = (d: string) => {
    try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
  };

  const handleDownloadPdf = async () => {
    if (!slipRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const fileName = `WageSlip_${(slip.employee_name || "Worker").replace(/\s+/g, "_")}_${slip.start_date}_to_${slip.end_date}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const totalEarnings = (slip.base_wage_amount || 0) + (slip.overtime_amount || 0) + (slip.bonus_amount || 0);
  const totalDeductions = slip.advances_deductions || 0;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <span>Wage Payment Slip</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {downloading ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* ─── Printable / PDF Template ─── */}
        <div
          ref={slipRef}
          className="bg-white text-slate-900"
          style={{ width: "100%", fontFamily: "Arial, sans-serif" }}
        >
          {/* ── Top Colour Band ── */}
          <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #0e7490 100%)", padding: "24px 28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.3px" }}>
                  {org?.name || "Organisation Name"}
                </div>
                {org?.address && (
                  <div style={{ fontSize: "11px", color: "#bfdbfe", marginTop: "2px" }}>{org.address}</div>
                )}
                {org?.gstin && (
                  <div style={{ fontSize: "10px", color: "#93c5fd", marginTop: "2px" }}>GSTIN: {org.gstin}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "6px", padding: "6px 14px", display: "inline-block",
                  fontSize: "11px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px",
                }}>
                  {slip.wage_type === "daily" ? "DAILY WAGE SLIP" : "HOURLY WAGE SLIP"}
                </div>
                <div style={{ fontSize: "11px", color: "#bfdbfe", marginTop: "6px" }}>
                  Pay Period: {formatDate(slip.start_date)} – {formatDate(slip.end_date)}
                </div>
                <div style={{ fontSize: "10px", color: "#93c5fd", marginTop: "2px" }}>
                  Generated: {format(new Date(), "dd MMM yyyy")}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 28px" }}>
            {/* ── Worker Details ── */}
            <div style={{
              border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px",
              marginBottom: "16px", background: "#f8fafc"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                Worker Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Worker Name", value: slip.employee_name || "—" },
                  { label: "Worker Code", value: slip.employee_code || "—" },
                  { label: "Designation", value: slip.designation || "Wage Worker" },
                  { label: "Wage Type", value: slip.wage_type === "daily" ? "Daily Wage" : "Hourly Wage" },
                  { label: "Base Rate", value: slip.wage_type === "daily" ? `${formatCurrency(slip.rate, currency)} / day` : `${formatCurrency(slip.rate, currency)} / hr` },
                  { label: "Overtime Rate", value: slip.overtime_rate > 0 ? `${formatCurrency(slip.overtime_rate, currency)} / hr` : "Not Set" },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: "10px", color: "#94a3b8" }}>{item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "1px" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Attendance Summary Cards ── */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                Attendance & Hours Summary
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Days Worked", value: `${slip.days_worked || 0}`, color: "#0f172a", bg: "#f1f5f9", border: "#e2e8f0" },
                  { label: "Total Hours", value: `${slip.total_hours_worked || 0} hrs`, color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
                  { label: "Overtime Hrs", value: `+${slip.total_overtime_hours || 0} hrs`, color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
                  { label: "Half Days", value: `${slip.half_days || 0}`, color: "#713f12", bg: "#fef9c3", border: "#fde047" },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: s.bg, border: `1px solid ${s.border}`, borderRadius: "8px",
                    padding: "10px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>{s.label}</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Earnings & Deductions ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {/* Earnings */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#064e3b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
                  Earnings
                </div>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "6px 0", color: "#475569" }}>Base Wage</td>
                      <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>{formatCurrency(slip.base_wage_amount || 0, currency)}</td>
                    </tr>
                    {(slip.overtime_amount || 0) > 0 && (
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "6px 0", color: "#475569" }}>Overtime ({slip.total_overtime_hours}h)</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#d97706" }}>+{formatCurrency(slip.overtime_amount, currency)}</td>
                      </tr>
                    )}
                    {(slip.bonus_amount || 0) > 0 && (
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "6px 0", color: "#475569" }}>Bonus / Incentive</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#16a34a" }}>+{formatCurrency(slip.bonus_amount, currency)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "2px solid #0f172a" }}>
                      <td style={{ padding: "8px 0", fontWeight: 700 }}>Total Earnings</td>
                      <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 800, color: "#166534", fontSize: "13px" }}>{formatCurrency(totalEarnings, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
                  Deductions
                </div>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <tbody>
                    {totalDeductions > 0 ? (
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "6px 0", color: "#475569" }}>Advance / Food / Damage</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#dc2626" }}>-{formatCurrency(totalDeductions, currency)}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={2} style={{ padding: "6px 0", color: "#94a3b8", fontSize: "11px" }}>No deductions this period</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "2px solid #0f172a" }}>
                      <td style={{ padding: "8px 0", fontWeight: 700 }}>Total Deductions</td>
                      <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 800, color: "#dc2626", fontSize: "13px" }}>{formatCurrency(totalDeductions, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Net Payable Banner ── */}
            <div style={{
              background: "linear-gradient(135deg, #064e3b, #065f46)", borderRadius: "10px",
              padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "20px"
            }}>
              <div>
                <div style={{ fontSize: "12px", color: "#a7f3d0", fontWeight: 600 }}>NET AMOUNT PAYABLE</div>
                <div style={{ fontSize: "11px", color: "#6ee7b7", marginTop: "2px" }}>
                  {formatDate(slip.start_date)} – {formatDate(slip.end_date)}
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
                {formatCurrency(slip.net_payable, currency)}
              </div>
            </div>

            {/* ── Notes ── */}
            {slip.notes && (
              <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#854d0e", textTransform: "uppercase", marginBottom: "4px" }}>Notes / Remarks</div>
                <div style={{ fontSize: "12px", color: "#78350f" }}>{slip.notes}</div>
              </div>
            )}

            {/* ── Signatures ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "28px" }}>
              {[
                { label: "Worker's Signature / Thumb Impression", name: slip.employee_name },
                { label: "Authorized HR / Manager Signature", name: org?.name || "Management" },
              ].map((sig, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px solid #94a3b8", marginBottom: "8px", height: "52px" }} />
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{sig.label}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>{sig.name}</div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div style={{
              marginTop: "20px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px",
              textAlign: "center", fontSize: "10px", color: "#94a3b8"
            }}>
              This is a computer generated wage payment slip. • {org?.name || "Organisation"}
              {org?.email ? ` • ${org.email}` : ""}
              {org?.phone ? ` • ${org.phone}` : ""}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? "Generating PDF..." : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

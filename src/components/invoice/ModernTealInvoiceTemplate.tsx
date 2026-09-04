import React, { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { numberToWords } from "@/lib/number-to-words";
import { format, parseISO } from "date-fns";

export interface InvoiceTemplateProps {
  org: any;
  invoice: any;
  lines: any[];
  fmt: (n: number) => string;
  type?: "invoice" | "estimate" | "bill" | "po";
  taxBreakdown?: { name: string; amount: number; rate?: number }[];
  isInterstate?: boolean;
}

function formatAmountInWords(num: number): string {
  const rounded = Math.round(num * 100) / 100;
  const integerPart = Math.floor(Math.abs(rounded));
  const decimalPart = Math.round((Math.abs(rounded) - integerPart) * 100);
  let words = numberToWords(integerPart) + " Rupees";
  if (decimalPart > 0) {
    words += " and " + numberToWords(decimalPart) + " Paise";
  }
  return words + " Only";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch (e) {
    return dateStr;
  }
}

export function ModernTealInvoiceTemplate({
  org,
  invoice,
  lines,
  fmt,
  type = "invoice",
  taxBreakdown = [],
  isInterstate = false,
}: InvoiceTemplateProps) {
  const primary = "#0f766e";
  const accent = "#14b8a6";

  const billToName = invoice?.clients?.company_name || invoice?.clients?.display_name || "";
  const billToGst = invoice?.clients?.tax_number || "";
  const billToEmail = invoice?.clients?.email || "";
  const billToPhone = invoice?.clients?.phone || "";

  // Parse billing address
  const getAddressString = (addr: any) => {
    if (!addr) return "";
    if (typeof addr === "string") return addr;
    const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
    return parts.join(", ");
  };
  const billToAddress = getAddressString(invoice?.clients?.billing_address);
  
  // Parse shipping address
  let shipToName = billToName;
  let shipToAddress = billToAddress;
  let shipToContact = billToPhone;
  const sAddr = invoice?.shipping_address || invoice?.clients?.shipping_address;
  if (sAddr) {
    const s = typeof sAddr === "string" ? JSON.parse(sAddr) : sAddr;
    shipToName = s?.name || billToName;
    shipToAddress = getAddressString(s);
    shipToContact = s?.contact || billToPhone;
  }

  const customFields = org?.custom_fields || [];

  const getTitleText = () => {
    if (type === "estimate") return "ESTIMATE";
    if (type === "po") return "PURCHASE ORDER";
    if (type === "bill") return "BILL";
    return "TAX INVOICE";
  };

  const hasIGST = isInterstate;
  const totalTax = taxBreakdown.reduce((sum, t) => sum + t.amount, 0);

  const poNumber = invoice?.po_number || invoice?.reference_number;
  const ewayBill = invoice?.eway_bill_no;
  const vehicleNo = invoice?.vehicle_number || invoice?.eway_vehicle_no;

  const invoiceBank = invoice?.bank_details || null;
  const upiId = invoiceBank?.bank_upi_id || org?.upi_id || org?.upi_number || "";
  const upiName = org?.name || org?.company_name || org?.business_name || "Merchant";
  const showBankDetails = invoice?.metadata?.show_bank_details !== false;
  const showTerms = invoice?.metadata?.show_terms !== false;
  const showNotes = invoice?.metadata?.show_notes !== false;
  
  const upiString = upiId ? "upi://pay?pa=" + upiId + "&pn=" + encodeURIComponent(upiName) + "&am=" + (invoice?.total || 0) + "&cu=INR" : "";

  return (
    <div className="w-full h-full bg-white text-black p-8 font-sans" style={{ fontSize: "11px", color: "#333" }}>
      {/* HEADER SECTION */}
      
      <div className="flex justify-between items-start mb-6">
        <div className="w-1/2">
          <div className="inline-block px-4 py-2 text-white font-bold text-lg mb-4 rounded-r-lg" style={{backgroundColor: primary}}>
            {getTitleText()}
          </div>
          <div className="flex items-center mt-2">
            {org?.logo_url && <img src={org.logo_url} className="h-16 object-contain mr-4" alt="Logo" />}
            <div>
              <h2 className="text-xl font-bold" style={{color: primary}}>{org?.name || org?.business_name}</h2>
              <p className="whitespace-pre-wrap">{org?.address?.street || ""}</p>
              <p>{[org?.address?.city, org?.address?.state, org?.address?.zip].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            {org?.gst_number && <p><strong>GSTIN:</strong> {org.gst_number}</p>}
            {org?.email && <p><strong>Email:</strong> {org.email}</p>}
            {org?.phone && <p><strong>Mobile:</strong> {org.phone}</p>}
          </div>
        </div>
        
        <div className="w-1/2 flex justify-end">
          <div className="grid grid-cols-3 gap-3 border rounded-xl p-3 border-gray-200 bg-gray-50">
             <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
               <p className="text-[9px] text-gray-500 font-bold uppercase">Invoice No.</p>
               <p className="font-bold">{invoice?.invoice_number}</p>
             </div>
             <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
               <p className="text-[9px] text-gray-500 font-bold uppercase">Invoice Date</p>
               <p className="font-bold">{formatDate(invoice?.issue_date)}</p>
             </div>
             <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
               <p className="text-[9px] text-gray-500 font-bold uppercase">Due Date</p>
               <p className="font-bold">{formatDate(invoice?.due_date)}</p>
             </div>
             
             {poNumber && (
               <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                 <p className="text-[9px] text-gray-500 font-bold uppercase">P.O. No.</p>
                 <p className="font-bold">{poNumber}</p>
               </div>
             )}
             {ewayBill && (
               <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                 <p className="text-[9px] text-gray-500 font-bold uppercase">E-Way Bill No.</p>
                 <p className="font-bold">{ewayBill}</p>
               </div>
             )}
             {vehicleNo && (
               <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                 <p className="text-[9px] text-gray-500 font-bold uppercase">Vehicle No.</p>
                 <p className="font-bold">{vehicleNo}</p>
               </div>
             )}
             
             {customFields.slice(0, 3).map((cf: any, idx: number) => (
               <div key={idx} className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                 <p className="text-[9px] text-gray-500 font-bold uppercase">{cf.name}</p>
                 <p className="font-bold">{cf.value}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
      

      {/* BILL TO / SHIP TO */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="text-white font-bold px-3 py-1 text-xs" style={{backgroundColor: primary}}>BILL TO</div>
          <div className="p-3">
            <h3 className="font-bold text-sm mb-1">{billToName}</h3>
            <p className="whitespace-pre-wrap leading-relaxed">{billToAddress}</p>
            {billToGst && <p className="mt-2"><strong>GSTIN:</strong> {billToGst}</p>}
            <p className="mt-1">
              {billToEmail && <span><strong>Email:</strong> {billToEmail}  </span>}
              {billToPhone && <span><strong>Mobile:</strong> {billToPhone}</span>}
            </p>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="text-white font-bold px-3 py-1 text-xs" style={{backgroundColor: primary}}>SHIP TO</div>
          <div className="p-3">
            <h3 className="font-bold text-sm mb-1">{shipToName}</h3>
            <p className="whitespace-pre-wrap leading-relaxed">{shipToAddress}</p>
            {billToGst && <p className="mt-2"><strong>GSTIN:</strong> {billToGst}</p>}
            <p className="mt-1">
              {shipToContact && <span><strong>Contact:</strong> {shipToContact}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="w-full mb-4 rounded-xl overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white text-[10px]" style={{backgroundColor: primary}}>
              <th className="py-2 px-2 text-center w-8">S.No.</th>
              <th className="py-2 px-2">Description of Goods / Services</th>
              <th className="py-2 px-2 text-center">HSN / SAC</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-center">Unit</th>
              <th className="py-2 px-2 text-right">Rate (₹)</th>
              <th className="py-2 px-2 text-right">Taxable (₹)</th>
              <th className="py-2 px-2 text-center">GST %</th>
              <th className="py-2 px-2 text-right">GST (₹)</th>
              <th className="py-2 px-2 text-right" style={{backgroundColor: accent}}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2 px-2 text-center border-r border-gray-200">{idx + 1}</td>
                <td className="py-2 px-2 border-r border-gray-200">
                  {line.name ? (
                    <>
                      <div className="font-semibold text-[11px]">{line.name}</div>
                      {line.description && <div className="text-[9px] text-gray-500 mt-0.5 whitespace-pre-wrap opacity-75">{line.description}</div>}
                    </>
                  ) : (
                    <div className="font-semibold text-[11px] whitespace-pre-wrap">{line.description}</div>
                  )}
                </td>
                <td className="py-2 px-2 text-center border-r border-gray-200">{line.item?.hsn_code || ""}</td>
                <td className="py-2 px-2 text-center border-r border-gray-200">{line.quantity}</td>
                <td className="py-2 px-2 text-center border-r border-gray-200">{line.item?.unit || "PCS"}</td>
                <td className="py-2 px-2 text-right border-r border-gray-200">{fmt(line.rate).replace('₹', '')}</td>
                <td className="py-2 px-2 text-right border-r border-gray-200">{fmt((line.amount || 0) - (line.tax_amount || 0)).replace('₹', '')}</td>
                <td className="py-2 px-2 text-center border-r border-gray-200">
                  {line.tax_rate ? `${line.tax_rate.rate}%` : `${(line.amount && line.tax_amount) ? Math.round((line.tax_amount / ((line.amount || 0) - line.tax_amount)) * 100) : 0}%`}
                </td>
                <td className="py-2 px-2 text-right border-r border-gray-200">
                  {fmt(line.tax_amount || 0).replace('₹', '')}
                </td>
                <td className="py-2 px-2 text-right font-bold" style={{color: primary}}>
                  {fmt(line.amount || 0).replace('₹', '')}
                </td>
              </tr>
            ))}
            {/* Blank row for spacing */}
            <tr className="border-b border-gray-200">
               <td colSpan={10} className="py-6 border-r border-gray-200"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER GRID */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* LEFT COLUMN */}
        <div>
           {/* BANK DETAILS */}
           {showBankDetails && <div className="border mb-4 border-gray-200 rounded-xl overflow-hidden">
             <div className="text-white font-bold px-3 py-1 text-xs" style={{backgroundColor: primary}}>BANK DETAILS</div>
             <div className="p-3 grid grid-cols-[130px_1fr] gap-1 text-[10px]">
               <div className="font-semibold">Bank Name :</div><div>{org?.bank_name || ""}</div>
               <div className="font-semibold">A/C Holder Name :</div><div>{org?.bank_account_name || ""}</div>
               <div className="font-semibold">Account Number :</div><div>{org?.bank_account_number || ""}</div>
               <div className="font-semibold">IFSC Code :</div><div>{org?.bank_ifsc || ""}</div>
               <div className="font-semibold">Branch :</div><div>{org?.bank_branch || ""}</div>
             </div>
           </div>}

           {/* UPI DETAILS */}
           {upiId && (
             <div className="border mb-4 border-gray-200 rounded-xl overflow-hidden">
               <div className="text-white font-bold px-3 py-1 text-xs" style={{backgroundColor: primary}}>UPI DETAILS</div>
               <div className="p-3 grid grid-cols-[130px_1fr] gap-1 text-[10px]">
                 <div className="font-semibold">UPI ID :</div><div>{upiId}</div>
               </div>
             </div>
           )}

           {/* TERMS */}
           {showTerms && <div className="border mb-4 border-gray-200 rounded-xl overflow-hidden">
             <div className="text-white font-bold px-3 py-1 text-xs" style={{backgroundColor: primary}}>TERMS & CONDITIONS</div>
             <div className="p-3 text-[9px] whitespace-pre-wrap">
               {invoice?.terms_conditions || org?.default_terms || "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed."}
             </div>
           </div>}
           
           {/* NOTES */}
           {showNotes && invoice?.notes && (
             <div className="border mb-4 border-gray-200 rounded-xl overflow-hidden">
               <div className="text-white font-bold px-3 py-1 text-xs" style={{backgroundColor: primary}}>NOTES</div>
               <div className="p-3 text-[9px] whitespace-pre-wrap">
                 {invoice.notes}
               </div>
             </div>
           )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
           {/* TOTALS */}
           <div className="border mb-4 border-gray-200 rounded-xl overflow-hidden">
             <table className="w-full text-[11px]">
               <tbody>
                 <tr className="border-b border-gray-200">
                   <td className="p-2 font-bold w-1/2">Total Value</td>
                   <td className="p-2 text-right border-l border-gray-200">{fmt(invoice?.subtotal || 0)}</td>
                 </tr>
                 
                 {taxBreakdown && taxBreakdown.length > 0 ? (
                     taxBreakdown.map((tax, i) => (
                       <tr key={i} className="border-b border-gray-200">
                         <td className="p-2 font-bold w-1/2">{tax.name}</td>
                         <td className="p-2 text-right border-l border-gray-200">{fmt(tax.amount)}</td>
                       </tr>
                     ))
                   ) : (
                     <tr className="border-b border-gray-200">
                       <td className="p-2 font-bold w-1/2">Total Tax</td>
                       <td className="p-2 text-right border-l border-gray-200">{fmt(totalTax)}</td>
                     </tr>
                   )}
                 
                 {invoice?.discount > 0 && (
                   <tr className="border-b border-gray-200">
                     <td className="p-2 font-bold w-1/2">Discount</td>
                     <td className="p-2 text-right border-l border-gray-200 text-red-600">- {fmt(invoice?.discount)}</td>
                   </tr>
                 )}
                 
                 <tr className="text-white text-sm" style={{backgroundColor: primary}}>
                   <td className="p-3 font-bold uppercase tracking-wider">GRAND TOTAL</td>
                   <td className="p-3 text-right font-bold text-lg" style={{backgroundColor: accent}}>{fmt(invoice?.total || 0)}</td>
                 </tr>
               </tbody>
             </table>
           </div>

           <div className="mb-4">
             <div className="font-semibold text-gray-500 mb-1">Total In Words:</div>
             <div className="font-bold italic text-[10px]">{formatAmountInWords(invoice?.total || 0)}</div>
           </div>

           <div className="flex justify-between items-end mt-12">
              {upiString ? (
                <div className="border border-gray-300 p-2 rounded text-center flex flex-col items-center">
                  <QRCodeSVG value={upiString} size={80} />
                  <span className="text-[9px] font-bold mt-1">Scan & Pay</span>
                </div>
              ) : <div></div>}
              
              <div className="text-center">
                 <div className="border-b border-gray-400 w-40 mb-2"></div>
                 <div className="font-bold text-[10px]">Authorized Signature</div>
              </div>
           </div>
        </div>

      </div>

      <div className="mt-8 text-center text-[10px] flex justify-center items-center gap-1 font-semibold border-t border-gray-200 pt-4">
         Powered by <img src="/logo.png" alt="AassayBiz" style={{ height: "16px", objectFit: "contain", display: "inline-block", marginLeft: "4px" }} />
      </div>
    </div>
  );
}


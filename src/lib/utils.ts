import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSequenceNumber(formatTemplate: string | null | undefined, nextNumber: number, defaultPrefix: string = "INV"): string {
  if (!formatTemplate) return `${defaultPrefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`;
  
  // If template doesn't contain '{', treat it as a traditional prefix
  if (!formatTemplate.includes("{")) {
    return `${formatTemplate}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`;
  }

  const year = new Date().getFullYear();
  let formatted = formatTemplate;
  
  formatted = formatted.replace(/{YYYY}/g, year.toString());
  formatted = formatted.replace(/{YY}/g, year.toString().slice(-2));
  
  // Replace {NNNN}, {NNN}, {NN}, {N}
  if (formatted.includes("{NNNN}")) {
    formatted = formatted.replace(/{NNNN}/g, String(nextNumber).padStart(4, "0"));
  } else if (formatted.includes("{NNN}")) {
    formatted = formatted.replace(/{NNN}/g, String(nextNumber).padStart(3, "0"));
  } else if (formatted.includes("{NN}")) {
    formatted = formatted.replace(/{NN}/g, String(nextNumber).padStart(2, "0"));
  } else if (formatted.includes("{N}")) {
    formatted = formatted.replace(/{N}/g, String(nextNumber));
  } else {
    // If user provides a template with {YYYY} but no number placeholder, append the number gracefully
    formatted = `${formatted}-${String(nextNumber).padStart(4, "0")}`;
  }
  
  return formatted;
}

export function safeFormatTime(timeVal: any, fallback = "-"): string {
  if (!timeVal) return fallback;
  try {
    const str = String(timeVal).trim();
    if (!str || str === "null" || str === "undefined") return fallback;

    // Already 12-hour format like "09:30 AM", "9:30 AM", "12:00 PM"
    if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i.test(str)) {
      return str.toUpperCase();
    }

    // 24-hour time like "09:30" or "09:30:00"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
      const parts = str.split(":");
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
    }

    // ISO or Date string
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
    }

    return str;
  } catch {
    return fallback;
  }
}

export function toHHmm(timeVal: any, fallback = "09:00"): string {
  if (!timeVal) return fallback;
  try {
    const str = String(timeVal).trim();
    if (!str || str === "null" || str === "undefined") return fallback;
    const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const ampm = match[3]?.toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${m}`;
    }
    const d = new Date(timeVal);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function safeFormatDate(dateVal: any, formatPattern: string = "yyyy-MM-dd", fallback = "-"): string {
  if (!dateVal) return fallback;
  try {
    const str = String(dateVal).trim();
    if (!str || str === "null" || str === "undefined") return fallback;

    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, day] = str.split("-").map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(str);
    }

    if (isNaN(d.getTime())) return fallback;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const yyyy = d.getFullYear().toString();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dNum = d.getDate().toString();
    const EEE = days[d.getDay()];
    const EEEE = fullDays[d.getDay()];
    const MMM = months[d.getMonth()];
    const MMMM = fullMonths[d.getMonth()];

    let h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = String(h % 12 || 12).padStart(2, "0");
    const HH = String(h).padStart(2, "0");

    let res = formatPattern;
    res = res.replace(/yyyy/g, yyyy);
    res = res.replace(/MMMM/g, MMMM);
    res = res.replace(/MMM/g, MMM);
    res = res.replace(/MM/g, MM);
    res = res.replace(/EEEE/g, EEEE);
    res = res.replace(/EEE/g, EEE);
    res = res.replace(/dd/g, dd);
    res = res.replace(/\bd\b/g, dNum);
    res = res.replace(/HH/g, HH);
    res = res.replace(/hh/g, hh);
    res = res.replace(/mm/g, min);
    res = res.replace(/a/g, ampm);
    return res;
  } catch {
    return fallback;
  }
}

/**
 * Checks whether a payment record is an advance adjustment (settlement from existing advance credit)
 * rather than fresh money received. Advance adjustments should NOT be added to Total Received.
 */
export function isAdvanceAdjustmentPayment(p: any): boolean {
  if (!p) return false;
  if (p.payment_mode === "advance_credit") return true;
  if (typeof p.notes === "string" && p.notes.toLowerCase().startsWith("adjusted from advance")) return true;
  return false;
}

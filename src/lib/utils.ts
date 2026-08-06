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

import React, { ReactNode } from "react";

interface AutoFitNumberProps {
  value: ReactNode;
  className?: string;
  maxSize?: "xl" | "2xl" | "3xl";
}

/**
 * Returns tailored Tailwind font size classes based on string length.
 * As number grows longer (e.g. ₹33,49,238.00), font size scales down gracefully
 * so it never overflows or clips on any screen or laptop width.
 */
export function getAutoFitSize(value: any, maxSize: "xl" | "2xl" | "3xl" = "2xl"): string {
  const str = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  const len = str.length;

  if (len >= 14) {
    // e.g. ₹1,23,45,678.00 or longer
    return "text-xs sm:text-sm md:text-base lg:text-lg";
  }
  if (len >= 11) {
    // e.g. ₹28,91,929.00
    return "text-sm sm:text-base md:text-lg lg:text-xl";
  }
  if (len >= 8) {
    // e.g. ₹4,57,309
    return "text-base sm:text-lg md:text-xl lg:text-2xl";
  }
  
  // Short numbers like ₹0, ₹100, 12 Leads
  if (maxSize === "3xl") {
    return "text-xl sm:text-2xl md:text-3xl";
  }
  if (maxSize === "xl") {
    return "text-base sm:text-lg md:text-xl";
  }
  return "text-lg sm:text-xl md:text-2xl";
}

export function AutoFitNumber({ value, className = "", maxSize = "2xl" }: AutoFitNumberProps) {
  const str = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  const sizeClass = getAutoFitSize(str, maxSize);

  return (
    <span
      className={`font-bold tabular-nums tracking-tight truncate block w-full leading-tight ${sizeClass} ${className}`}
      title={str || undefined}
    >
      {value}
    </span>
  );
}

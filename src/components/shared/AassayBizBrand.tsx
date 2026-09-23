import React from "react";

interface AassayBizBrandProps {
  className?: string;
  theme?: "light" | "dark";
  suffix?: string;
}

export function AassayBizBrand({ className = "", theme = "light", suffix }: AassayBizBrandProps) {
  const assayColor = theme === "dark" ? "text-blue-300" : "text-[#28166f]";

  return (
    <span className={`inline-flex items-baseline font-bold tracking-tight whitespace-nowrap ${className}`}>
      <span className="text-[#e77817]">A</span>
      <span className={assayColor}>assay</span>
      <span>&nbsp;</span>
      <span className="text-[#e77817]">Biz</span>
      {suffix && <span className="ml-1 font-normal text-inherit">{suffix}</span>}
    </span>
  );
}

export default AassayBizBrand;

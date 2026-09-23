import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, FileText, RefreshCw, ArrowLeft } from "lucide-react";

export function LegalNavTabs() {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    {
      label: "Privacy Policy",
      href: "/privacy",
      aliases: ["/privacy", "/privacy-policy"],
      icon: ShieldCheck,
    },
    {
      label: "Terms of Service",
      href: "/terms",
      aliases: ["/terms", "/terms-of-service", "/terms-conditions"],
      icon: FileText,
    },
    {
      label: "Cancellation & Refund Policy",
      href: "/refund-policy",
      aliases: ["/refund", "/refund-policy", "/cancellation-refund", "/cancellation-policy"],
      icon: RefreshCw,
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#e77817] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          Official Legal Documentation
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
        {tabs.map((tab) => {
          const isActive = tab.aliases.includes(currentPath);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                isActive
                  ? "bg-white text-[#e77817] shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#e77817]" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Layers } from "lucide-react";
import logoImg from "@/assets/logo.png";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border border-white/20">
            <img src={`${logoImg}?v=${Date.now()}`} alt="Assay Biz" className="h-7 w-auto object-contain" />
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          {/* Will add partner-with-us link later as requested */}
          <a href="/#features" className="hover:text-primary transition-colors">Features</a>
          <a href="/#compare" className="hover:text-primary transition-colors">Compare</a>
          <a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <Link to="/brochure" className="hover:text-primary transition-colors flex items-center gap-1.5 text-indigo-300">
            <FileText className="w-4 h-4 text-indigo-400" /> Brochure
          </Link>
          <Link to="/pamphlet" className="hover:text-primary transition-colors flex items-center gap-1.5 text-indigo-300">
            <Layers className="w-4 h-4 text-indigo-400" /> Pamphlet
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 hidden sm:flex font-medium" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 rounded-full px-6" asChild>
            <a href="/#pricing">View Plans</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

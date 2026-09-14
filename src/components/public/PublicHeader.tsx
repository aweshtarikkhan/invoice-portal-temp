import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Layers } from "lucide-react";
import logoImg from "@/assets/logo.png";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={`${logoImg}?v=${Date.now()}`} alt="Assay Biz" className="h-8 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="/#features" className="hover:text-primary transition-colors">Features</a>
          <a href="/#compare" className="hover:text-primary transition-colors">Compare</a>
          <a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <Link to="/brochure" className="hover:text-primary transition-colors flex items-center gap-1.5 text-indigo-600">
            <FileText className="w-4 h-4 text-indigo-500" /> Brochure
          </Link>
          <Link to="/pamphlet" className="hover:text-primary transition-colors flex items-center gap-1.5 text-indigo-600">
            <Layers className="w-4 h-4 text-indigo-500" /> Pamphlet
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-700 hover:text-primary hover:bg-slate-100 hidden sm:flex font-semibold" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-full px-6" asChild>
            <a href="/#pricing">View Plans</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

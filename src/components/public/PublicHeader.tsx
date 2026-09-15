import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={`${logoImg}?v=${Date.now()}`} alt="Assay Biz" className="h-6 sm:h-8 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <a href="/#features" className="hover:text-primary transition-colors">Features</a>
          <a href="/#compare" className="hover:text-primary transition-colors">Compare</a>
          <a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <Link to="/partner-with-us" className="hover:text-primary transition-colors">Partner With Us</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Button variant="ghost" className="text-slate-700 hover:text-primary hover:bg-slate-100 font-semibold px-2 sm:px-4 text-xs sm:text-sm h-9 sm:h-10" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-full px-4 sm:px-6 text-xs sm:text-sm h-9 sm:h-10" asChild>
            <a href="/#pricing">View Plans</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

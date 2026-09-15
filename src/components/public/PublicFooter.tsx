import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { usePlatformSocials, formatSocialUrl } from "@/hooks/use-platform-socials";
import { Phone, Mail, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, MapPin, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";

export function PublicFooter() {
  const { data: socials } = usePlatformSocials();
  const phone = (socials?.phone ? socials.phone.replace(/[^0-9]/g, "") : "") || "919424825919";
  const formattedPhone = socials?.phone || "+91 94248 25919";

  return (
    <>
      <footer className="relative bg-[#160e3d] text-slate-300 pt-16 pb-12 overflow-hidden border-t border-white/10">
        {/* Subtle background ambient glows matching logo colors */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#28166f]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-[#e77817]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          
          {/* Top Banner Card: Modern Elevated CTA */}
          <div className="mb-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#211559] via-[#28166f] to-[#1c1248] border border-white/15 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-[#e77817]/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e77817]/20 border border-[#e77817]/40 text-[#ffaa47] text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#ff9438]" />
                <span>EXPERIENCE ASSAY BIZ TODAY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Ready to streamline your business operations?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Join 500+ growing Indian businesses. Invoicing, accounting, inventory, and staff management — all in one place.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#e77817] hover:bg-[#ff8a24] text-white font-bold text-sm shadow-lg shadow-[#e77817]/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Start Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="/#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-sm transition-all duration-300"
              >
                View Pricing & Plans
              </a>
            </div>
          </div>

          {/* Main 4-Column Balanced Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-white/10">
            
            {/* Column 1: Brand, Tagline & Helpline (4 cols) */}
            <div className="lg:col-span-4 flex flex-col items-start">
              <Link to="/" className="inline-block p-2.5 px-3.5 bg-white rounded-xl shadow-md mb-5 hover:opacity-95 transition-opacity">
                <img src={logoImg} alt="Assay Biz" className="h-8 w-auto object-contain" />
              </Link>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-sm">
                India's smartest GST billing and business operating platform. We help shopkeepers, freelancers, and growing enterprises automate invoicing, stock, HRMS, and CRM.
              </p>



              {/* Social Channels */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Connect With Us
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={formatSocialUrl("facebook", socials?.facebook) || "https://www.facebook.com/assaybiz"}
                    target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#e77817] flex items-center justify-center border border-white/10 hover:border-transparent transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={formatSocialUrl("instagram", socials?.instagram) || "https://www.instagram.com/assaybiz"}
                    target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#e77817] flex items-center justify-center border border-white/10 hover:border-transparent transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={formatSocialUrl("youtube", socials?.youtube) || "https://www.youtube.com/@assaybiz"}
                    target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#e77817] flex items-center justify-center border border-white/10 hover:border-transparent transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Youtube className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={formatSocialUrl("linkedin", socials?.linkedin) || "https://www.linkedin.com/company/assaybiz"}
                    target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#e77817] flex items-center justify-center border border-white/10 hover:border-transparent transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Linkedin className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Platform Modules (3 cols) */}
            <div className="lg:col-span-3">
              <h3 className="font-bold text-white text-base tracking-wide mb-4">Core Modules</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">GST Invoicing & E-Way Bill</a></li>
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">Business Accounting & Ledger</a></li>
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">Multi-Warehouse Inventory</a></li>
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">Business HR & Staff Attendance</a></li>
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">Business CRM & Lead Pipeline</a></li>
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">Promotion & Festival Posters</a></li>
              </ul>
            </div>

            {/* Column 3: Quick Links & Collateral (2 cols) */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-white text-base tracking-wide mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li><Link to="/" className="hover:text-[#ff9438] transition-colors">Home</Link></li>
                <li><a href="/#features" className="hover:text-[#ff9438] transition-colors">Features</a></li>
                <li><a href="/#pricing" className="hover:text-[#ff9438] transition-colors">Pricing & Plans</a></li>
                <li><Link to="/brochure" className="hover:text-[#ff9438] transition-colors">Product Brochure (PDF)</Link></li>
                <li><Link to="/pamphlet" className="hover:text-[#ff9438] transition-colors">Marketing Pamphlet</Link></li>
                <li><Link to="/partner-with-us" className="hover:text-[#ff9438] transition-colors">Partner With Us</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal & Trust (3 cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base tracking-wide mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#ff9438]" />
                  <span>Contact Us</span>
                </h3>
                <ul className="space-y-3 text-sm mb-6">
                  <li>
                    <a href={`tel:${phone}`} className="flex items-start gap-3 text-slate-300 hover:text-[#ff9438] transition-colors">
                      <Phone className="w-4 h-4 mt-0.5 text-[#ff9438] shrink-0" />
                      <span>{formattedPhone}</span>
                    </a>
                  </li>
                  <li>
                    <a href="mailto:support@assaybiz.com" className="flex items-start gap-3 text-slate-300 hover:text-[#ff9438] transition-colors">
                      <Mail className="w-4 h-4 mt-0.5 text-[#ff9438] shrink-0" />
                      <span>support@assaybiz.com</span>
                    </a>
                  </li>
                  <li>
                    <div className="flex items-start gap-3 text-slate-300">
                      <MapPin className="w-4 h-4 mt-0.5 text-[#ff9438] shrink-0" />
                      <span>Bhopal, India</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Trust & Security Badge Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg leading-none">🇮🇳</span>
                  <div>
                    <div className="font-bold text-white">100% Made in India</div>
                    <div className="text-slate-400 text-[11px]">Crafted for Indian business & GST compliance</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">Bank-Grade 256-bit SSL</div>
                    <div className="text-slate-400 text-[11px]">End-to-end encrypted daily backups</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#ff9438] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">Priority Phone Support</div>
                    <div className="text-slate-400 text-[11px]">Mon - Sat: 9:30 AM - 7:00 PM IST</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Legal Links Bar */}
          <div className="pt-8 flex flex-col xl:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
            <p className="text-slate-400 text-center xl:text-left md:whitespace-nowrap">
              &copy; {new Date().getFullYear()} Aassay Biz, All Rights Reserved Emerging Thoughts Pvt. Ltd. (CIN - U73200MP2025PTC074472)
            </p>
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-2 sm:gap-2.5 pr-0 lg:pr-20">
              <Link 
                to="/privacy" 
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-[#e77817]/50 text-xs font-medium transition-all whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-[#e77817]/50 text-xs font-medium transition-all whitespace-nowrap"
              >
                Terms of Service
              </Link>
              <Link 
                to="/refund-policy" 
                className="px-3 py-1.5 rounded-lg bg-[#e77817]/15 hover:bg-[#e77817]/30 text-[#ffaa47] hover:text-white border border-[#e77817]/40 text-xs font-semibold transition-all shadow-sm whitespace-nowrap"
              >
                Cancellation & Refund Policy
              </Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <aside aria-label="Support WhatsApp" className="fixed bottom-6 right-6 z-50 flex items-center group">
        <span className="hidden sm:inline-block mr-3 px-3.5 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          Chat on WhatsApp
        </span>
        <a
          href={`https://wa.me/${phone}?text=Hello%20Assay%20Biz,%20I%20would%20like%20to%20know%20more%20about%20your%20software.`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact support on WhatsApp"
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-all duration-300"
        >
          {/* Active online pulse indicator */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </aside>
    </>
  );
}

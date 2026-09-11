import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { usePlatformSocials, formatSocialUrl } from "@/hooks/use-platform-socials";

export function PublicFooter() {
  const { data: socials } = usePlatformSocials();

  return (
    <>
      <footer className="bg-[#f5f5f7] border-t border-slate-200/80 pt-16 pb-8 text-slate-600">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-14">
            {/* Column 1: Brand & Social */}
            <div className="lg:col-span-4 flex flex-col items-start">
              <Link to="/" className="inline-block mb-4">
                <img src={logoImg} alt="Assay Biz" className="h-10 w-auto object-contain" />
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
                Your trusted GST billing and business operating partner. We help Indian businesses streamline invoicing, inventory, payroll, and accounting.
              </p>
              <div className="flex items-center gap-2.5">
                <a
                  href={formatSocialUrl("youtube", socials?.youtube) || "https://www.youtube.com/@assaybiz"}
                  target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className="inline-flex items-center justify-center transition-transform hover:scale-110"
                >
                  <img src="/assets/images/icons/youtube.png" alt="YouTube" className="w-7 h-7 object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                </a>
                <a
                  href={formatSocialUrl("facebook", socials?.facebook) || "https://www.facebook.com/assaybiz"}
                  target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="inline-flex items-center justify-center transition-transform hover:scale-110"
                >
                  <img src="/assets/images/icons/facebook.png" alt="Facebook" className="w-7 h-7 object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                </a>
                <a
                  href={formatSocialUrl("instagram", socials?.instagram) || "https://www.instagram.com/assaybiz"}
                  target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="inline-flex items-center justify-center transition-transform hover:scale-110"
                >
                  <img src="/assets/images/icons/instagram.png" alt="Instagram" className="w-7 h-7 object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="/#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><Link to="/brochure" className="hover:text-primary transition-colors">Brochure</Link></li>
                <li><Link to="/pamphlet" className="hover:text-primary transition-colors">Pamphlet</Link></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="lg:col-span-3">
              <h3 className="font-semibold text-slate-900 mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community Forum</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">GST Guide</a></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div className="lg:col-span-3">
              <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Assay Biz. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Made with ❤️ in India for the World</span>
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
          href={`https://wa.me/${(socials?.phone ? socials.phone.replace(/[^0-9]/g, "") : "") || "919424825919"}?text=Hello%20Assay%20Biz,%20I%20would%20like%20to%20know%20more%20about%20your%20software.`}
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

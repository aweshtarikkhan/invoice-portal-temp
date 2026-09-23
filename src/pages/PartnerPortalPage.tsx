import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Handshake, TrendingUp, Shield } from "lucide-react";
import logo from "@/assets/logo.png";

export default function PartnerPortalPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <span className="text-indigo-600 text-sm font-medium border border-indigo-200 bg-indigo-50 rounded-full px-3 py-0.5">
            Partner Portal
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-full px-4 py-2">
          <Handshake className="h-4 w-4 text-indigo-500" />
          Reseller Partner Program
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Grow Together,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Earn Together
          </span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mb-12">
          Join our partner network, resell accounts to your clients, and manage everything from your dedicated partner dashboard.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button
            size="lg"
            onClick={() => navigate("/partner-login")}
            className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold px-8 h-12 text-base shadow-md shadow-indigo-200 w-full sm:w-auto"
          >
            Partner Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/partner-register")}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold px-8 h-12 text-base w-full sm:w-auto"
          >
            Partner Sign Up
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            {
              icon: <Users className="h-6 w-6 text-indigo-500" />,
              title: "Manage Accounts",
              desc: "Assign and track user accounts for your clients with ease.",
              bg: "bg-indigo-50",
            },
            {
              icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
              title: "Coupon Control",
              desc: "Create discount coupons and manage limits intelligently.",
              bg: "bg-purple-50",
            },
            {
              icon: <Shield className="h-6 w-6 text-blue-500" />,
              title: "Secure Portal",
              desc: "Your dedicated space, completely separate from client accounts.",
              bg: "bg-blue-50",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className={`${f.bg} rounded-xl p-2.5 w-fit mb-3`}>{f.icon}</div>
              <h3 className="text-slate-800 font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-100">
        Partner portal is exclusively for registered resellers.
      </footer>
    </div>
  );
}

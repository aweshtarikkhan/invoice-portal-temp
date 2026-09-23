import { useEffect } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LegalNavTabs } from "@/components/public/LegalNavTabs";
import { ShieldCheck } from "lucide-react";
import { SEO } from "@/components/shared/SEO";
import { AassayBizBrand } from "@/components/shared/AassayBizBrand";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <SEO 
        title="Privacy Policy | Aassay Biz" 
        description="Learn how Aassay Biz protects your data, business records, and privacy in compliance with Indian Information Technology regulations."
      />
      <PublicHeader />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-12">
          <LegalNavTabs />
          
          <div className="border-b border-slate-200 pb-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-sm text-slate-500">
              Last Updated: September 14, 2026 • Effective Immediately
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Introduction
              </h2>
              <p>
                Welcome to <AassayBizBrand /> ("we," "our," or "us"). We are committed to protecting the privacy, confidentiality, and security of your personal and business financial data. This Privacy Policy explains how we collect, use, process, and disclose information when you access our cloud ERP billing software, attendance portal, and CRM services via our websites and applications.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account & Profile Information:</strong> Full name, business trade name, GSTIN, PAN, email address, mobile number, business address, and authentication credentials.
                </li>
                <li>
                  <strong>Transactional & Business Records:</strong> GST invoices, client contact lists, product inventory data, vendor bills, bank account information for billing headers, purchase orders, and payment records entered by you.
                </li>
                <li>
                  <strong>Staff & Attendance Data:</strong> Employee names, contact details, attendance punch records, leave requests, shift schedules, and salary slips.
                </li>
                <li>
                  <strong>Technical & Device Data:</strong> IP address, device specifications, browser type, operating system, log files, and interaction metrics to diagnose server issues and prevent unauthorized logins.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. How We Use Your Data
              </h2>
              <p className="mb-2">Your information is used strictly to deliver and enhance our services, including:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Generating GST-compliant invoices, challans, estimates, and financial reports.</li>
                <li>Dispatching invoices and payment notifications via WhatsApp or Email on your behalf.</li>
                <li>Providing payroll calculations, attendance tracking, and leave management.</li>
                <li>Ensuring security, detecting fraudulent activity, and verifying account authenticity.</li>
                <li>Complying with applicable Indian taxation laws and accounting regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Data Ownership & Confidentiality
              </h2>
              <p>
                <strong>You retain 100% ownership of your business data.</strong> We never sell, rent, or trade your clients' contact information, billing history, or financial records to any third-party marketing companies or advertisers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Data Security & Storage
              </h2>
              <p>
                We use enterprise-grade cloud infrastructure hosted on Amazon Web Services (AWS) with SSL/TLS 256-bit encryption in transit and AES-256 encryption at rest. Daily database backups, strict Row Level Security (RLS), and multi-tenant isolation protocols are enforced to safeguard your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Third-Party Service Providers
              </h2>
              <p>
                We collaborate with reputable providers solely to execute core functionalities:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>AWS SES (Amazon Web Services) for transactional email routing.</li>
                <li>Official WhatsApp Cloud / Meta API for invoice sharing and instant alerts.</li>
                <li>Encrypted cloud storage for receipt attachments and business logos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                7. Contact Us
              </h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our grievance desk:
              </p>
              <div className="mt-3 p-4 bg-slate-100 rounded-xl space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5"><AassayBizBrand /> Support &amp; Grievance Desk</p>
                <p>Email: <a href="mailto:support@aassaybiz.com" className="text-primary hover:underline">support@aassaybiz.com</a></p>
                <p>Phone / WhatsApp: +91 7806025875</p>
                <p>Location: Madhya Pradesh, India</p>
              </div>
            </section>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

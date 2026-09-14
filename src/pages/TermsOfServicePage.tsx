import { useEffect } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FileCheck } from "lucide-react";
import { SEO } from "@/components/shared/SEO";

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <SEO 
        title="Terms of Service | Assay Biz" 
        description="Review the terms, conditions, and user agreements governing the use of Assay Biz billing and business platform."
      />
      <PublicHeader />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-12">
          
          <div className="border-b border-slate-200 pb-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <FileCheck className="w-6 h-6" />
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            </div>
            <p className="text-sm text-slate-500">
              Last Updated: September 14, 2026 • Governed by the Laws of India
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By signing up, accessing, or using <strong>Assay Biz</strong> ("Platform"), you agree to be bound by these Terms of Service. If you are using the platform on behalf of a company or registered legal entity, you represent that you have the authority to bind such entity to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Account Responsibilities
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree to provide accurate, up-to-date business details, including legal trade name and GST identification number (GSTIN) if applicable.</li>
                <li>You must immediately notify Assay Biz of any unauthorized use or security breach of your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Acceptable Use Policy
              </h2>
              <p className="mb-2">You agree NOT to use Assay Biz for:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Generating fraudulent or fake GST invoices in violation of the Goods and Services Tax Act.</li>
                <li>Transmitting unsolicited spam broadcasts or unauthorized marketing messages via WhatsApp or Email.</li>
                <li>Attempting to reverse-engineer, exploit vulnerabilities, or breach our server security.</li>
                <li>Hosting or distributing unlawful, harassing, defamatory, or harmful content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Subscription & Billing
              </h2>
              <p>
                Assay Biz offers free tiers and paid modular subscription plans (such as Sales & Inventory, Business Suite, Business HR, and CRM). Subscription fees are billed on a recurring monthly or annual basis as specified during checkout. Subscriptions renew automatically unless cancelled prior to the renewal date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Intellectual Property
              </h2>
              <p>
                All software, user interface designs, trademarks, brand logos, codebases, and platform documentation are the exclusive property of Assay Biz. You are granted a non-exclusive, non-transferable license to use the service for your internal business operations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Limitation of Liability
              </h2>
              <p>
                Assay Biz provides the software on an "as is" and "as available" basis. While we maintain a 99.9% uptime standard, we are not liable for any indirect, incidental, or consequential damages resulting from third-party network outages, taxation filing deadlines missed by user negligence, or Internet connectivity failures.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                7. Dispute Resolution & Governing Law
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Madhya Pradesh, India.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                8. Contact Information
              </h2>
              <p>
                For legal inquiries or questions regarding these terms, please contact:
              </p>
              <div className="mt-3 p-4 bg-slate-100 rounded-xl space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900">Assay Biz Legal Department</p>
                <p>Email: <a href="mailto:support@assaybiz.com" className="text-primary hover:underline">support@assaybiz.com</a></p>
                <p>Phone: +91 94248 25919</p>
              </div>
            </section>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

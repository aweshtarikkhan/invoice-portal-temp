import { useEffect } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LegalNavTabs } from "@/components/public/LegalNavTabs";
import { RefreshCw } from "lucide-react";
import { SEO } from "@/components/shared/SEO";
import { AassayBizBrand } from "@/components/shared/AassayBizBrand";

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <SEO 
        title="Cancellation & Refund Policy | Aassay Biz" 
        description="Understand Aassay Biz's 7-day money-back guarantee, plan cancellation rules, and subscription refund guidelines."
      />
      <PublicHeader />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-12">
          <LegalNavTabs />
          
          <div className="border-b border-slate-200 pb-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cancellation & Refund Policy</h1>
            </div>
            <p className="text-sm text-slate-500">
              Last Updated: September 14, 2026 • 7-Day Money-Back Guarantee
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Free Trial & Free Forever Tier
              </h2>
              <p>
                <AassayBizBrand /> provides a comprehensive <strong>Free Forever plan</strong> and interactive online product demos. We encourage all prospective business users to thoroughly test our invoicing, inventory, HR attendance, and CRM modules before upgrading to any paid plan.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. 7-Day Satisfaction Guarantee (New Subscriptions)
              </h2>
              <p>
                If you purchase any paid subscription (Plan 2: Sales & Stock or Plan 3: Business Suite) for the first time and find that the software does not suit your business requirements, you are eligible for a <strong>100% full refund within 7 calendar days</strong> of your initial payment date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Cancellation Terms
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You can cancel your subscription renewal at any time directly from the <strong>Admin Panel &gt; Subscription & Billing</strong> section.</li>
                <li>Upon cancellation, your subscription will remain active until the end of the current paid billing cycle.</li>
                <li>You will never be charged again once cancellation is submitted.</li>
                <li>Your historical invoice data and records remain securely accessible on the free plan tier.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Refund Processing Timelines
              </h2>
              <p>
                Approved refunds are initiated within <strong>24 to 48 hours</strong> of verification. Depending on your bank or payment provider (UPI, NetBanking, Credit/Debit Card), the credited amount will reflect in your original payment source within <strong>5 to 7 business days</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Non-Refundable Items
              </h2>
              <p className="mb-2">Refunds are not applicable in the following scenarios:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Subscription renewal charges requested after the 7-day initial window has expired.</li>
                <li>Custom enterprise domain registration or third-party SMS/WhatsApp API gateway consumption credits.</li>
                <li>Accounts terminated due to violation of our Terms of Service (e.g. fraudulent invoicing or illegal activities).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. How to Request a Refund
              </h2>
              <p>
                To request a cancellation or refund, simply send an email or WhatsApp message with your registered business email and invoice ID:
              </p>
              <div className="mt-3 p-4 bg-slate-100 rounded-xl space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5"><AassayBizBrand /> Billing Support</p>
                <p>Email: <a href="mailto:support@aassaybiz.com" className="text-primary hover:underline">support@aassaybiz.com</a></p>
                <p>WhatsApp / Call: +91 7806025875</p>
                <p className="text-xs text-slate-500 mt-1">Response time: Within 4 business hours.</p>
              </div>
            </section>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

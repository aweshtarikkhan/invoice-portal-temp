import { useEffect } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LegalNavTabs } from "@/components/public/LegalNavTabs";
import { RefreshCw, Download, Mail, Phone, MapPin, Building2, AlertTriangle, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/shared/SEO";

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <SEO 
        title="Cancellation & Refund Policy | Aassay Biz" 
        description="Official Cancellation & Refund Policy of AASSAY Biz (Emerging Thoughts Private Limited). Understand evaluation options, auto-renewal rules, and non-refundability terms."
      />
      <PublicHeader />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-12">
          <LegalNavTabs />
          
          <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <RefreshCw className="w-6 h-6" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Cancellation &amp; Refund Policy</h1>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                AASSAY Biz — a product of <strong className="text-slate-900">Emerging Thoughts Private Limited</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Last Updated: 25-Sept-2026 • Governs all paid plans, subscriptions, licences, and services
              </p>
            </div>

            <a 
              href="/legal/Cancellation-and-Refund-Policy.docx" 
              download="AASSAY-Biz-Cancellation-and-Refund-Policy.docx"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all self-start sm:self-auto shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Download Doc (.docx)</span>
            </a>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-700">
            {/* Preamble */}
            <section className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/70">
              <h2 className="text-base font-bold text-slate-900 mb-2">Preamble</h2>
              <p className="mb-3">
                This Cancellation &amp; Refund Policy (this "Policy") governs all paid plans, subscriptions, licences, and services offered through AASSAY Biz (the "Platform"), operated by Emerging Thoughts Private Limited (the "Company," "we," "us," or "our"). This Policy forms part of, and is to be read together with, the Company's Terms &amp; Conditions and Privacy Policy.
              </p>
              <p className="font-semibold text-slate-900">
                BY PURCHASING OR SUBSCRIBING TO ANY PAID PLAN ON AASSAY BIZ, THE CUSTOMER ("you," "your," or "Customer") ACKNOWLEDGES THAT THEY HAVE READ, UNDERSTOOD, AND ACCEPTED THIS POLICY IN ITS ENTIRETY.
              </p>
            </section>

            {/* 1. Free Version and Evaluation */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                1. Free Version and Evaluation
              </h2>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>1.1.</strong> The Company makes available a free version or evaluation option ("Free Version") enabling prospective Customers to explore the Platform and assess its features, functionality, and suitability for their business requirements prior to purchasing a paid plan.
                </p>
                <p>
                  <strong>1.2.</strong> Customers are strongly encouraged to make full use of the Free Version to evaluate the Platform before committing to a paid subscription.
                </p>
                <p>
                  <strong>1.3.</strong> By proceeding with a paid subscription, the Customer represents and confirms that they have had a reasonable opportunity to evaluate the Platform and have voluntarily elected to purchase the selected plan.
                </p>
              </div>
            </section>

            {/* 2. No Refund on Paid Subscriptions */}
            <section className="p-5 bg-amber-50/60 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <h2 className="text-lg font-bold text-slate-900">
                  2. No Refund on Paid Subscriptions
                </h2>
              </div>
              <div className="space-y-2.5 text-slate-700">
                <p>
                  <strong>2.1.</strong> Save as expressly set out in Clause 8 of this Policy or as required under Applicable Law, <strong>all payments made towards paid subscriptions, licences, or plans on AASSAY Biz are non-refundable</strong>.
                </p>
                <p>
                  <strong>2.2.</strong> Without limiting the generality of the foregoing, no refund, cancellation refund, partial refund, or pro-rata refund shall ordinarily be granted in circumstances including, without limitation, where:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li><strong>(a)</strong> the Customer changes their mind following purchase;</li>
                  <li><strong>(b)</strong> the Customer does not use the Platform;</li>
                  <li><strong>(c)</strong> the Customer uses only a portion of the available features;</li>
                  <li><strong>(d)</strong> the Customer does not use the Platform for the entirety of the subscription period;</li>
                  <li><strong>(e)</strong> the Customer subsequently determines that the Platform does not meet their requirements; or</li>
                  <li><strong>(f)</strong> the Customer purchases a plan and thereafter elects not to continue using it.</li>
                </ul>
                <p className="text-xs font-medium text-slate-500 pt-1">
                  <strong>2.3.</strong> Customers are accordingly advised to evaluate the Free Version and select their plan carefully prior to making payment.
                </p>
              </div>
            </section>

            {/* 3. Cancellation of Subscription */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                3. Cancellation of Subscription
              </h2>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>3.1.</strong> A Customer may elect not to continue their subscription into the next billing or renewal period.
                </p>
                <p>
                  <strong>3.2.</strong> Cancellation shall ordinarily operate to prevent renewal of the subscription for the next applicable period.
                </p>
                <p>
                  <strong>3.3.</strong> Cancellation shall not, in itself, entitle the Customer to a refund for the current paid subscription period, save where otherwise required under Applicable Law or expressly agreed by the Company in writing.
                </p>
                <p>
                  <strong>3.4.</strong> Following cancellation, the Customer may continue to access the applicable services until the expiry of the already-paid subscription period, subject to the applicable plan and the Company's Terms &amp; Conditions.
                </p>
                <p>
                  <strong>3.5.</strong> Upon expiry of the subscription period without renewal, or upon termination of the Customer's account, personal data uploaded by the Customer (including Customer Personal Data, as defined in the Company's Terms &amp; Conditions) shall be retained, deleted, or returned in accordance with the retention and erasure provisions of the Company's Privacy Policy and the Digital Personal Data Protection Rules, 2025, subject to any legal retention requirements applicable to the Company.
                </p>
              </div>
            </section>

            {/* 4 & 5. Automatic Renewal & Disabling */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  4. Automatic Renewal
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p><strong>4.1.</strong> The Company may offer an automatic renewal option ("Auto-Renewal") in respect of eligible subscriptions.</p>
                  <p><strong>4.2.</strong> Where a Customer actively selects or enables Auto-Renewal, the subscription shall renew automatically for the applicable renewal period unless the Customer disables Auto-Renewal prior to the relevant renewal date.</p>
                  <p><strong>4.3.</strong> The applicable subscription fee, together with any applicable taxes, may be charged to the Customer's designated payment method at the time of renewal.</p>
                  <p><strong>4.4.</strong> The Customer is responsible for ensuring that their payment information remains valid, current, and available for such purpose.</p>
                  <p><strong>4.5.</strong> Payment and billing information provided in connection with Auto-Renewal or otherwise shall be handled in accordance with the security safeguards described in the Company's Privacy Policy.</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  5. Disabling Auto-Renewal
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p><strong>5.1.</strong> A Customer who does not wish to continue with Auto-Renewal must disable such option prior to the next renewal date, through the account or subscription settings available on the Platform, or by contacting the Company's support team.</p>
                  <p><strong>5.2.</strong> The Company may, where applicable, provide a reminder or notification in respect of an upcoming renewal; however, the absence or non-receipt of any such reminder shall not, by itself, operate to cancel an active Auto-Renewal instruction.</p>
                </div>
              </div>
            </section>

            {/* 6 & 7. Renewal Payments & Failed Payments */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  6. Renewal Payments
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p><strong>6.1.</strong> Where Auto-Renewal has been enabled, a successful renewal payment shall extend the subscription for the applicable renewal period.</p>
                  <p><strong>6.2.</strong> Renewal payments are non-refundable, save as required under Applicable Law or pursuant to any specific exception expressly communicated by the Company in writing.</p>
                  <p><strong>6.3.</strong> Customers are advised to review their Auto-Renewal status in advance of the renewal date should they not wish to continue the subscription.</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  7. Failed Renewal Payments
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p><strong>7.1.</strong> In the event that an automatic renewal payment fails, the Company may, at its discretion: (a) notify the Customer of such failure; (b) attempt to process the payment again, where supported by the relevant payment provider; (c) temporarily restrict certain features of the Platform; or (d) suspend or terminate the Customer's access following expiry of the applicable payment grace period.</p>
                  <p><strong>7.2.</strong> The Customer shall, notwithstanding the foregoing, remain liable for all outstanding amounts due to the Company.</p>
                </div>
              </div>
            </section>

            {/* 8. Exceptions to Non-Refundability */}
            <section className="p-5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h2 className="text-lg font-bold text-slate-900">
                  8. Exceptions to Non-Refundability
                </h2>
              </div>
              <div className="space-y-2 text-slate-700">
                <p>
                  <strong>8.1.</strong> Notwithstanding Clause 2, the Company may, at its sole discretion, consider a refund or adjustment in exceptional circumstances, including where:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li><strong>(a)</strong> a duplicate payment has been made owing to a technical or payment-processing error;</li>
                  <li><strong>(b)</strong> an incorrect amount has been charged due to an error attributable to the Company;</li>
                  <li><strong>(c)</strong> a refund is mandated under Applicable Law; or</li>
                  <li><strong>(d)</strong> the Company determines, in its sole discretion, that a specific exception is warranted in the circumstances.</li>
                </ul>
                <p className="text-xs text-slate-600 pt-1">
                  <strong>8.2.</strong> Any refund approved under this Clause 8 shall ordinarily be processed through the original payment method, subject to the processes and timelines of the applicable payment gateway or banking institution.
                </p>
              </div>
            </section>

            {/* 9 & 10. Service Issues & Plan Changes */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  9. Service Issues
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p><strong>9.1.</strong> Should the Customer experience a technical issue in connection with the Platform, the Customer is encouraged to contact the Company's support team so that the issue may be investigated and, where possible, resolved.</p>
                  <p><strong>9.2.</strong> The provision of technical support or troubleshooting shall not, in itself, give rise to an automatic right to a refund or an extension of the subscription period.</p>
                  <p><strong>9.3.</strong> Where a significant service issue is directly attributable to the Company, the Company may, at its discretion and subject to Applicable Law and its other policies, provide an appropriate service adjustment or other resolution.</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  10. Changes to Plans
                </h2>
                <div className="space-y-2 text-slate-600">
                  <p><strong>10.1.</strong> Where a Customer wishes to change, upgrade, downgrade, or purchase additional services, the commercial terms and pricing applicable at the time of such change shall govern.</p>
                  <p><strong>10.2.</strong> A change or downgrade of plan shall not, in itself, give rise to a right to a refund in respect of amounts already paid.</p>
                </div>
              </div>
            </section>

            {/* 11. Notices and Contact */}
            <section className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                11. Notices and Contact
              </h2>
              <p className="text-slate-600 mb-4">
                <strong>11.1.</strong> All queries relating to cancellation, Auto-Renewal, or refunds shall be addressed to:
              </p>
              
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2 text-sm text-slate-800">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Emerging Thoughts Private Limited — AASSAY Biz</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Email: <a href="mailto:support@aassaybiz.com" className="text-primary font-medium hover:underline">support@aassaybiz.com</a></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Phone: (0755) 4932378</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Address: T-4, 501 Sagar Lake View Enclave, Ayodhya Bypass, Bhopal – 462 022, Madhya Pradesh, India</span>
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Website: <a href="https://www.aassaybiz.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aassaybiz.com</a>
                </div>
              </div>
            </section>

            {/* Important Notice Box */}
            <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 text-blue-950 space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-blue-900">IMPORTANT NOTICE</h3>
              <p className="text-xs sm:text-sm leading-relaxed">
                Customers are strongly advised to evaluate AASSAY Biz using the Free Version prior to purchasing a paid subscription. By purchasing a paid plan, the Customer acknowledges having had the opportunity to evaluate the Platform and understands that paid subscription fees are, save as set out in this Policy, non-refundable.
              </p>
              <p className="text-xs leading-relaxed text-blue-800">
                Where Auto-Renewal is enabled, the subscription shall renew automatically until Auto-Renewal is disabled by the Customer prior to the applicable renewal date.
              </p>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

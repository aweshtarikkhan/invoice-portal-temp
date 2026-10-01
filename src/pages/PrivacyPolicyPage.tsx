import { useEffect } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LegalNavTabs } from "@/components/public/LegalNavTabs";
import { ShieldCheck, Download, Mail, Phone, MapPin, Building2, AlertCircle } from "lucide-react";
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
        description="Official Privacy Policy of AASSAY Biz (Emerging Thoughts Private Limited) in compliance with the Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025."
      />
      <PublicHeader />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-12">
          <LegalNavTabs />
          
          <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                AASSAY Biz — a product of <strong className="text-slate-900">Emerging Thoughts Private Limited</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Last Updated: 25-Sept-2026 • Issued in compliance with DPDP Act, 2023 &amp; DPDP Rules, 2025
              </p>
            </div>
            
            <a 
              href="/legal/Privacy-Policy.docx" 
              download="AASSAY-Biz-Privacy-Policy.docx"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all self-start sm:self-auto shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Download Doc (.docx)</span>
            </a>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-700">
            {/* Introduction */}
            <section className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/70">
              <h2 className="text-base font-bold text-slate-900 mb-2">Introduction</h2>
              <p className="mb-3">
                Emerging Thoughts Private Limited ("Company," "we," "us," or "our") respects your privacy and is committed to protecting it through this Privacy Policy. This document explains how we collect, use, store, process, and safeguard information when you access or use AASSAY Biz — our business management platform — through our website, web application, mobile application, software, and related services (collectively, the "Platform").
              </p>
              <p className="mb-3">
                This Privacy Policy is issued in accordance with the <strong>Digital Personal Data Protection Act, 2023 ("DPDP Act")</strong> and the <strong>Digital Personal Data Protection Rules, 2025 ("DPDP Rules")</strong>, together with other applicable data protection laws of India.
              </p>
              <p className="font-semibold text-slate-900">
                By accessing or using AASSAY Biz, you confirm that you have read, understood, and agree to the practices described in this Privacy Policy.
              </p>
            </section>

            {/* 1. About AASSAY Biz */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                1. About AASSAY Biz
              </h2>
              <p>
                AASSAY Biz is a business management platform that helps organizations manage core functions such as invoicing, inventory, customer relationship management (CRM), human resources (HR), marketing, and internal business communication.
              </p>
              <p className="mt-2">
                In the course of providing these services, AASSAY Biz processes information submitted by businesses and their authorized users.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                2. Information We Collect
              </h2>
              <p className="mb-4">
                The information we collect depends on how you use the Platform, and generally falls into the following categories:
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 mb-2">2.1 Account and Business Information</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Business/organization name and address</li>
                    <li>Contact person's name, email address, and phone number</li>
                    <li>GST and other business registration details</li>
                    <li>PAN or other identification information, where required</li>
                    <li>Login credentials</li>
                    <li>Subscription and account details</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 mb-2">2.2 Customer and Contact Information</h3>
                  <p className="mb-2 text-slate-600">When you use our CRM or related features, you may store information about your own customers, prospects, suppliers, or business contacts, including:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Name, mobile number, email address, and physical address</li>
                    <li>Company or organization details</li>
                    <li>Transaction and interaction history</li>
                    <li>Any other information you choose to store on the Platform</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 mb-2">2.3 Employee and HR Information</h3>
                  <p className="mb-2 text-slate-600">If you use our HR-related features, you may enter employee data such as:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Name, contact details, and employee ID</li>
                    <li>Joining date and employment information</li>
                    <li>Attendance and leave records</li>
                    <li>Salary and payroll information</li>
                    <li>Bank/payment details, where you choose to provide them</li>
                    <li>Other employment-related information</li>
                  </ul>
                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900 text-xs">
                    <strong>Location Data for Attendance:</strong> When an employee marks attendance through the Platform (e.g., via the mobile app), we collect the GPS location of the device at the time attendance is marked. This location data is captured and stored solely to record and verify attendance and is made available to the employer (business customer) as part of the attendance record. Employers using this feature are responsible for informing their employees and obtaining any consent required under applicable law before enabling this feature.
                  </div>
                  <p className="mt-2 text-xs text-slate-500 italic">
                    Note: You are responsible for ensuring you have the appropriate legal authority to provide such employee or third-party information to us for processing.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 mb-2">2.4 Transaction and Business Data</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Invoices, quotations, and sales/purchase records</li>
                    <li>Inventory and product/service details</li>
                    <li>Payment-related records</li>
                    <li>Business reports and customer transaction history</li>
                    <li>Other business data you enter into the Platform</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 mb-2">2.5 Technical and Usage Information</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>IP address, browser, and device information</li>
                    <li>Operating system and login/access details</li>
                    <li>Date and time of access, and pages or features used</li>
                    <li>Usage, performance, diagnostic, and security information</li>
                    <li>GPS/location data, specifically when employees use the attendance-marking feature (see Section 2.3)</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 mb-2">2.6 Cookies and Similar Technologies</h3>
                  <p className="text-slate-600">
                    We use cookies and similar technologies to keep you signed in, remember your preferences, understand usage patterns, and improve Platform security and performance. You can manage cookie preferences through your browser or device settings, though disabling certain cookies may affect functionality.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Notice, Consent, and Purpose of Processing */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                3. Notice, Consent, and Purpose of Processing
              </h2>
              
              <h3 className="font-semibold text-slate-900 mb-2">3.1 Itemized Notice</h3>
              <p className="mb-4">
                In accordance with the DPDP Act and DPDP Rules, before collecting personal information for which your consent is required, we provide (or make available) a clear, plain-language notice stating: (a) the specific personal data being collected; (b) the specific purpose for which it is collected; (c) how you may exercise your rights under Section 11; (d) how you may withdraw consent; and (e) how you may raise a complaint with the Data Protection Board of India. The table below summarizes this mapping:
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-1/3">Data Category</th>
                      <th className="p-3">Purpose of Processing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Account and Business Information (2.1)</td>
                      <td className="p-3">Creating and managing your account, verifying your business, providing subscriptions</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Customer and Contact Information (2.2)</td>
                      <td className="p-3">Enabling CRM functionality you choose to use</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Employee and HR Information, including attendance/GPS data (2.3)</td>
                      <td className="p-3">Enabling HR, payroll, and attendance functionality you choose to use</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Transaction and Business Data (2.4)</td>
                      <td className="p-3">Enabling invoicing, inventory, and reporting functionality</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Technical and Usage Information (2.5)</td>
                      <td className="p-3">Security, diagnostics, and Platform performance</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Cookies (2.6)</td>
                      <td className="p-3">Sign-in continuity, preferences, and analytics</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 text-slate-600">
                <p>
                  <strong>3.2 Nature of Consent:</strong> Where we rely on your consent to process personal information, such consent is free, specific, informed, unconditional, and unambiguous, and is obtained through a clear affirmative action (such as ticking a consent box or otherwise opting in). We do not rely on pre-ticked boxes, silence, or inactivity as consent.
                </p>
                <p>
                  <strong>3.3 Withdrawal of Consent:</strong> You may withdraw your consent at any time, and withdrawal shall be as easy as giving consent. You may withdraw consent through your account settings or by contacting us using the details in Section 16. On withdrawal, we will, within a reasonable time, cease processing your personal data for the relevant purpose, unless continued processing or retention is required or authorized under applicable law. Withdrawal of consent does not affect the lawfulness of processing carried out prior to such withdrawal.
                </p>
                <p>
                  <strong>3.4 Language:</strong> Where required under the DPDP Rules, this notice and related consent requests will be made available in English and, where you have previously interacted with the Platform in a language specified in the Eighth Schedule to the Constitution of India, in that language as well.
                </p>
                <p>
                  <strong>3.5 Other Legal Bases:</strong> In addition to consent, we may process personal information for "certain legitimate uses" recognized under the DPDP Act, including where you have voluntarily provided your personal data for a specified purpose and have not indicated you do not consent, for compliance with a judgment or legal obligation, for employment-related purposes, or for responding to a medical emergency or ensuring safety.
                </p>
              </div>
            </section>

            {/* 4. How We Use Your Information */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                4. How We Use Your Information
              </h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Create, manage, and secure user accounts</li>
                <li>Provide and operate the Platform and its features (invoicing, CRM, HR, inventory, etc.)</li>
                <li>Process subscriptions and payments</li>
                <li>Generate business reports and analytics</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send account-related, service, and security communications</li>
                <li>Improve the Platform and develop new features</li>
                <li>Detect, prevent, and investigate fraud, misuse, or security incidents</li>
                <li>Maintain records for business, accounting, and legal compliance</li>
                <li>Comply with applicable laws and regulations</li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Where permitted by law, we may also use aggregated or anonymized data for analytics and service improvement. Such data cannot be used to identify any individual.
              </p>
            </section>

            {/* 5. Business Data Provided by Our Customers */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                5. Business Data Provided by Our Customers — Data Fiduciary and Data Processor Roles
              </h2>
              <div className="space-y-3 text-slate-600">
                <p>
                  <strong>5.1.</strong> Businesses using AASSAY Biz may upload or enter data relating to their own customers, employees, suppliers, or transactions ("Customer Personal Data").
                </p>
                <p>
                  <strong>5.2.</strong> In relation to Customer Personal Data, <strong>the business using AASSAY Biz acts as the Data Fiduciary</strong> (as defined under the DPDP Act), and <strong>AASSAY Biz acts as a Data Processor</strong>, processing such data solely on the instructions of, and to provide the functionality requested by, the business customer.
                </p>
                <p>
                  <strong>5.3.</strong> As the Data Fiduciary, the business customer is responsible for:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Determining the purpose and lawful basis for collecting such information;</li>
                  <li>Ensuring it has proper legal authority, including any necessary consent, to collect and process the data;</li>
                  <li>Providing appropriate notices to the individuals concerned in accordance with the DPDP Act and Rules;</li>
                  <li>Ensuring the accuracy and lawfulness of the information provided; and</li>
                  <li>Complying with all applicable privacy and data protection laws, including its own obligations relating to consent, breach notification, and data principal rights.</li>
                </ul>
                <p>
                  <strong>5.4.</strong> As Data Processor, AASSAY Biz will: (a) process Customer Personal Data only in accordance with the business customer's instructions and this Privacy Policy; (b) implement the security safeguards described in Section 8; (c) promptly notify the relevant business customer upon becoming aware of a personal data breach affecting Customer Personal Data, so that the business customer can meet its own notification obligations under the DPDP Act and Rules; and (d) delete or return Customer Personal Data upon termination of the business customer's account, subject to Section 9.
                </p>
              </div>
            </section>

            {/* 6. How We Share Information */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                6. How We Share Information
              </h2>
              <p className="font-semibold text-slate-900 mb-3">
                We do not sell personal information to third parties.
              </p>
              <p className="mb-4">We may share information only where reasonably necessary, as described below:</p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-1/3">Category</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Service Providers</td>
                      <td className="p-3">Trusted third parties supporting cloud hosting, data storage, payment processing, email/communication, analytics, security, and technical infrastructure — bound by appropriate safeguards.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Legal &amp; Regulatory Requirements</td>
                      <td className="p-3">Where disclosure is required by law, regulation, court order, or government authority.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Business Transactions</td>
                      <td className="p-3">In connection with a merger, acquisition, restructuring, or sale of assets, subject to applicable law.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">With Your Direction or Consent</td>
                      <td className="p-3">Where you instruct us to share information, or where your consent has been obtained.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Payment Information */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                7. Payment Information
              </h2>
              <p>
                Payments made through AASSAY Biz are processed by third-party payment service providers. We may receive limited transaction details (such as payment status, reference number, and date), but we generally do not store complete card details unless expressly stated and legally permitted. Payment processing is also subject to the relevant provider's own privacy policy and terms.
              </p>
            </section>

            {/* 8. Data Security */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                8. Data Security
              </h2>
              <p className="mb-3">
                We apply reasonable technical and organizational safeguards, consistent with Rule 6 of the DPDP Rules, to protect your information from unauthorized access, alteration, disclosure, loss, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 mb-3">
                <li>Access controls and authentication mechanisms</li>
                <li>Encryption of personal data, where appropriate</li>
                <li>Monitoring, logging (including retention of relevant logs for the period required to detect and investigate breaches), and backup systems</li>
                <li>Infrastructure and administrative security controls</li>
                <li>Measures to detect and respond to unauthorized access or personal data breaches</li>
              </ul>
              <p className="text-xs text-slate-500">
                While we work to protect your data, no internet-based system is completely secure. Please safeguard your account credentials and notify us immediately of any suspected unauthorized access.
              </p>
            </section>

            {/* 9. Data Retention and Erasure */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                9. Data Retention and Erasure
              </h2>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>9.1.</strong> We retain information for as long as reasonably necessary to provide our services, maintain your account, fulfil contractual and legal obligations, resolve disputes, prevent fraud, and enforce our agreements, and in accordance with any retention periods prescribed under the DPDP Rules for specific categories of personal data.
                </p>
                <p>
                  <strong>9.2.</strong> Where your personal data is no longer necessary for the purpose for which it was collected and you have not exercised any right in relation to your account for a prescribed period of inactivity, we will, where required under the DPDP Rules, notify you at least 48 hours in advance before erasing such data, unless you log in during that period or otherwise request continuation.
                </p>
                <p>
                  <strong>9.3.</strong> Once information is no longer required, we delete, anonymize, or securely dispose of it in accordance with applicable law.
                </p>
                <p>
                  <strong>9.4.</strong> If a business customer terminates its account, Customer Personal Data will be deleted or returned in accordance with Section 5.4, subject to the applicable subscription agreement or service terms and any legal retention requirements.
                </p>
              </div>
            </section>

            {/* 10. Data Breach Notification */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                10. Data Breach Notification
              </h2>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>10.1.</strong> In the event of a personal data breach, we will take prompt steps to contain, assess, and remediate the breach.
                </p>
                <p>
                  <strong>10.2.</strong> Where required under the DPDP Act and Rules, we will notify the Data Protection Board of India without delay, and will notify affected individuals in plain language, describing: (a) the nature and extent of the breach; (b) the personal data categories and approximate number of individuals affected; (c) the likely consequences of the breach; (d) the measures taken or proposed to mitigate the breach; and (e) contact details through which affected individuals may seek further information or assistance.
                </p>
                <p>
                  <strong>10.3.</strong> Where Customer Personal Data is affected, we will additionally notify the relevant business customer (as Data Fiduciary) promptly, in accordance with Section 5.4, so that the business customer may fulfil its own notification obligations.
                </p>
              </div>
            </section>

            {/* 11. Your Rights */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                11. Your Rights
              </h2>
              <p className="mb-2">Subject to the DPDP Act and other applicable law, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 mb-3">
                <li>Obtain a summary of personal information we hold about you and the processing activities undertaken</li>
                <li>Request correction, completion, or updating of inaccurate or incomplete information</li>
                <li>Request erasure of your information, where no longer necessary for the purpose collected or where consent has been withdrawn, subject to legal retention requirements</li>
                <li>Withdraw consent at any time, as easily as it was given (see Section 3.3)</li>
                <li>Nominate another individual to exercise these rights on your behalf in the event of your death or incapacity</li>
                <li>Raise a grievance regarding how your information is processed, and, if unresolved, approach the Data Protection Board of India</li>
                <li>Exercise other rights available under applicable law</li>
              </ul>
              <p className="text-xs text-slate-500">
                You can submit such requests using the contact details in Section 16. If your information was submitted by a business using AASSAY Biz (rather than directly by you), you may need to contact that business directly, as they act as the Data Fiduciary controlling that data.
              </p>
            </section>

            {/* 12. Children's Privacy */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                12. Children's Privacy
              </h2>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>12.1.</strong> AASSAY Biz is intended for use by businesses and their authorized adult users. We do not knowingly seek to collect personal data of children (individuals below 18 years of age) except where verifiable consent of a parent or lawful guardian has been obtained, or where an exemption applies under the DPDP Act.
                </p>
                <p>
                  <strong>12.2.</strong> Where our HR features involve the personal data of an employee who is a minor, the employing business customer (as Data Fiduciary) is responsible for obtaining verifiable consent from the minor's parent or lawful guardian before entering such data on the Platform.
                </p>
                <p>
                  <strong>12.3.</strong> We do not knowingly undertake tracking, behavioral monitoring, or targeted advertising directed at children.
                </p>
                <p>
                  <strong>12.4.</strong> If you believe a child's personal data has been provided to us improperly, please contact us using the details in Section 16 so we can investigate and take appropriate action.
                </p>
              </div>
            </section>

            {/* 13 & 14 & 15. Links, International Transfers, Marketing */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  13. Third-Party Links and Services
                </h2>
                <p className="text-slate-600">
                  The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices, content, or security of these third parties. We encourage you to review their privacy policies before sharing any personal information with them.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  14. International Data Transfers
                </h2>
                <p className="text-slate-600">
                  Depending on our technology infrastructure and service providers, your information may be processed or stored in India or other jurisdictions. Where data is transferred across borders, we take reasonable steps to comply with applicable legal and contractual requirements, including any restrictions on transfer of personal data to specific countries or territories as may be notified by the Central Government of India from time to time under the DPDP Act.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  15. Marketing Communications
                </h2>
                <p className="text-slate-600 mb-2">
                  We may send you service-related communications, including account notifications, billing information, and security alerts. Where permitted by law, we may also send product updates or promotional offers.
                </p>
                <p className="text-xs text-slate-500">
                  You may opt out of promotional communications at any time via the unsubscribe link or by contacting us directly. You will continue to receive essential service and transactional communications even after opting out of marketing messages.
                </p>
              </div>
            </section>

            {/* 16. Grievance Redressal and Data Protection Officer */}
            <section className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900">
                  16. Grievance Redressal and Data Protection Officer
                </h2>
              </div>
              <p className="text-slate-700 mb-4">
                <strong>16.1.</strong> If you have a question, concern, or complaint about how we process your personal information, please contact our Grievance Officer / designated contact person, as required under Rule 9 of the DPDP Rules:
              </p>
              
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2.5 text-sm text-slate-800">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Jitendra Kumar Verma</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Director &amp; Grievance Officer</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Email: <a href="mailto:admin@aassaybiz.com" className="text-primary font-medium hover:underline">admin@aassaybiz.com</a></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Phone: (0755) 4932378</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Address: T-4, 501 Sagar Lake View Enclave, Ayodhya Bypass, Bhopal – 462 022, Madhya Pradesh, India</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <p>
                  <strong>16.2.</strong> We will acknowledge and make reasonable efforts to resolve your grievance within the timeframe prescribed under the DPDP Rules. If you are not satisfied with our resolution, or do not receive a response within the prescribed timeframe, you may file a complaint with the Data Protection Board of India.
                </p>
                <p>
                  <strong>16.3.</strong> If we are designated a Significant Data Fiduciary under the DPDP Act, we will appoint a Data Protection Officer based in India, whose contact details will be published here and who will represent us in dealings with the Data Protection Board.
                </p>
              </div>
            </section>

            {/* 17, 18, 19 */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  17. Changes to This Privacy Policy
                </h2>
                <p className="text-slate-600">
                  We may update this Privacy Policy periodically to reflect changes in our services, technology, or legal requirements. Material changes will be communicated through the Platform or other appropriate channels. The updated policy takes effect on the date stated at the top of the revised version.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  18. Governing Law
                </h2>
                <p className="text-slate-600">
                  This Privacy Policy is governed by and interpreted in accordance with the laws of India, including the Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025, and other applicable data protection and privacy regulations.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  19. Contact Us
                </h2>
                <p className="text-slate-600 mb-3">
                  For any questions about this Privacy Policy or our privacy practices, please reach out to:
                </p>
                <div className="p-4 bg-slate-100 rounded-xl space-y-1.5 text-slate-700">
                  <p className="font-bold text-slate-900">Emerging Thoughts Private Limited — AASSAY Biz</p>
                  <p>Website: <a href="https://www.aassaybiz.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aassaybiz.com</a></p>
                  <p>Email: <a href="mailto:support@aassaybiz.com" className="text-primary hover:underline">support@aassaybiz.com</a></p>
                  <p>Address: T-4, 501 Sagar Lake View Enclave, Ayodhya Bypass, Bhopal – 462 022</p>
                  <p>Phone: (0755) 4932378</p>
                </div>
              </div>
            </section>

            <p className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200">
              By using AASSAY Biz, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

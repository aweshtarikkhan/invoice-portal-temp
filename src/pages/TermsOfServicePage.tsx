import { useEffect } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LegalNavTabs } from "@/components/public/LegalNavTabs";
import { FileCheck, Download, Mail, Phone, MapPin, Building2, Scale } from "lucide-react";
import { SEO } from "@/components/shared/SEO";

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <SEO 
        title="Terms & Conditions | Aassay Biz" 
        description="Official Terms & Conditions of AASSAY Biz (Emerging Thoughts Private Limited). Legally binding agreement governing platform access, billing, user obligations, and dispute resolution."
      />
      <PublicHeader />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-12">
          <LegalNavTabs />
          
          <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <FileCheck className="w-6 h-6" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terms &amp; Conditions</h1>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                AASSAY Biz — a product of <strong className="text-slate-900">Emerging Thoughts Private Limited</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Last Updated: 25-Sept-2026 • Jurisdiction: Bhopal, Madhya Pradesh, India
              </p>
            </div>

            <a 
              href="/legal/Terms-and-Conditions.docx" 
              download="AASSAY-Biz-Terms-and-Conditions.docx"
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
                These Terms &amp; Conditions (the "Terms") constitute a legally binding agreement between the user ("you," "your," or "User") and <strong>Emerging Thoughts Private Limited</strong>, a company incorporated under the laws of India (the "Company," "we," "us," or "our"), governing access to and use of AASSAY Biz, including its website, web application, mobile application, software, products, features, and related services (collectively, the "Platform").
              </p>
              <p className="font-semibold text-slate-900">
                BY ACCESSING, REGISTERING FOR, PURCHASING, SUBSCRIBING TO, OR OTHERWISE USING THE PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS IN THEIR ENTIRETY. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST REFRAIN FROM ACCESSING OR USING THE PLATFORM.
              </p>
            </section>

            {/* 1. Definitions and Interpretation */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                1. Definitions and Interpretation
              </h2>
              <div className="space-y-2 text-slate-600">
                <p><strong>1.1.</strong> In these Terms, unless the context otherwise requires:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li><strong>(a) "Agreement"</strong> means these Terms &amp; Conditions, together with the Privacy Policy and any applicable order form, licence agreement, or commercial agreement executed between the parties;</li>
                  <li><strong>(b) "Platform"</strong> means AASSAY Biz, including all associated websites, applications, software, features, and services provided by the Company;</li>
                  <li><strong>(c) "User Data"</strong> means all business, customer, employee, financial, or other information or content uploaded, entered, stored, or processed by the User through the Platform;</li>
                  <li><strong>(d) "Applicable Law"</strong> means all statutes, regulations, rules, orders, and other binding requirements of any competent governmental or regulatory authority applicable to the parties or the subject matter of these Terms;</li>
                  <li><strong>(e) "Confidential Information"</strong> has the meaning ascribed to it in Clause 19;</li>
                  <li><strong>(f) "DPDP Act"</strong> means the Digital Personal Data Protection Act, 2023, and <strong>"DPDP Rules"</strong> means the Digital Personal Data Protection Rules, 2025, each as amended, re-enacted, or replaced from time to time;</li>
                  <li><strong>(g) "Personal Data," "Data Fiduciary," "Data Processor," "Data Principal," and "Personal Data Breach"</strong> shall have the meanings ascribed to such terms under the DPDP Act; and</li>
                  <li><strong>(h)</strong> words importing the singular include the plural and vice versa.</li>
                </ul>
                <p className="text-xs text-slate-500 pt-1">
                  <strong>1.2.</strong> Headings are inserted for convenience only and shall not affect the interpretation of these Terms.
                </p>
              </div>
            </section>

            {/* 2 & 3. About the Platform & Eligibility */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  2. About the Platform
                </h2>
                <p className="text-slate-600 mb-2">
                  <strong>2.1.</strong> AASSAY Biz is a digital business-management platform designed to assist businesses in managing operational functions, which may include, without limitation: (a) invoicing and billing; (b) inventory management; (c) customer relationship management ("CRM"); (d) human resource management; (e) business communication; (f) marketing and promotional activities; (g) business reports and analytics; and (h) such other business-management tools and features as the Company may introduce from time to time.
                </p>
                <p className="text-slate-600 text-xs sm:text-sm">
                  <strong>2.2.</strong> The specific features available to a User shall depend on the plan, licence, package, or service selected by such User.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  3. Eligibility
                </h2>
                <div className="space-y-2 text-slate-600 text-xs sm:text-sm">
                  <p><strong>3.1.</strong> A User may access and use the Platform only if such User: (a) possesses the legal capacity to enter into a binding agreement under Applicable Law; (b) provides accurate, current, and complete information during registration; (c) possesses due authority to represent the business, firm, institution, or organization on whose behalf the User is registering, where applicable; and (d) undertakes to comply with these Terms and all Applicable Law.</p>
                  <p><strong>3.2.</strong> Where a User accesses the Platform on behalf of a company, firm, institution, or other organization, such User represents and warrants that they possess the requisite authority to bind such entity to these Terms.</p>
                </div>
              </div>
            </section>

            {/* 4. Account Registration */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                4. Account Registration
              </h2>
              <div className="space-y-2 text-slate-600">
                <p><strong>4.1.</strong> Certain features of the Platform may require the creation of a user account. In connection therewith, the User undertakes to:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li><strong>(a)</strong> provide accurate, current, and complete information;</li>
                  <li><strong>(b)</strong> maintain and promptly update such information as necessary;</li>
                  <li><strong>(c)</strong> preserve the confidentiality of usernames, passwords, and other access credentials;</li>
                  <li><strong>(d)</strong> prevent unauthorized access to their account; and</li>
                  <li><strong>(e)</strong> promptly notify the Company upon becoming aware of any unauthorized access or misuse.</li>
                </ul>
                <p><strong>4.2.</strong> Save where such activity results from a security failure directly attributable to the Company, the User shall bear sole responsibility for all activities conducted through their account.</p>
                <p><strong>4.3.</strong> The Company reserves the right to suspend or restrict any account containing inaccurate, misleading, or fraudulent information, at its sole discretion.</p>
              </div>
            </section>

            {/* 5. User Data and Content */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                5. User Data and Content
              </h2>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>5.1.</strong> The User may upload, enter, store, or process business information through the Platform, including customer information, employee information, invoices, inventory records, contact details, documents, and other business data (collectively, "User Data"). <strong>As between the Company and the User, the User shall retain ownership of all User Data.</strong>
                </p>
                <p><strong>5.2.</strong> The User shall be solely responsible for: (a) the accuracy, legality, and completeness of all User Data; (b) obtaining all necessary permissions, notices, and consents prior to collecting or uploading personal information; (c) ensuring that its use of the Platform complies with Applicable Law; (d) ensuring it possesses the requisite authority to upload and process information relating to customers, employees, suppliers, or other third parties; and (e) maintaining appropriate backups of critical business information, where necessary.</p>
                <p><strong>5.3.</strong> The User shall not upload or process any information that it is not legally entitled to collect, use, or process.</p>
                <p><strong>5.4.</strong> Where the User enables or uses the Platform's attendance-marking feature, the Company shall collect the GPS location of the relevant employee's device at the time attendance is marked, solely for the purpose of recording and verifying such attendance. The User (as employer) shall be responsible for informing its employees and obtaining required consent.</p>
                <p><strong>5.5.</strong> Where any individual accesses or interacts with the Platform as a Data Principal, such individual shall comply with the duties applicable under Section 15 of the DPDP Act.</p>
              </div>
            </section>

            {/* 6. Company's Role under DPDP Act */}
            <section className="bg-slate-50/90 rounded-xl p-5 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 mb-2">
                6. The Company's Role in Processing Business Data
              </h2>
              <div className="space-y-2 text-slate-600 text-xs sm:text-sm">
                <p><strong>6.1.</strong> The Company provides the technology and infrastructure enabling businesses to manage their operations through the Platform.</p>
                <p><strong>6.2.</strong> Where a User uses the Platform to collect, store, or process Personal Data relating to its customers, employees, or other individuals ("Customer Personal Data"), <strong>such User acts as the Data Fiduciary</strong> under the DPDP Act, and remains solely responsible for determining the purpose and lawful basis of processing.</p>
                <p><strong>6.3.</strong> In respect of Customer Personal Data, <strong>the Company acts as a Data Processor</strong> on behalf of the User, and undertakes to: (a) process Customer Personal Data only in accordance with the User's instructions and this Agreement; (b) implement reasonable security safeguards; (c) notify the User without undue delay upon becoming aware of a Personal Data Breach; and (d) delete or return Customer Personal Data upon account termination.</p>
              </div>
            </section>

            {/* 7 & 8. Licence & Acceptable Use */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  7. Grant of Licence
                </h2>
                <p className="text-slate-600">
                  <strong>7.1.</strong> Subject to these Terms and the User's applicable plan, the Company grants the User a limited, non-exclusive, non-transferable, and revocable licence to access and use the Platform solely for legitimate business purposes.
                </p>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  <strong>7.2.</strong> This licence shall not confer any ownership interest in software, source code, trademarks, designs, interfaces, or other proprietary technology of the Company.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  8. Acceptable Use
                </h2>
                <p className="text-slate-600 mb-2"><strong>8.1.</strong> The User shall not, and shall not permit any third party to:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li>(a) use the Platform for any unlawful, fraudulent, or unauthorized purpose;</li>
                  <li>(b) violate any Applicable Law or regulation;</li>
                  <li>(c) attempt to gain unauthorized access to the Platform or other accounts;</li>
                  <li>(d) reverse engineer, decompile, or disassemble the Platform;</li>
                  <li>(e) copy, reproduce, modify, or commercially exploit the Platform without prior written authorization;</li>
                  <li>(f) resell or sublicense the Platform, save under an authorized partner or reseller arrangement;</li>
                  <li>(g) introduce malware, viruses, or other harmful code;</li>
                  <li>(h) interfere with the security, integrity, or operation of the Platform;</li>
                  <li>(i) employ automated scrapers or bots in a harmful manner;</li>
                  <li>(j) upload defamatory, abusive, or infringing content; or</li>
                  <li>(k) attempt to circumvent any usage, security, or access restriction.</li>
                </ul>
              </div>
            </section>

            {/* 9, 10, 11, 12. Plans, Payments, Renewal, Cancellation */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  9. Plans, Licences, and Commercial Terms
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Access to certain features may require the purchase of a paid plan or package. Commercial terms, including pricing, taxes, licence duration, and limits are communicated through the Platform or commercial invoice. In case of conflict with a specific written commercial agreement, that agreement shall prevail.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  10. Payments
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Payments shall be made through designated payment gateways. Applicable taxes and statutory charges are payable in addition to the stated price. Timely payment is required to maintain uninterrupted access.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  11. Renewal, Suspension, and Expiry
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Subscriptions expire upon conclusion of the term unless renewed. The Company reserves the right to suspend or restrict access in cases of non-payment, breach of terms, security risks, suspected fraud, or legal orders.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  12. Cancellation and Refunds
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Rights of cancellation and refund are governed by the Company's separate <strong>Cancellation &amp; Refund Policy</strong>. Save as expressly provided therein or mandated by Applicable Law, paid subscription fees are non-refundable.
                </p>
              </div>
            </section>

            {/* 13 to 20. IP, Feedback, Availability, Backup, Reports, Confidentiality, Security */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  13. Intellectual Property
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  All intellectual property rights in the Platform, software, UI designs, code, algorithms, and documentation belong exclusively to the Company. "AASSAY," "AASSAY Biz," and associated logos are trademarks of Emerging Thoughts Private Limited.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  14. Feedback and Suggestions
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Where a User provides suggestions or feedback, the Company may use such feedback without restriction or compensation, provided that confidential information is protected.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  15. Third-Party Services
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  The Platform may integrate with third-party providers (payment gateways, cloud hosting, messaging APIs). The Company bears no responsibility for external systems beyond its reasonable control.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  16. Service Availability &amp; 17. Data Backup
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  The Company uses reasonable efforts to ensure Platform availability. The Platform may experience downtime for scheduled maintenance or unforeseen technical issues. Users are responsible for maintaining independent backups of their critical business data.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  18. Accuracy of Information and Reports
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Reports and summaries generated by the Platform depend on user inputs. Users must independently verify calculations prior to tax filings or legal decisions. The Platform is a software tool, not a substitute for chartered accountants or legal counsel.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  19. Confidentiality &amp; 20. Security
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Both parties undertake to safeguard each other's Confidential Information. The Company enforces technical and organizational safeguards in accordance with the DPDP Rules.
                </p>
              </div>
            </section>

            {/* 21 to 24. Prohibited, Warranties, Liability, Indemnity */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  21. Prohibited Business Activities
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  The Platform shall not be used for illegal or deceptive business activities. Violation of this clause warrants immediate account termination.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  22. Disclaimer of Warranties &amp; 23. Limitation of Liability
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  The Platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by Indian law, the Company shall not be liable for indirect, consequential, or punitive damages, or loss of profits. Aggregate liability is limited to amounts paid by the User during the preceding subscription period.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  24. Indemnification
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  The User agrees to defend, indemnify, and hold harmless the Company against any third-party claims, liabilities, or expenses arising from the User's breach of these Terms, unlawful actions, or User Data.
                </p>
              </div>
            </section>

            {/* 25 to 27. Termination & Amendments */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  25. Term and Termination &amp; 26. Changes to Platform
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Users may terminate use at any time. The Company may suspend or terminate accounts upon material breach. The Company continually improves the Platform and may introduce or adjust features with appropriate notice.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  27. Amendment of These Terms
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  The Company reserves the right to amend these Terms. Revised terms will be posted with an updated "Last Updated" date. Continued use constitutes acceptance.
                </p>
              </div>
            </section>

            {/* 28. Governing Law and Jurisdiction */}
            <section className="p-5 bg-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-lg font-bold text-slate-900">
                  28. Governing Law and Jurisdiction
                </h2>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm">
                <strong>28.1.</strong> These Terms shall be governed by, and construed in accordance with, the laws of India.
              </p>
              <p className="text-slate-700 text-xs sm:text-sm mt-1">
                <strong>28.2.</strong> Subject to Applicable Law, any dispute arising out of or in connection with these Terms or the use of the Platform shall be subject to the <strong>exclusive jurisdiction of the competent courts at Bhopal, Madhya Pradesh, India</strong>.
              </p>
            </section>

            {/* 29, 30, 31. Force Majeure, Severability, Entire Agreement */}
            <section className="space-y-3 text-xs sm:text-sm text-slate-600">
              <p><strong>29. Force Majeure:</strong> The Company shall not be liable for failure or delay in performance caused by circumstances beyond its reasonable control, including natural disasters, acts of civil authorities, or infrastructure disruptions.</p>
              <p><strong>30. Severability:</strong> If any provision is held invalid, the remainder of these Terms shall remain in full force.</p>
              <p><strong>31. Entire Agreement:</strong> These Terms, together with the Privacy Policy and applicable commercial agreements, constitute the entire agreement between the parties.</p>
            </section>

            {/* 32. Notices and Contact */}
            <section className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                32. Notices and Contact
              </h2>
              <p className="text-slate-600 mb-4">
                All notices, queries, or legal correspondence relating to these Terms shall be addressed to:
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

            <p className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200">
              BY ACCESSING OR USING AASSAY BIZ, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO BE BOUND BY THESE TERMS &amp; CONDITIONS.
            </p>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

const fs = require('fs');

let code = fs.readFileSync('src/pages/CrmIntegrationsPage.tsx', 'utf8');

// 1. Update Lucide React imports
code = code.replace(
  'import { Webhook, Key, Copy, Plus, Trash2, CheckCircle2, Facebook, Phone, Link as LinkIcon, RefreshCcw } from "lucide-react";',
  'import { Webhook, Key, Copy, Plus, Trash2, CheckCircle2, Facebook, Phone, Link as LinkIcon, RefreshCcw, BookOpen } from "lucide-react";'
);

// 2. Add Dialog imports
if (!code.includes('import { Dialog')) {
  code = code.replace(
    'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";',
    'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";'
  );
}

// 3. Add state for guideOpen
if (!code.includes('const [guideOpen, setGuideOpen] = useState')) {
  code = code.replace(
    'const [jdActive, setJdActive] = useState(false);',
    'const [jdActive, setJdActive] = useState(false);\n  const [guideOpen, setGuideOpen] = useState<"indiamart" | "justdial" | "meta" | null>(null);'
  );
}

// 4. Add the Dialog at the end, just before the closing </div>
const dialogJSX = `
      {/* Guides Dialog */}
      <Dialog open={!!guideOpen} onOpenChange={(o) => !o && setGuideOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {guideOpen === "indiamart" && "IndiaMart Integration Guide"}
              {guideOpen === "justdial" && "Justdial Integration Guide"}
              {guideOpen === "meta" && "Meta (Facebook) Integration Guide"}
            </DialogTitle>
            <DialogDescription>
              Step-by-step instructions to connect your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-sm text-slate-700">
            {guideOpen === "indiamart" && (
              <ol className="list-decimal pl-5 space-y-3">
                <li>Log in to your <strong>IndiaMart Seller Dashboard</strong>.</li>
                <li>Navigate to <strong>Settings &gt; Lead API</strong> (or CRM Integration section).</li>
                <li>You will find your unique <strong>CRM Key</strong> listed there.</li>
                <li>Copy the CRM Key and your registered mobile number, and paste them into this portal.</li>
                <li>Click <strong>Save</strong> and toggle the switch to active.</li>
                <li><em>Our system will now automatically fetch new leads every 15 minutes.</em></li>
              </ol>
            )}

            {guideOpen === "justdial" && (
              <ol className="list-decimal pl-5 space-y-3">
                <li>Copy the unique <strong>Webhook URL</strong> generated in this portal.</li>
                <li>Log in to your <strong>Justdial Vendor Portal</strong> or contact your Justdial Account Manager.</li>
                <li>Navigate to the <strong>Lead Routing</strong> or <strong>Webhook Integration</strong> settings.</li>
                <li>Paste the Webhook URL and choose to send <em>all lead events</em> to it.</li>
                <li>Save the settings in Justdial and toggle the switch to active here.</li>
                <li><em>Justdial will instantly push new leads to this CRM in real-time.</em></li>
              </ol>
            )}

            {guideOpen === "meta" && (
              <ol className="list-decimal pl-5 space-y-3">
                <li>Click the <strong>Connect Facebook Account</strong> button (Feature coming soon).</li>
                <li>Authorize the application to access your Facebook profile.</li>
                <li>Select the specific <strong>Facebook Page(s)</strong> you are running Lead Generation Ads for.</li>
                <li>Choose the specific <strong>Lead Forms</strong> you want to sync.</li>
                <li><em>Once connected, whenever a user submits a lead form on Facebook or Instagram, it will instantly appear in your CRM Pipeline.</em></li>
                <li className="text-xs text-slate-500 mt-2 list-none bg-slate-50 p-2 rounded">Note: Ensure your Facebook account has Admin access to the selected page.</li>
              </ol>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setGuideOpen(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

code = code.replace(/<\/div>\s*<\/Tabs>\s*<\/div>\s*\);\s*}/, '      </div>\n      </Tabs>\n' + dialogJSX + '\n}');

// 5. Add Buttons to the cards

// IndiaMart Button
const imTitleRegex = /<CardTitle className="text-base flex items-center gap-2"><Phone className="w-5 h-5 text-orange-500" \/> IndiaMart Integration<\/CardTitle>/;
code = code.replace(imTitleRegex, `<CardTitle className="text-base flex items-center gap-2">
                    <Phone className="w-5 h-5 text-orange-500" /> IndiaMart Integration
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-orange-700 hover:text-orange-800 hover:bg-orange-100 px-2 mt-1" onClick={() => setGuideOpen("indiamart")}>
                    <BookOpen className="w-3 h-3 mr-1" /> How to integrate?
                  </Button>`);

// Justdial Button
const jdTitleRegex = /<CardTitle className="text-base flex items-center gap-2"><LinkIcon className="w-5 h-5 text-blue-500" \/> Justdial Webhook<\/CardTitle>/;
code = code.replace(jdTitleRegex, `<CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-blue-500" /> Justdial Webhook
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100 px-2 mt-1" onClick={() => setGuideOpen("justdial")}>
                    <BookOpen className="w-3 h-3 mr-1" /> Setup Guide
                  </Button>`);

// Meta Button
const metaTitleRegex = /<CardTitle className="text-base flex items-center gap-2"><Facebook className="w-5 h-5 text-indigo-600" \/> Meta \(Facebook\) Leads<\/CardTitle>/;
code = code.replace(metaTitleRegex, `<CardTitle className="text-base flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-indigo-600" /> Meta (Facebook) Leads
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100 px-2 mt-1" onClick={() => setGuideOpen("meta")}>
                    <BookOpen className="w-3 h-3 mr-1" /> Connection Guide
                  </Button>`);


fs.writeFileSync('src/pages/CrmIntegrationsPage.tsx', code);
console.log("Patched guides successfully");

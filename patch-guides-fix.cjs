const fs = require('fs');

let code = fs.readFileSync('src/pages/CrmIntegrationsPage.tsx', 'utf8');

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
`;

// Replace the end of the file
const target = `      </Tabs>\n    </div>\n  );\n}`;
const replacement = `      </Tabs>\n${dialogJSX}\n    </div>\n  );\n}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/CrmIntegrationsPage.tsx', code);
console.log("Appended Dialog successfully");

const fs = require('fs');

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
if (!appContent.includes('ComingSoonPage')) {
  appContent = appContent.replace(
    'const SettingsPage = lazy(() => import("./pages/SettingsPage"));',
    'const SettingsPage = lazy(() => import("./pages/SettingsPage"));\nconst ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));'
  );
  
  appContent = appContent.replace(
    '<Route path="/settings" element={<SettingsPage />} />',
    '<Route path="/settings" element={<SettingsPage />} />\n                <Route path="/feedback-assessment" element={<ComingSoonPage title="Feedback Assessment Form" />} />\n                <Route path="/ai-bi-report" element={<ComingSoonPage title="AI & Business Intelligence Report" />} />'
  );
  
  fs.writeFileSync('src/App.tsx', appContent, 'utf8');
  console.log("App.tsx patched");
}

// Patch AppSidebar.tsx
let sidebarContent = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');
if (!sidebarContent.includes('Feedback Assessment Form')) {
  sidebarContent = sidebarContent.replace(
    '} from "lucide-react";',
    '  ClipboardCheck,\n  BrainCircuit\n} from "lucide-react";'
  );
  
  const newItemHtml = `                    <SidebarMenuItem className="mt-2">
                      <SidebarMenuButton asChild isActive={isActive("/feedback-assessment")} tooltip={collapsed ? t("Feedback Assessment Form") : undefined}>
                        <NavLink
                          to="/feedback-assessment"
                          className="hover:bg-[#1e293b] hover:text-white rounded-lg transition-colors h-10 group/groupbtn"
                          activeClassName="bg-blue-600/10 text-blue-400 font-medium"
                        >
                          <ClipboardCheck className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100 shrink-0" />
                          {!collapsed && (
                            <span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2 pr-2 flex items-center justify-between">
                              {t("Feedback Assessment Form")}
                              <Lock className="h-3 w-3 text-amber-500" title="Coming Soon" />
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem className="mt-2 mb-2">
                      <SidebarMenuButton asChild isActive={isActive("/ai-bi-report")} tooltip={collapsed ? t("AI & BI Report") : undefined}>
                        <NavLink
                          to="/ai-bi-report"
                          className="hover:bg-[#1e293b] hover:text-white rounded-lg transition-colors h-10 group/groupbtn"
                          activeClassName="bg-blue-600/10 text-blue-400 font-medium"
                        >
                          <BrainCircuit className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100 shrink-0" />
                          {!collapsed && (
                            <span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2 pr-2 flex items-center justify-between">
                              {t("AI & BI Report")}
                              <Lock className="h-3 w-3 text-amber-500" title="Coming Soon" />
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem id="group-settings">`;
                    
  sidebarContent = sidebarContent.replace(
    '<SidebarMenuItem id="group-settings">',
    newItemHtml
  );
  
  fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebarContent, 'utf8');
  console.log("AppSidebar.tsx patched");
}

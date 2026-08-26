
const fs = require("fs");
let code = fs.readFileSync("src/pages/InvoiceBuilderPage.tsx", "utf8");

code = code.replace(
  `import { useAppStore } from "@/store/app-store";`,
  `import { useAppStore } from "@/store/app-store";\nimport { useSubscription } from "@/hooks/use-subscription";`
);

code = code.replace(
  `  const { org } = useAppStore();`,
  `  const { org } = useAppStore();\n  const { invoiceLimit } = useSubscription();`
);

code = code.replace(
  `const handleSave = async (status: "draft" | "sent" = "draft", postAction?: "email" | "whatsapp") => {
    if (!clientId) {`,
  `const handleSave = async (status: "draft" | "sent" = "draft", postAction?: "email" | "whatsapp") => {
    // Check invoice limit for new invoices
    if (!id && invoiceLimit) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org!.id)
        .gte("created_at", startOfMonth.toISOString());
        
      if (count !== null && count >= invoiceLimit) {
        toast({ title: "Plan Limit Reached", description: \`You have reached your limit of \${invoiceLimit} invoices this month. Please upgrade your plan.\`, variant: "destructive" });
        return;
      }
    }

    if (!clientId) {`
);

fs.writeFileSync("src/pages/InvoiceBuilderPage.tsx", code);


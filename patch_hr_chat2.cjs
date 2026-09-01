const fs = require('fs');
let code = fs.readFileSync('src/pages/AttendancePage.tsx', 'utf8');

const regex = /const \{ data \} = await \(supabase as any\)\s*\.from\("employees"\)\s*\.eq\("org_id", org\.id\)\s*\.eq\("auth_user_id", user\.id\)\s*\.single\(\);\s*setHrEmployee\(data \|\| null\);/;

const newStr = `let { data } = await (supabase as any)
          .from("employees")
          .eq("org_id", org.id)
          .eq("auth_user_id", user.id)
          .maybeSingle();
          
        if (!data) {
          const { data: newEmp } = await (supabase as any)
            .from("employees")
            .insert({
              org_id: org.id,
              auth_user_id: user.id,
              name: "HR Admin",
              designation: "HR Admin",
              email: user.email || "",
              monthly_salary: 0,
              paid_leaves_per_month: 0,
              is_active: true
            })
            .select()
            .single();
          data = newEmp;
        }
        
        setHrEmployee(data || null);`;

if (regex.test(code)) {
  code = code.replace(regex, newStr);
  fs.writeFileSync('src/pages/AttendancePage.tsx', code, 'utf8');
  console.log("Successfully patched AttendancePage.tsx");
} else {
  console.log("Could not find target string in AttendancePage.tsx");
}

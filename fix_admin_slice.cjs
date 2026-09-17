const fs = require('fs');

let c = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

// I will find the exact index of `// Fetch dashboard data` and `if (reqData) setFeatureRequests(reqData);`
const startStr = '// Fetch dashboard data';
const endStr = 'setFeatureRequests(reqData);';

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `// Fetch dashboard data
      const { data, error: rpcError } = await supabase.rpc("get_platform_dashboard_data");
      
      // Try direct select for all feature requests (including partner/support)
      let allReqs: any[] = [];
      const { data: directReqData, error: directErr } = await supabase
        .from("feature_requests")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (directReqData && !directErr) {
        allReqs = directReqData;
      } else {
        const { data: reqData } = await supabase.rpc("get_all_feature_requests");
        if (reqData) allReqs = reqData;
      }

      if (rpcError) {
        console.error("Error fetching dashboard data:", rpcError);
        setError(rpcError.message);
        setLoading(false);
        return;
      }
      
      setDashData(data as unknown as DashboardData);
      setFeatureRequests(allReqs);`;

  c = c.slice(0, startIndex) + replacement + c.slice(endIndex + endStr.length);
  fs.writeFileSync('src/pages/PlatformAdminPage.tsx', c);
  console.log('Replaced by slice successfully!');
} else {
  console.log('Could not find indices!');
}

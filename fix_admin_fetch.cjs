const fs = require('fs');

let c = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

const oldFetch = `      // Fetch dashboard data
      const { data, error: rpcError } = await supabase.rpc("get_platform_dashboard_data");
      
      // Fetch feature requests
      const { data: reqData, error: reqError } = await supabase.rpc("get_all_feature_requests");

      if (rpcError) {
        console.error("Error fetching dashboard data:", rpcError);
        setError(rpcError.message);
        setLoading(false);
        return;
      }
      
      setDashData(data as unknown as DashboardData);
      if (reqData) setFeatureRequests(reqData);`;

const newFetch = `      // Fetch dashboard data
      const { data, error: rpcError } = await supabase.rpc("get_platform_dashboard_data");
      
      // Fetch feature requests directly (fallback to RPC)
      let allReqs = [];
      const { data: directReqs, error: directErr } = await supabase
        .from("feature_requests")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (directReqs && !directErr) {
        allReqs = directReqs;
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

if (c.includes('// Fetch feature requests')) {
  c = c.replace(oldFetch, newFetch);
  fs.writeFileSync('src/pages/PlatformAdminPage.tsx', c);
  console.log('Replaced successfully');
} else {
  console.log('Could not find the block');
}

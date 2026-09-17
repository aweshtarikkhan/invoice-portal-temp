const fs = require('fs');

let c = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

const fetchLogic = `      // Fetch dashboard data
      const { data, error: rpcError } = await supabase.rpc("get_platform_dashboard_data");
      
      // Try direct select for all feature requests (including partner/support)
      let allReqs = [];
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

c = c.replace(/      \/\/ Fetch dashboard data[\s\S]*?if \(reqData\) setFeatureRequests\(reqData\);/m, fetchLogic);

// Also fix `dashData?.recentUsers` to use `dashData?.users`
c = c.replace(/dashData\?\.recentUsers/g, 'dashData?.users');

fs.writeFileSync('src/pages/PlatformAdminPage.tsx', c);
console.log('Fixed feature requests fetch and recentUsers in PlatformAdminPage');

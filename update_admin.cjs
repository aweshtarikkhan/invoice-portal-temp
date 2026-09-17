const fs = require('fs');

let c = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

// 1. Add Data Tab Trigger
const triggerAnchor = '<TabsTrigger value="requests"';
const dataTrigger = `<TabsTrigger value="data" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-slate-800">
              <Database className="w-4 h-4 mr-2" /> Form Data
            </TabsTrigger>
            `;
if (!c.includes('value="data"')) {
  c = c.replace(triggerAnchor, dataTrigger + triggerAnchor);
}

// 2. Add Data Tab Content
const contentAnchor = '<TabsContent value="requests"';
const dataContent = `<TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xl flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Submitted Form Data
              </CardTitle>
              <CardDescription>View signups, partnership requests, and support queries from the website.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="signups" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="bg-slate-100">
                    <TabsTrigger value="signups">Recent Sign Ups</TabsTrigger>
                    <TabsTrigger value="partners">Partner With Us</TabsTrigger>
                    <TabsTrigger value="support">Help & Support</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="signups" className="p-6">
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>User Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashData?.recentUsers?.map((user: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-100">{user.role}</Badge>
                            </TableCell>
                            <TableCell className="text-slate-500">{new Date(user.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {!dashData?.recentUsers?.length && (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-slate-500">No signups found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="partners" className="p-6">
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureRequests.filter((r: any) => r.request_type === 'partner_request').map((req: any, idx: number) => {
                          let payload: any = {};
                          try { payload = JSON.parse(req.message || '{}'); } catch(e){}
                          return (
                            <TableRow key={idx}>
                              <TableCell className="whitespace-nowrap text-slate-500">{new Date(req.created_at).toLocaleString()}</TableCell>
                              <TableCell className="font-medium">{payload.name || '-'}</TableCell>
                              <TableCell>
                                <div className="text-sm">{payload.email}</div>
                                <div className="text-sm text-slate-500">{payload.mobile}</div>
                              </TableCell>
                              <TableCell>{payload.company || '-'}</TableCell>
                              <TableCell className="max-w-[300px]">
                                <div className="truncate" title={payload.message}>{payload.message || req.message}</div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {!featureRequests.find((r: any) => r.request_type === 'partner_request') && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-slate-500">No partner requests yet.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="support" className="p-6">
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Contact Info</TableHead>
                          <TableHead>Category / Subject</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureRequests.filter((r: any) => r.request_type === 'support_request').map((req: any, idx: number) => {
                          let payload: any = {};
                          try { payload = JSON.parse(req.message || '{}'); } catch(e){}
                          return (
                            <TableRow key={idx}>
                              <TableCell className="whitespace-nowrap text-slate-500">{new Date(req.created_at).toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="font-medium">{payload.name || '-'}</div>
                                <div className="text-sm text-slate-500">{payload.email}</div>
                                <div className="text-sm text-slate-500">{payload.phone}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className="mb-1">{payload.category || '-'}</Badge>
                                <div className="text-sm font-medium">{payload.subject || '-'}</div>
                              </TableCell>
                              <TableCell className="max-w-[300px]">
                                <div className="truncate" title={payload.message}>{payload.message || req.message}</div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {!featureRequests.find((r: any) => r.request_type === 'support_request') && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-slate-500">No support requests yet.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>\n\n        `;

if (!c.includes('<TabsContent value="data"')) {
  c = c.replace(contentAnchor, dataContent + contentAnchor);
}

// Import Database icon if missing
if (!c.includes('Database')) {
  c = c.replace('BarChart3,', 'BarChart3, Database,');
}

fs.writeFileSync('src/pages/PlatformAdminPage.tsx', c);
console.log('PlatformAdminPage updated');

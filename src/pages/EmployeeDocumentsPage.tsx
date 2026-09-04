import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Download, FileText, Eye, ExternalLink, FileCheck } from "lucide-react";
import { format, parseISO } from "date-fns";

const DOC_TYPES = ["Aadhaar", "PAN", "Offer Letter", "Appointment Letter", "Salary Slip", "Bank Proof", "Resume", "Other"];

const isImage = (name?: string) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name || "");
const isPdf = (name?: string) => /\.pdf$/i.test(name || "");

export default function EmployeeDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<string>(id || "");
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("Other");
  const [file, setFile] = useState<File | null>(null);

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>("");
  const [viewerLoading, setViewerLoading] = useState(false);

  useEffect(() => {
    if (!org?.id) return;
    (supabase as any).from("employees").select("id,name").eq("org_id", org.id).order("name").then(({ data }: any) => {
      setEmployees(data || []);
      if (!employeeId && data?.[0]?.id) setEmployeeId(data[0].id);
    });
  }, [org?.id]);

  const load = async () => {
    if (!employeeId) { setDocs([]); return; }
    const { data, error } = await (supabase as any).from("employee_documents").select("*").eq("employee_id", employeeId).order("uploaded_at", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setDocs(data || []);
  };
  useEffect(() => { load(); }, [employeeId]);

  const upload = async () => {
    if (!org?.id || !employeeId || !file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${org.id}/${employeeId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("employee-documents").upload(path, file);
    if (upErr) { setUploading(false); toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); return; }
    const { error } = await (supabase as any).from("employee_documents").insert({
      org_id: org.id, employee_id: employeeId, doc_type: docType, file_path: path, file_name: file.name,
    });
    setUploading(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { setOpen(false); setFile(null); setDocType("Other"); load(); toast({ title: "Uploaded" }); }
  };

  const getDocUrl = async (filePath: string) => {
    if (!filePath) return "";
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }
    try {
      const { data } = await supabase.storage.from("employee-documents").createSignedUrl(filePath, 3600);
      if (data?.signedUrl) return data.signedUrl;
    } catch (e) {
      console.warn("createSignedUrl error, falling back to public url:", e);
    }
    const { data: pubData } = supabase.storage.from("employee-documents").getPublicUrl(filePath);
    return pubData?.publicUrl || "";
  };

  const viewDocument = async (d: any) => {
    setViewerDoc(d);
    setViewerLoading(true);
    const url = await getDocUrl(d.file_path);
    setViewerUrl(url);
    setViewerLoading(false);
  };

  const openDocument = async (d: any) => {
    const url = await getDocUrl(d.file_path);
    if (!url) { toast({ title: "Failed to open document", variant: "destructive" }); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadDocument = async (d: any) => {
    try {
      const url = await getDocUrl(d.file_path);
      if (!url) throw new Error("Could not retrieve file URL");
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = d.file_name || "document";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch (e) {
      console.warn("Direct blob download failed, falling back to window.open", e);
    }
    const fallbackUrl = await getDocUrl(d.file_path);
    if (fallbackUrl) {
      window.open(fallbackUrl, "_blank");
    }
  };

  const remove = async (d: any) => {
    if (!confirm(`Are you sure you want to delete "${d.file_name}"?`)) return;
    await supabase.storage.from("employee-documents").remove([d.file_path]);
    await (supabase as any).from("employee_documents").delete().eq("id", d.id);
    load();
    toast({ title: "Document deleted" });
  };

  const selectedEmployeeName = employees.find(e => e.id === employeeId)?.name;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Employee Documents</h1>
          <p className="text-sm text-muted-foreground">Securely store, view, and download ID proofs, offer letters, and salary slips.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => setOpen(true)} disabled={!employeeId}>
            <Upload className="h-4 w-4 mr-2" />Upload Document
          </Button>
          <Button variant="outline" onClick={() => navigate("/employees")}>Back</Button>
        </div>
      </div>

      <Card className="border-gray-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <div className="font-medium">No documents uploaded for {selectedEmployeeName || "this employee"}.</div>
              <p className="text-xs text-muted-foreground">Click "Upload Document" to upload identity proofs, offer letters, or other records.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="w-36">Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead className="w-48">Uploaded At</TableHead>
                  <TableHead className="text-right w-44">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => {
                  const isImg = isImage(d.file_name);
                  const isPdfFile = isPdf(d.file_name);
                  return (
                    <TableRow key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50">
                      <TableCell>
                        <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                          {d.doc_type || "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                          {isImg ? (
                            <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          ) : isPdfFile ? (
                            <FileText className="h-4 w-4 text-rose-600 flex-shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="truncate max-w-md" title={d.file_name}>{d.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {d.uploaded_at ? format(parseISO(d.uploaded_at), "dd MMM yyyy, hh:mm a") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewDocument(d)} 
                            title="View / Preview Document" 
                            className="h-8 px-2 text-xs flex items-center gap-1 hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openDocument(d)} 
                            title="Open in New Tab" 
                            className="h-8 px-2 text-xs flex items-center gap-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => downloadDocument(d)} 
                            title="Download Document" 
                            className="h-8 px-2 text-xs flex items-center gap-1 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(d)} 
                            title="Delete Document" 
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select File (Images, PDF, Docs)</Label>
              <Input 
                type="file" 
                className="mt-1" 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 10 * 1024 * 1024) {
                      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
                      e.target.value = "";
                      setFile(null);
                    } else {
                      setFile(f);
                    }
                  } else {
                    setFile(null);
                  }
                }} 
              />
              <p className="text-[11px] text-muted-foreground mt-1">Supports PDF, JPG, PNG, WEBP, DOC up to 10MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={upload} disabled={uploading || !file}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Preview Modal */}
      <Dialog open={!!viewerDoc} onOpenChange={(isOpen) => { if (!isOpen) { setViewerDoc(null); setViewerUrl(""); } }}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
            <div>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="truncate max-w-sm sm:max-w-md" title={viewerDoc?.file_name}>
                  {viewerDoc?.file_name}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {viewerDoc?.doc_type || "Document"}
                </Badge>
                {viewerDoc?.uploaded_at && (
                  <span>Uploaded {format(parseISO(viewerDoc.uploaded_at), "dd MMM yyyy, hh:mm a")}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button size="sm" variant="outline" onClick={() => openDocument(viewerDoc)} className="h-8 gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadDocument(viewerDoc)} className="h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-[450px] bg-slate-50 dark:bg-slate-900 rounded-lg mt-3">
            {viewerLoading ? (
              <div className="text-center text-muted-foreground">Loading preview…</div>
            ) : !viewerUrl ? (
              <div className="text-center text-muted-foreground">Could not load document preview.</div>
            ) : isImage(viewerDoc?.file_name) ? (
              <img 
                src={viewerUrl} 
                alt={viewerDoc?.file_name} 
                className="max-h-[65vh] max-w-full object-contain rounded shadow" 
              />
            ) : isPdf(viewerDoc?.file_name) ? (
              <iframe 
                src={viewerUrl} 
                title={viewerDoc?.file_name} 
                className="w-full h-[65vh] rounded border-0" 
              />
            ) : (
              <div className="text-center space-y-3 p-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <div className="font-semibold text-base text-gray-900 dark:text-white">{viewerDoc?.file_name}</div>
                <p className="text-xs text-muted-foreground">Preview not directly available in browser for this file format.</p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" onClick={() => openDocument(viewerDoc)}>
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Open File
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadDocument(viewerDoc)}>
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

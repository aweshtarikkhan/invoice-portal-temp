import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "react-router-dom";

export default function CRMTeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const org = useAppStore((state) => state.organization);
  const { toast } = useToast();
  
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Sales Executive",
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setIsDialogOpen(true);
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  const fetchTeam = async () => {
    if (!org?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("crm_team")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setTeam(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching CRM team", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [org?.id]);

  const handleSave = async () => {
    if (!org?.id || !formData.name) return;
    try {
      setSaving(true);
      if (editingId) {
        const { error } = await supabase
          .from("crm_team")
          .update(formData)
          .eq("id", editingId)
          .eq("org_id", org.id);
        if (error) throw error;
        toast({ title: "Updated successfully" });
      } else {
        const { error } = await supabase
          .from("crm_team")
          .insert({
            ...formData,
            org_id: org.id
          });
        if (error) throw error;
        toast({ title: "Added successfully" });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchTeam();
    } catch (error: any) {
      toast({ title: "Error saving executive", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this executive?")) return;
    try {
      const { error } = await supabase
        .from("crm_team")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted successfully" });
      fetchTeam();
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", role: "Sales Executive", is_active: true });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (member: any) => {
    setFormData({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "Sales Executive",
      is_active: member.is_active
    });
    setEditingId(member.id);
    setIsDialogOpen(true);
  };

  const filteredTeam = team.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
    (t.phone && t.phone.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Team</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage your CRM executives and sales representatives.</p>
            </div>
            <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Executive
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50/50 dark:bg-slate-800/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredTeam.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        No team members found. Click "Add Executive" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeam.map((member) => (
                      <TableRow key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm text-slate-500 dark:text-slate-400">
                            <span>{member.email || '-'}</span>
                            <span>{member.phone || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.is_active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(member)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(member.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Executive" : "Add Executive"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Sales Executive"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            {editingId && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="isActive">Active Status</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

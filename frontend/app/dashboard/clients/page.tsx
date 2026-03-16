"use client";

import { useEffect, useState } from "react";
import { clientAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Search, MoreHorizontal, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const emptyForm = {
  name: "", company: "", email: "", phone: "", projectType: "", budget: "", notes: "",
};

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const res = await clientAPI.list(search ? { search } : {});
      setClients(res.data.clients);
    } catch {
      toast({ title: "Failed to load clients", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  function openNew() {
    setEditingClient(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  }

  function openEdit(client: any) {
    setEditingClient(client);
    setForm({
      name: client.name || "",
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      projectType: client.projectType || "",
      budget: client.budget || "",
      notes: client.notes || "",
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.company) {
      toast({ title: "Name, company, and email are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (editingClient) {
        await clientAPI.update(editingClient.id, form);
        toast({ title: "Client updated." });
      } else {
        await clientAPI.create(form);
        toast({ title: "Client added." });
      }
      setIsDialogOpen(false);
      load();
    } catch (err: any) {
      toast({ title: err.response?.data?.error || "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    try {
      await clientAPI.delete(id);
      toast({ title: "Client deleted." });
      load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Clients</h2>
          <p className="text-sm text-muted-foreground">{clients.length} clients</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium mb-1">No clients yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first client to streamline proposal creation.
          </p>
          <Button onClick={openNew} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{client.company}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(client)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(client.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{client.email}</p>
                {client.projectType && (
                  <Badge variant="secondary" className="text-xs">{client.projectType}</Badge>
                )}
                {client.budget && (
                  <p className="text-muted-foreground">Budget: {client.budget}</p>
                )}
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {client._count?.proposals || 0} proposals
                  </span>
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                    <Link href={`/dashboard/proposals/generate?clientId=${client.id}`}>
                      New Proposal
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Company *</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="mt-1"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
                placeholder="john@acme.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Project Type</Label>
                <Input
                  value={form.projectType}
                  onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                  className="mt-1"
                  placeholder="Web Development"
                />
              </div>
            </div>
            <div>
              <Label>Budget</Label>
              <Input
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="mt-1"
                placeholder="$5,000–$10,000"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 min-h-[80px]"
                placeholder="Any notes about this client..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingClient ? "Save Changes" : "Add Client"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { proposalAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, Share2, Copy, Check, Loader2, Save, Trash2, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";

const SECTIONS = [
  { key: "projectOverview", label: "Project Overview" },
  { key: "scopeOfWork", label: "Scope of Work" },
  { key: "deliverables", label: "Deliverables" },
  { key: "timeline", label: "Timeline" },
  { key: "pricing", label: "Pricing Breakdown" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "closingStatement", label: "Closing Statement" },
];

const STATUS_OPTIONS = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "ARCHIVED"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-orange-100 text-orange-700",
};

export default function ProposalEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    proposalAPI
      .get(id as string)
      .then((res) => {
        setProposal(res.data.proposal);
        const initial: Record<string, string> = { title: res.data.proposal.title };
        SECTIONS.forEach((s) => { initial[s.key] = res.data.proposal[s.key] || ""; });
        setEdits(initial);
      })
      .catch(() => router.push("/dashboard/proposals"))
      .finally(() => setIsLoading(false));
  }, [id]);

  function handleEdit(key: string, value: string) {
    setEdits((e) => ({ ...e, [key]: value }));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await proposalAPI.update(id as string, edits);
      setProposal(res.data.proposal);
      setIsDirty(false);
      toast({ title: "Saved!", description: "Proposal updated successfully." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await proposalAPI.update(id as string, { status });
      setProposal((p: any) => ({ ...p, status }));
      toast({ title: `Status updated to ${status}` });
    } catch {
      toast({ title: "Status update failed", variant: "destructive" });
    }
  }

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const res = await proposalAPI.downloadPDF(id as string);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposal-${proposal?.title || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF download failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleToggleShare() {
    try {
      const res = await proposalAPI.toggleShare(id as string);
      setProposal((p: any) => ({ ...p, isPublic: res.data.isPublic }));
      toast({
        title: res.data.isPublic ? "Sharing enabled" : "Sharing disabled",
        description: res.data.isPublic ? "Public link created." : undefined,
      });
    } catch {
      toast({ title: "Share toggle failed", variant: "destructive" });
    }
  }

  async function copyShareLink() {
    if (!proposal?.shareToken) return;
    const url = `${window.location.origin}/share/${proposal.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard!" });
  }

  async function handleDelete() {
    if (!confirm("Delete this proposal? This cannot be undone.")) return;
    try {
      await proposalAPI.delete(id as string);
      toast({ title: "Proposal deleted." });
      router.push("/dashboard/proposals");
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/proposals">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <Input
            value={edits.title || ""}
            onChange={(e) => handleEdit("title", e.target.value)}
            className="text-lg font-semibold border-transparent hover:border-border focus:border-border bg-transparent px-2 h-9"
          />
          {proposal?.client && (
            <p className="text-xs text-muted-foreground px-2 mt-0.5">
              {proposal.client.name} — {proposal.client.company}
            </p>
          )}
        </div>

        <Select value={proposal?.status} onValueChange={handleStatusChange}>
          <SelectTrigger className={`w-32 h-8 text-xs ${STATUS_COLORS[proposal?.status] || ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
              Save
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Download className="w-3 h-3" />}
          </Button>
          <Button
            variant={proposal?.isPublic ? "default" : "outline"}
            size="sm"
            onClick={handleToggleShare}
          >
            <Share2 className="w-3 h-3 mr-1" />
            {proposal?.isPublic ? "Shared" : "Share"}
          </Button>
          {proposal?.isPublic && (
            <Button variant="ghost" size="sm" onClick={copyShareLink}>
              {copied
                ? <Check className="w-3 h-3 text-green-600" />
                : <Copy className="w-3 h-3" />}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground border-b pb-4 flex-wrap">
        {proposal?.createdAt && (
          <span>Created {format(new Date(proposal.createdAt), "MMM d, yyyy")}</span>
        )}
        {proposal?.aiModel && <span>Model: {proposal.aiModel}</span>}
        {proposal?.tokensUsed && <span>{proposal.tokensUsed} tokens</span>}
        <Badge variant="outline" className="text-xs">{proposal?.template}</Badge>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {SECTIONS.map((section, idx) => (
          <Card key={section.key} className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                {idx + 1}
              </span>
              <h3 className="text-sm font-semibold">{section.label}</h3>
            </div>
            <CardContent className="p-0">
              <Textarea
                value={edits[section.key] || ""}
                onChange={(e) => handleEdit(section.key, e.target.value)}
                className="border-0 rounded-none focus-visible:ring-0 min-h-[160px] resize-none text-sm leading-relaxed p-4"
                placeholder={`Enter ${section.label.toLowerCase()}...`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky bottom-6 flex justify-center">
          <div className="bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-full">
              {isSaving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { proposalAPI, clientAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, ChevronRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  { value: "WEB_DEVELOPMENT", label: "Web Development", desc: "Full-stack, frontend, CMS" },
  { value: "MOBILE_APP", label: "Mobile App", desc: "iOS, Android, cross-platform" },
  { value: "MARKETING_CAMPAIGN", label: "Marketing", desc: "Social, content, ads, SEO" },
  { value: "SAAS_DEVELOPMENT", label: "SaaS", desc: "Cloud platforms, APIs" },
  { value: "UI_UX_DESIGN", label: "UI/UX Design", desc: "Research, wireframes, systems" },
  { value: "CUSTOM", label: "Custom / Other", desc: "Any type of project" },
];

const PROJECT_TYPES = [
  "Website Redesign", "Web Application", "Mobile App", "E-commerce Store",
  "Marketing Campaign", "Brand Identity", "SEO Strategy", "SaaS Platform",
  "API Development", "UX Audit", "Other",
];

export default function GenerateProposalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("CUSTOM");
  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    company: "",
    projectDescription: "",
    projectType: "",
    timeline: "",
    estimatedBudget: "",
    additionalNotes: "",
    title: "",
  });

  useEffect(() => {
    clientAPI.list().then((res) => setClients(res.data.clients)).catch(() => {});
  }, []);

  function handleClientSelect(clientId: string) {
    if (clientId === "manual") {
      setForm((f) => ({ ...f, clientId: "", clientName: "", company: "" }));
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((f) => ({ ...f, clientId, clientName: client.name, company: client.company }));
    }
  }

  async function handleGenerate() {
    if (!form.clientName || !form.projectDescription) {
      toast({
        title: "Missing required fields",
        description: "Client name and project description are required.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const res = await proposalAPI.generate({ ...form, template: selectedTemplate });
      toast({ title: "Proposal generated!", description: "Your proposal is ready to review." });
      router.push(`/dashboard/proposals/${res.data.proposal.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Generation failed. Please try again.";
      if (err.response?.data?.code === "USAGE_LIMIT_EXCEEDED") {
        toast({ title: "Usage limit reached", description: "Upgrade your plan to continue.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Generate Proposal</h2>
        <p className="text-muted-foreground mt-1">
          Fill in the project details and AI will craft a professional proposal in seconds.
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Proposal Template</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedTemplate(t.value)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                selectedTemplate === t.value
                  ? "border-primary bg-accent ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
          <CardDescription>Select an existing client or enter details manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clients.length > 0 && (
            <div>
              <Label>Select Existing Client</Label>
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose from your clients..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter manually</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input id="clientName" {...field("clientName")} placeholder="John Smith" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...field("company")} placeholder="Acme Corp" className="mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
          <CardDescription>The more detail you provide, the better your proposal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Proposal Title</Label>
            <Input
              id="title"
              {...field("title")}
              placeholder="e.g. Website Redesign for Acme Corp"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="projectDescription">Project Description *</Label>
            <Textarea
              id="projectDescription"
              {...field("projectDescription")}
              placeholder="Describe the project goals, target audience, key requirements, and any specific challenges..."
              className="mt-1.5 min-h-[120px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project Type</Label>
              <Select onValueChange={(v) => setForm((f) => ({ ...f, projectType: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                {...field("timeline")}
                placeholder="e.g. 8 weeks, 3 months"
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="estimatedBudget">Estimated Budget</Label>
            <Input
              id="estimatedBudget"
              {...field("estimatedBudget")}
              placeholder="e.g. $5,000–$10,000"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              {...field("additionalNotes")}
              placeholder="Any other context, special requirements, or notes..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-accent border border-primary/20">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          The AI will generate a full 7-section proposal including scope, deliverables, timeline, and
          pricing. You can edit every section after generation.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Proposal
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

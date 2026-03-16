"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { proposalAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const SECTIONS = [
  { key: "projectOverview", label: "Project Overview" },
  { key: "scopeOfWork", label: "Scope of Work" },
  { key: "deliverables", label: "Deliverables" },
  { key: "timeline", label: "Timeline" },
  { key: "pricing", label: "Pricing Breakdown" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "closingStatement", label: "Closing Statement" },
];

export default function SharePage() {
  const { token } = useParams();
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    proposalAPI.getShared(token as string)
      .then((res) => setProposal(res.data.proposal))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Proposal not found</h1>
        <p className="text-muted-foreground">This link may have expired or been disabled.</p>
        <Button asChild variant="outline">
          <Link href="/">Go to ProposalAI</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">ProposalAI</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Create Your Own</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Proposal */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Cover */}
        <div className="bg-white rounded-2xl shadow-sm border p-10 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
              <p className="text-muted-foreground">
                Prepared by {proposal.user?.name}
              </p>
            </div>
            <Badge variant="outline">{format(new Date(proposal.createdAt), "MMMM d, yyyy")}</Badge>
          </div>

          {proposal.client && (
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Prepared For
              </p>
              <p className="font-semibold text-lg">{proposal.client.name}</p>
              <p className="text-muted-foreground">{proposal.client.company}</p>
            </div>
          )}
        </div>

        {/* Sections */}
        {SECTIONS.map((section, idx) => {
          const content = proposal[section.key];
          if (!content) return null;

          return (
            <div key={section.key} className="bg-white rounded-2xl shadow-sm border p-8 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {idx + 1}
                </div>
                <h2 className="text-xl font-semibold">{section.label}</h2>
              </div>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                {content}
              </div>
            </div>
          );
        })}

        {/* Footer CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-white mt-8">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Create Professional Proposals in Seconds</h3>
          <p className="opacity-80 mb-4">Join thousands of freelancers and agencies using ProposalAI</p>
          <Button asChild variant="secondary" size="lg">
            <Link href="/signup">Start Free — No Credit Card</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

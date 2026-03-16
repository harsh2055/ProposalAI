"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { proposalAPI, subscriptionAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Users, Zap, TrendingUp, Clock,
  CheckCircle, ArrowRight, Plus,
} from "lucide-react";
import { format } from "date-fns";

interface Stats {
  totalProposals: number;
  proposalsThisMonth: number;
  clientCount: number;
  byStatus: Record<string, number>;
}

interface UsageSummary {
  plan: string;
  used: number;
  limit: number | null;
  unlimited: boolean;
  remaining: number | null;
  percentage: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-orange-100 text-orange-700",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [recentProposals, setRecentProposals] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      proposalAPI.getStats(),
      subscriptionAPI.getUsage(),
      proposalAPI.list({ limit: "5" }),
    ])
      .then(([statsRes, usageRes, proposalsRes]) => {
        setStats(statsRes.data);
        setUsage(usageRes.data);
        setRecentProposals(proposalsRes.data.proposals);
      })
      .catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your proposals today.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/proposals/generate">
            <Zap className="w-4 h-4 mr-2" />
            Generate Proposal
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Proposals", value: stats?.totalProposals, sub: "All time", icon: FileText },
          { title: "This Month", value: stats?.proposalsThisMonth, sub: "Generated", icon: TrendingUp },
          { title: "Clients", value: stats?.clientCount, sub: "Active", icon: Users },
          { title: "Accepted", value: stats?.byStatus?.ACCEPTED ?? 0, sub: "Won proposals", icon: CheckCircle },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Proposals */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Proposals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/proposals">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProposals.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No proposals yet.</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/dashboard/proposals/generate">
                    <Plus className="w-4 h-4 mr-1" /> Create your first
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProposals.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/proposals/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {p.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.client?.company || "No client"} •{" "}
                        {format(new Date(p.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ${STATUS_COLORS[p.status] || ""}`}
                      variant="secondary"
                    >
                      {p.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar widgets */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usage ? (
                <>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Proposals</span>
                      <span className="font-medium">
                        {usage.used}
                        {!usage.unlimited && ` / ${usage.limit}`}
                        {usage.unlimited && " (unlimited)"}
                      </span>
                    </div>
                    {!usage.unlimited && (
                      <Progress value={usage.percentage} className="h-2" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {usage.plan} Plan
                    </Badge>
                    {usage.plan === "FREE" && (
                      <Button size="sm" asChild>
                        <Link href="/dashboard/pricing">Upgrade</Link>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-16 animate-pulse bg-muted rounded" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "New Proposal", href: "/dashboard/proposals/generate", icon: Zap },
                { label: "Add Client", href: "/dashboard/clients", icon: Users },
                { label: "View History", href: "/dashboard/proposals", icon: Clock },
              ].map((action) => (
                <Button
                  key={action.href}
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                  asChild
                >
                  <Link href={action.href}>
                    <action.icon className="w-4 h-4 mr-2 text-primary" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

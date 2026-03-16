"use client";

import { useState, useEffect } from "react";
import { subscriptionAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ExternalLink, Sparkles, Zap, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const PLAN_ICONS: Record<string, React.ElementType> = {
  FREE: Sparkles,
  PRO: Zap,
  AGENCY: Building2,
};

export default function PricingPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [usage, setUsage] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const currentPlan = user?.subscription?.plan || "FREE";

  useEffect(() => {
    Promise.all([subscriptionAPI.getPlans(), subscriptionAPI.getUsage()])
      .then(([plansRes, usageRes]) => {
        setPlans(plansRes.data.plans);
        setUsage(usageRes.data);
      })
      .catch(() => {});
  }, []);

  async function handleUpgrade(plan: string) {
    setLoadingPlan(plan);
    try {
      const res = await subscriptionAPI.createCheckout(plan);
      window.location.href = res.data.url;
    } catch {
      toast({ title: "Checkout failed. Please try again.", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleBillingPortal() {
    try {
      const res = await subscriptionAPI.getBillingPortal();
      window.open(res.data.url, "_blank");
    } catch {
      toast({ title: "Could not open billing portal", variant: "destructive" });
    }
  }

  const planList = Object.entries(plans);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Plans &amp; Billing</h2>
        <p className="text-muted-foreground mt-1">
          You&apos;re on the{" "}
          <Badge variant="outline" className="font-semibold">{currentPlan}</Badge> plan
          {usage && !usage.unlimited && ` · ${usage.used} of ${usage.limit} proposals used this month`}
        </p>
      </div>

      {planList.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {planList.map(([planKey, plan]) => {
            const Icon = PLAN_ICONS[planKey] || Sparkles;
            const isCurrent = currentPlan === planKey;
            const isPopular = planKey === "PRO";

            return (
              <Card
                key={planKey}
                className={`relative ${isPopular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features?.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : planKey === "FREE" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleUpgrade(planKey)}
                      disabled={loadingPlan === planKey}
                    >
                      {loadingPlan === planKey && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {currentPlan !== "FREE" && (
        <div className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Manage Subscription</p>
            <p className="text-sm text-muted-foreground">
              Update payment method, view invoices, or cancel your plan.
            </p>
          </div>
          <Button variant="outline" onClick={handleBillingPortal}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Billing Portal
          </Button>
        </div>
      )}
    </div>
  );
}

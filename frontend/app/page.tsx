import Link from "next/link";
import { Sparkles, Zap, FileText, Users, Check, ArrowRight, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">ProposalAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-accent border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by GPT-4o
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          Win more clients with
          <br />
          <span className="text-primary">AI-written proposals</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Generate professional, tailored proposals in seconds. 
          Stop spending hours writing and start closing more deals.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="border border-border px-6 py-3 rounded-xl hover:bg-muted/50 transition-colors font-medium text-sm"
          >
            Sign In
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Free plan includes 5 proposals/month. No credit card.</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Generate in Seconds",
              desc: "Fill in project details, get a complete 7-section proposal with overview, scope, pricing, and terms.",
            },
            {
              icon: FileText,
              title: "PDF Export & Sharing",
              desc: "Download professional PDFs or share via public link directly with your clients.",
            },
            {
              icon: Users,
              title: "Client Management",
              desc: "Organize clients, track proposals, and manage your entire sales pipeline in one place.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-card border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
        <p className="text-muted-foreground mb-10">Start free, scale as you grow.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Free", price: "$0", proposals: "5/month", cta: "Start Free" },
            { name: "Pro", price: "$29/mo", proposals: "100/month", cta: "Upgrade to Pro", popular: true },
            { name: "Agency", price: "$99/mo", proposals: "Unlimited", cta: "Upgrade to Agency" },
          ].map((p) => (
            <div
              key={p.name}
              className={`border rounded-xl p-6 ${p.popular ? "border-primary ring-1 ring-primary" : ""}`}
            >
              {p.popular && (
                <div className="text-xs font-semibold text-primary mb-2">MOST POPULAR</div>
              )}
              <div className="text-xl font-bold mb-1">{p.name}</div>
              <div className="text-3xl font-bold mb-3">{p.price}</div>
              <div className="text-sm text-muted-foreground mb-4">{p.proposals}</div>
              <Link
                href="/signup"
                className={`block text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                  p.popular
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "border border-border hover:bg-muted/50"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ProposalAI. Built with Next.js & OpenAI.</p>
      </footer>
    </div>
  );
}

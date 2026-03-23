"use client";

import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Demo",
    description: "Best for hackathon review and first walkthroughs",
    price: { monthly: 0, annual: 0 },
    features: [
      "Mock inbox with 6 threads",
      "3-bullet AI summaries",
      "Priority classification",
      "Reply, task, and event generation",
      "No live mailbox required",
    ],
    cta: "Explore demo flow",
    popular: false,
  },
  {
    name: "Workspace",
    description: "For connected Gmail and Calendar workflows",
    price: { monthly: null, annual: null },
    features: [
      "Google sign-in flow",
      "Gmail and Calendar scopes",
      "Live inbox review experience",
      "Editable AI actions",
      "Approve, discard, regenerate",
      "Thread-based operator workflow",
      "Ready for further extension",
    ],
    cta: "Connect workflow",
    popular: true,
  },
  {
    name: "Extension",
    description: "For teams building beyond the MVP",
    price: { monthly: null, annual: null },
    features: [
      "Database persistence roadmap",
      "Provider integrations beyond Gmail",
      "Advanced analytics opportunities",
      "Multi-user collaboration",
      "Production deployment path",
      "API and workflow expansion",
      "Supabase schema groundwork",
      "Vercel deployment docs included",
    ],
    cta: "Plan next build",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Access modes
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            Product paths that
            <br />
            <span className="text-stroke">match the app</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            MailMate is presented here through real entry points: demo mode, Google-connected workspace mode, and the production extension path.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative p-8 lg:p-12 bg-background ${
                plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-foreground/10">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl lg:text-6xl text-foreground">
                      ${plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">setup</span>
                  </div>
                ) : (
                  <span className="font-display text-4xl text-foreground">Workflow</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                  plan.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Every card above maps to MailMate features that exist now or belong directly to its production roadmap.{" "}
          <a href="#features" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Review the feature map
          </a>
        </p>
      </div>
    </section>
  );
}

"use client";

import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Try the full AI experience with sample data",
    price: { monthly: 0, annual: 0 },
    features: [
      "Pre-loaded inbox with realistic threads",
      "AI thread summaries and priority tagging",
      "Smart reply drafts and writing tools",
      "Task extraction and deadline detection",
      "Meeting detection with calendar preview",
    ],
    cta: "Try free demo",
    popular: false,
  },
  {
    name: "Pro",
    description: "Connect your Gmail and work at full speed",
    price: { monthly: 12, annual: 9 },
    features: [
      "Live Gmail inbox with real-time sync",
      "Google Calendar integration",
      "Unlimited AI analyses per day",
      "One-click replies sent through Gmail",
      "AI chat assistant with full thread context",
      "Custom labels and inbox organization",
      "Priority support",
    ],
    cta: "Get started",
    popular: true,
  },
  {
    name: "Team",
    description: "For organizations managing high-volume email",
    price: { monthly: 29, annual: 22 },
    features: [
      "Everything in Pro",
      "Shared team inboxes and delegation",
      "Batch analysis across entire inbox",
      "Advanced analytics and response metrics",
      "Multi-provider support (Outlook, IMAP)",
      "SSO and admin controls",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-16 lg:py-20 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Pricing
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            Simple pricing.
            <br />
            <span className="text-stroke">No inbox surprises.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Start with the free demo, upgrade when you connect your Gmail. Cancel anytime — your data never leaves your browser.
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
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl lg:text-6xl text-foreground">
                    ${plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-muted-foreground">/mo</span>
                  )}
                  {plan.price.monthly === 0 && (
                    <span className="text-muted-foreground">forever</span>
                  )}
                </div>
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
          All plans include end-to-end encryption and zero server-side data storage.{" "}
          <a href="#security" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Learn about our trust model
          </a>
        </p>
      </div>
    </section>
  );
}

import Link from 'next/link'
import {
  ArrowRight, Brain, Calendar, ChevronRight, Clock, FileSearch,
  ListChecks, MessageSquare, Play, Shield, Sparkles, Tags, Zap
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'Auto Categorization',
    desc: 'Instantly sorts emails into Work, Personal, Finance, Updates, or Spam.',
    color: 'from-slate-100 to-white border-slate-200/80',
    iconColor: 'text-slate-700',
  },
  {
    icon: Zap,
    title: 'Smart Priority Inbox',
    desc: 'Classifies every thread as Urgent, Important, Normal, or Low Priority.',
    color: 'from-blue-50 to-white border-blue-200/70',
    iconColor: 'text-blue-700',
  },
  {
    icon: MessageSquare,
    title: 'One-Click Smart Replies',
    desc: 'AI generates context-aware responses you can refine and send immediately.',
    color: 'from-slate-50 to-white border-slate-200/70',
    iconColor: 'text-blue-700',
  },
  {
    icon: Sparkles,
    title: 'Context-Aware Drafts',
    desc: 'Full reply drafts that use thread history, sender context, and meeting intent.',
    color: 'from-blue-50 to-slate-50 border-blue-200/70',
    iconColor: 'text-slate-700',
  },
  {
    icon: Calendar,
    title: 'Calendar Sync',
    desc: 'Detects meetings and keeps Google Calendar available for quick approval.',
    color: 'from-emerald-50 to-white border-emerald-200/70',
    iconColor: 'text-emerald-700',
  },
  {
    icon: ListChecks,
    title: 'Task Extraction',
    desc: 'Converts action items into tasks with deadlines and clear follow-up signals.',
    color: 'from-slate-100 to-white border-slate-200/70',
    iconColor: 'text-slate-700',
  },
  {
    icon: Clock,
    title: 'Follow-Up Reminders',
    desc: 'Detects expected responses and surfaces when to follow up next.',
    color: 'from-blue-50 to-white border-blue-200/70',
    iconColor: 'text-blue-700',
  },
  {
    icon: FileSearch,
    title: 'Key Info Extraction',
    desc: 'Pulls out dates, links, contacts, and amounts from dense threads.',
    color: 'from-slate-50 to-white border-slate-200/70',
    iconColor: 'text-slate-700',
  },
  {
    icon: Tags,
    title: 'Auto Labeling',
    desc: 'Suggests labels for easier organization and faster inbox cleanup later.',
    color: 'from-blue-50 to-white border-blue-200/70',
    iconColor: 'text-blue-700',
  },
  {
    icon: Shield,
    title: 'Human Approval Layer',
    desc: 'AI prepares the next step, but you review and approve before execution.',
    color: 'from-slate-100 to-white border-slate-200/80',
    iconColor: 'text-slate-700',
  },
]

const steps = [
  { step: '01', label: 'Analyze', detail: 'AI reads the full thread and understands what is being asked.', icon: Brain },
  { step: '02', label: 'Extract', detail: 'Tasks, deadlines, meetings, and key details are prepared automatically.', icon: FileSearch },
  { step: '03', label: 'Draft', detail: 'MailMate writes the reply and builds the next action for approval.', icon: Sparkles },
  { step: '04', label: 'Execute', detail: 'You approve, edit, or ignore so the workflow stays under your control.', icon: Shield },
]

const trustSignals = [
  'Google sign-in with Gmail and Calendar access',
  'Human approval before every action',
  'Live inbox mode plus instant demo mode',
]

const heroStats = [
  { value: '3', label: 'agent actions prepared from a single thread' },
  { value: '<60s', label: 'to move from reading to decision-making' },
  { value: '1 click', label: 'to approve the next step after review' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f8fb_0%,#ffffff_28%,#f6f7f9_100%)]">
      <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="rounded-full text-sm text-gray-600 hover:text-gray-900">
              <Link href="/inbox">
                Open Inbox <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-gradient-to-r from-slate-900 to-blue-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-slate-950 hover:to-blue-900">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="animate-glow-pulse absolute -right-10 top-0 h-96 w-96 rounded-full bg-slate-200/60 blur-3xl" />
          <div className="animate-float-slow absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="animate-float-reverse absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-100/80 to-blue-50/30 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <Badge variant="outline" className="mb-8 inline-flex items-center gap-2 rounded-full border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Agentic inbox copilot
              <span className="h-1 w-1 rounded-full bg-blue-600" />
              <span className="text-blue-700">Built for Gmail + Calendar</span>
            </Badge>

            <h1 className="text-5xl font-bold leading-[1.02] tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
              Your inbox,
              <span className="block bg-gradient-to-r from-slate-900 via-slate-700 to-blue-700 bg-clip-text text-transparent">
                ready to act.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              MailMate reads the thread, prioritizes what matters, drafts the next step,
              and prepares tasks or calendar actions so you can approve outcomes instead of triaging messages.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-800 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:from-slate-950 hover:to-blue-900">
                <Link href="/auth/signin">
                  Connect Google Workspace <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md">
                <Link href="/inbox">
                  <Play className="h-4 w-4 fill-current" /> Explore demo inbox
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {trustSignals.map(signal => (
                <Badge
                  key={signal}
                  variant="outline"
                  className="inline-flex items-center gap-2 rounded-full border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-600 shadow-sm shadow-gray-100/70"
                >
                  <Shield className="h-4 w-4 text-cyan-700" />
                  {signal}
                </Badge>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {heroStats.map(stat => (
                <Card
                  key={stat.label}
                  className="animate-slide-up rounded-3xl border-gray-200/80 bg-white/90 shadow-sm shadow-gray-100/80 backdrop-blur"
                >
                  <CardContent className="p-5">
                    <p className="text-3xl font-bold text-gray-950">{stat.value}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="animate-glow-pulse absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-slate-200/70 via-blue-100/20 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white/92 shadow-2xl shadow-cyan-100/50">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Executive inbox</p>
                  <p className="mt-1 text-xs text-gray-500">AI triage on a client escalation thread</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Ready to approve
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-2xl border border-red-200/80 bg-red-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Priority detected</p>
                      <p className="mt-1 text-xs text-gray-600">
                        VIP client asked for a revised rollout plan before 4:00 PM.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Urgent
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Drafted reply</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">
                      Hi Sarah, we can deliver the revised timeline by 3:30 PM and hold a review before sharing it
                      with the wider team. I will send the updated version shortly.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Prepared actions</p>
                    <div className="mt-3 grid gap-2">
                      <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 text-blue-900">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Hold review with product and design
                        </span>
                        <span className="font-medium text-blue-700">Today, 2:30 PM</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 text-amber-900">
                          <ListChecks className="h-4 w-4 text-amber-600" />
                          Extracted 3 follow-up tasks
                        </span>
                        <span className="font-medium text-amber-700">Needs approval</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button className="inline-flex items-center justify-center rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15">
                    Approve and execute
                  </button>
                  <button className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600">
                    Edit before sending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100/80 bg-gradient-to-b from-slate-50/80 to-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">How it works</p>
            <h2 className="text-3xl font-bold text-gray-950 sm:text-4xl">One thread in. A full action plan out.</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500">
              Select an email and MailMate returns summary, priority, a drafted reply, and the next executable steps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-full top-12 z-10 hidden h-px w-6 bg-gradient-to-r from-cyan-300 to-transparent lg:block" />
                )}
                <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-cyan-200/70 hover:shadow-lg">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-800 text-white shadow-sm transition-shadow group-hover:shadow-md">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700/70">Step {step.step}</span>
                  <p className="mt-1 text-lg font-bold text-gray-950">{step.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">Capabilities</p>
            <h2 className="text-3xl font-bold text-gray-950 sm:text-4xl">Built to reduce triage work, not just summarize it</h2>
            <p className="mt-3 text-lg text-gray-500">
              Every feature is aimed at moving the user closer to execution with less inbox friction.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(feature => (
              <Card
                key={feature.title}
                className={`group rounded-2xl border bg-gradient-to-br ${feature.color} py-0 transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-sm transition-shadow group-hover:shadow">
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-gray-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-1/4 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Move from reading email to resolving it.</h2>
          <p className="mt-4 text-lg text-gray-400">
            Connect Gmail and Calendar, let MailMate prepare the next action, then approve it in seconds.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-800 px-8 text-base font-semibold text-white shadow-lg shadow-slate-950/20 transition-all hover:from-slate-800 hover:to-blue-700">
              <Link href="/auth/signin">
                Start with Google <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl border-white/20 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15">
              <Link href="/inbox">Launch demo inbox</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo size="sm" />
          <p className="text-sm text-gray-400">Built with Next.js + Groq AI &middot; Team Avalon</p>
        </div>
      </footer>
    </main>
  )
}

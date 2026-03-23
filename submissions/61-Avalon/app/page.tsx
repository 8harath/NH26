import Link from 'next/link'
import {
  Mail, ArrowRight, Brain, Zap, Calendar, ListChecks, Tags, Clock,
  FileSearch, MessageSquare, Shield, Sparkles, ChevronRight
} from 'lucide-react'
import { Logo } from '@/components/logo'

const features = [
  {
    icon: Brain,
    title: 'Auto Categorization',
    desc: 'Instantly sorts emails into Work, Personal, Finance, Updates, or Spam.',
  },
  {
    icon: Zap,
    title: 'Smart Priority Inbox',
    desc: 'Classifies every thread as Urgent, Important, Normal, or Low Priority.',
  },
  {
    icon: MessageSquare,
    title: 'One-Click Smart Replies',
    desc: 'AI generates 5 context-aware reply options you can send with one click.',
  },
  {
    icon: Sparkles,
    title: 'Context-Aware Drafts',
    desc: 'Full reply drafts that understand the entire conversation history.',
  },
  {
    icon: Calendar,
    title: 'Meeting Detection',
    desc: 'Finds meetings, calls, and events — suggests calendar entries automatically.',
  },
  {
    icon: ListChecks,
    title: 'Task Extraction',
    desc: 'Converts action items into tasks with deadlines and priority levels.',
  },
  {
    icon: Clock,
    title: 'Follow-Up Reminders',
    desc: 'Detects when a reply is expected and suggests when to follow up.',
  },
  {
    icon: FileSearch,
    title: 'Key Info Extraction',
    desc: 'Pulls out dates, links, contacts, and monetary amounts from threads.',
  },
  {
    icon: Tags,
    title: 'Auto Labeling',
    desc: 'Suggests smart labels for organizing and finding emails later.',
  },
  {
    icon: Shield,
    title: 'Human-in-the-Loop',
    desc: 'AI never acts alone. You review, edit, and approve every action.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <Link href="/inbox"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Open Inbox <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Groq AI
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            Your inbox, <br />
            <span className="text-blue-600">understood.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            MailMate reads your emails, extracts what matters, drafts replies,
            finds deadlines, and prepares actions — all before you lift a finger.
            You stay in control. AI does the heavy lifting.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/signin"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
              Connect Gmail <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/inbox"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl text-sm transition-colors border border-gray-200 shadow-sm">
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* What it does — visual summary */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">One click. Full intelligence.</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Select an email and MailMate instantly delivers everything you need to act.
            </p>
          </div>

          {/* Pipeline visualization */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '1', label: 'Analyze', detail: 'AI reads the full thread' },
              { step: '2', label: 'Extract', detail: 'Tasks, deadlines, meetings, key info' },
              { step: '3', label: 'Prepare', detail: 'Draft replies + smart actions' },
              { step: '4', label: 'You decide', detail: 'Review, edit, approve, or ignore' },
            ].map(s => (
              <div key={s.step} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {s.step}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{s.label}</p>
                <p className="text-xs text-gray-500 mt-1">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">Built for people who get too much email</h2>
            <p className="text-gray-500 mt-2">Every feature exists to save you time and reduce inbox anxiety.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <div key={f.title} className="group border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                <div className="w-9 h-9 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center mb-3 transition-colors">
                  <f.icon className="w-[18px] h-[18px] text-gray-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white">Ready to take control of your inbox?</h2>
          <p className="text-gray-400 mt-2">No sign-up required. Start analyzing emails instantly.</p>
          <Link href="/inbox"
            className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl text-sm transition-colors">
            Launch MailMate <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
              <Mail className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium">MailMate</span>
          </div>
          <p>Built with Next.js + Groq AI &middot; Team Avalon</p>
        </div>
      </footer>
    </main>
  )
}

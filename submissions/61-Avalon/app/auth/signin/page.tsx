'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import {
  ArrowRight, Calendar, CheckCircle2, Mail, Shield, Sparkles
} from 'lucide-react'
import { Logo } from '@/components/logo'

const perks = [
  { icon: Mail, title: 'AI mail analysis', text: 'Summaries, priority detection, smart replies, and draft generation.' },
  { icon: Calendar, title: 'Calendar sync', text: 'Meeting extraction with calendar context available right inside the inbox.' },
  { icon: Sparkles, title: 'Action preparation', text: 'Tasks, deadlines, and next steps are prepared before you act.' },
  { icon: Shield, title: 'Approval first', text: 'Nothing is executed without your review and approval.' },
]

const permissions = [
  'Read Gmail threads for analysis',
  'Send approved replies from the app',
  'Access Calendar to surface upcoming events',
]

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_40%,#f4fbff_100%)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950 lg:flex">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-10 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between px-16 py-14">
          <div>
            <Logo size="lg" dark />
            <div className="mt-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Production-ready AI inbox assistant
              </div>
              <h1 className="mt-8 text-5xl font-display leading-tight text-white">
                Connect once.
                <span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Let the inbox work back.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
                MailMate connects Gmail and Calendar so the app can understand real email threads,
                draft responses, extract tasks, and prepare the next action for approval.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {perks.map(perk => (
              <div
                key={perk.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                    <perk.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{perk.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{perk.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="rounded-[2rem] border border-gray-200/80 bg-white/92 p-8 shadow-2xl shadow-cyan-100/60 backdrop-blur sm:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Connect your workspace</p>
              <h2 className="mt-3 text-3xl font-display text-gray-950">Sign in to <span className="tracking-tight">Mail<span className="text-blue-600">Mate</span></span></h2>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Use Google to unlock live inbox analysis, calendar sync, and sending approved replies from one place.
              </p>
            </div>

            <button
              onClick={() => signIn('google', { callbackUrl: '/inbox' })}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50/40 hover:shadow-md"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09A6.96 6.96 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11.94 11.94 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
              <ArrowRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-cyan-700" />
            </button>

            <div className="mt-5 grid gap-2">
              {permissions.map(permission => (
                <div
                  key={permission}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-700" />
                  {permission}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
              <p className="text-sm font-semibold text-gray-900">Private by default</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                MailMate uses your Google permissions only to analyze your inbox, sync calendar context,
                and send actions that you explicitly approve.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/inbox"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-cyan-700"
            >
              Skip sign-in and open demo mode
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

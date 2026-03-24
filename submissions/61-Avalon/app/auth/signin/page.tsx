'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowRight, CheckCircle2, Mail, Calendar, Sparkles, Shield
} from 'lucide-react'
import { Logo } from '@/components/logo'

const perks = [
  { icon: Mail, text: 'AI-powered thread analysis with priority classification' },
  { icon: Calendar, text: 'Meeting detection and one-click calendar sync' },
  { icon: Sparkles, text: 'Smart reply drafts, task extraction, and writing tools' },
  { icon: Shield, text: 'Human-in-the-loop — nothing sends without your approval' },
]

const permissions = [
  'Read Gmail threads for analysis',
  'Send approved replies from the app',
  'Access Calendar to surface upcoming events',
]

const words = ['triage', 'prioritize', 'draft', 'resolve']

export default function SignInPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left Panel - Landing page style */}
      <div className="relative hidden overflow-hidden bg-foreground text-background lg:flex">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute h-px bg-background/20"
              style={{ top: `${16.66 * (i + 1)}%`, left: 0, right: 0 }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute w-px bg-background/20"
              style={{ left: `${12.5 * (i + 1)}%`, top: 0, bottom: 0 }}
            />
          ))}
        </div>

        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              currentColor 40px,
              currentColor 41px
            )`
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between px-12 lg:px-16 py-14 w-full">
          <div>
            <Logo size="lg" dark />

            <div className={`mt-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-8">
                <span className="w-8 h-px bg-background/30" />
                Connect your inbox
              </span>

              <h1 className="text-5xl lg:text-6xl font-display leading-[0.95] tracking-tight">
                Your inbox.
                <br />
                <span className="text-background/50">
                  Ready to{' '}
                  <span className="text-background">
                    {words[wordIndex]}
                  </span>
                  .
                </span>
              </h1>

              <p className="mt-8 max-w-md text-lg leading-relaxed text-background/60">
                Sign in with Google to connect your Gmail and Calendar.
                MailMate handles the reading, summarizing, and drafting — you make every final call.
              </p>
            </div>
          </div>

          {/* Perks */}
          <div className={`space-y-0 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {perks.map((perk, index) => (
              <div
                key={index}
                className="flex items-center gap-4 py-4 border-b border-background/10 last:border-b-0"
              >
                <div className="shrink-0 w-8 h-8 flex items-center justify-center border border-background/20">
                  <perk.icon className="w-4 h-4 text-background/60" />
                </div>
                <p className="text-sm text-background/70">{perk.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Sign in form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className={`transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="mb-10">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-8 h-px bg-foreground/30" />
                Authenticate
              </span>
              <h2 className="text-3xl lg:text-4xl font-display tracking-tight">
                Sign in to{' '}
                <span className="font-black">M</span>ail<span className="font-black">M</span>ate
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Connect your Google account to unlock live inbox analysis, smart replies, and calendar sync.
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={() => signIn('google', { callbackUrl: '/inbox' })}
              className="group w-full flex items-center justify-center gap-3 border-2 border-foreground/20 px-5 py-4 text-base font-medium transition-all hover:border-foreground hover:bg-foreground/5"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09A6.96 6.96 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11.94 11.94 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>

            {/* Permissions */}
            <div className="mt-6 space-y-3">
              {permissions.map(permission => (
                <div
                  key={permission}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {permission}
                </div>
              ))}
            </div>

            {/* Privacy note */}
            <div className="mt-8 border border-foreground/10 p-5">
              <p className="text-sm font-medium">Private by default</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                No email data is stored on any server. AI analysis happens on demand, and all results stay in your browser.
                Your OAuth token is encrypted and never exposed to client-side code.
              </p>
            </div>

            {/* Demo link */}
            <div className="mt-8 pt-8 border-t border-foreground/10">
              <Link
                href="/inbox"
                className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground transition-colors hover:text-foreground group"
              >
                Skip sign-in and explore demo mode
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

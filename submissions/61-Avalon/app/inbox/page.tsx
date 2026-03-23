'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Mail, Search, Loader2, X, Inbox, Bot, Send, Sparkles,
  Calendar, ListChecks, Clock, AlertTriangle, Tag, Star,
  Copy, Check, MessageSquare, FileText, Link2, Users, DollarSign,
  Archive, Trash2, AlarmClock, PenLine,
  Wand2, Minimize2, Maximize2, CheckCheck, CornerUpLeft,
  LogIn, LogOut, CalendarPlus, ExternalLink
} from 'lucide-react'
import NextLink from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { mockThreads } from '@/data/emails'
import {
  Thread, ComprehensiveAnalysis, Priority, EmailCategory,
  AIChatMessage, ThreadMeta, SidebarFolder, RewriteAction
} from '@/types'

// ─── Storage helpers ────────────────────────────────────────────

const LS_ANALYSES = 'mailmate-analyses'
const LS_META = 'mailmate-thread-meta'

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function saveJson<T>(key: string, v: T) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
}

function loadAnalyses(): Record<string, ComprehensiveAnalysis> {
  const data = loadJson<Record<string, ComprehensiveAnalysis>>(LS_ANALYSES, {})
  const first = Object.values(data)[0] as Record<string, unknown> | undefined
  if (first && !('summary' in first && 'smartReplies' in first)) {
    localStorage.removeItem(LS_ANALYSES)
    return {}
  }
  return data
}

const LS_LABELS = 'mailmate-user-labels'

const defaultMeta: ThreadMeta = { read: false, starred: false, snoozedUntil: null, archived: false, trashed: false, draft: '', userLabels: [] }

// Pre-populated defaults so the demo looks alive
const initialMetas: Record<string, Partial<ThreadMeta>> = {
  'thread-1': { starred: true },            // Budget review is important
  'thread-2': { starred: true },            // OAuth feature request starred
  'thread-4': { snoozedUntil: new Date(Date.now() + 172800000).toISOString() }, // Offsite planning snoozed
  'thread-5': { read: true },               // TechCorp proposal already read
  'thread-6': { read: true },               // Campaign report already read
  'thread-12': { read: true },              // Netflix spam already read
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── Config maps ────────────────────────────────────────────────

const priorityConfig: Record<string, { label: string; cls: string }> = {
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700 border-red-200' },
  important: { label: 'Important', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  normal: { label: 'Normal', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  low: { label: 'Low', cls: 'bg-slate-50 text-slate-500 border-slate-200' },
}

const categoryConfig: Record<string, { label: string; cls: string }> = {
  work: { label: 'Work', cls: 'bg-blue-50 text-blue-700' },
  personal: { label: 'Personal', cls: 'bg-purple-50 text-purple-700' },
  finance: { label: 'Finance', cls: 'bg-emerald-50 text-emerald-700' },
  updates: { label: 'Updates', cls: 'bg-cyan-50 text-cyan-700' },
  spam: { label: 'Spam', cls: 'bg-gray-100 text-gray-500' },
}

const sidebarItems: { folder: SidebarFolder; icon: typeof Inbox; label: string }[] = [
  { folder: 'inbox', icon: Inbox, label: 'Inbox' },
  { folder: 'starred', icon: Star, label: 'Starred' },
  { folder: 'snoozed', icon: AlarmClock, label: 'Snoozed' },
  { folder: 'sent', icon: Send, label: 'Sent' },
  { folder: 'drafts', icon: PenLine, label: 'Drafts' },
  { folder: 'trash', icon: Trash2, label: 'Trash' },
  { folder: 'all', icon: Mail, label: 'All Mail' },
]

// ─── Small components ───────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityConfig[priority] ?? priorityConfig.normal
  return <span className={`inline-flex items-center border rounded-full text-[11px] font-medium px-2 py-px ${c.cls}`}>{c.label}</span>
}

function CategoryBadge({ category }: { category: string }) {
  const c = categoryConfig[category] ?? categoryConfig.work
  return <span className={`inline-flex items-center rounded-full text-[11px] font-medium px-2 py-px ${c.cls}`}>{c.label}</span>
}

function SenderBadge({ importance }: { importance: string }) {
  if (importance === 'vip') return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600"><Star className="w-3 h-3 fill-amber-500" /> VIP</span>
  return null
}

// ─── Thread list item ───────────────────────────────────────────

function ThreadListItem({ thread, selected, analysis, meta, onSelect, onStar }: {
  thread: Thread; selected: boolean; analysis?: ComprehensiveAnalysis | null
  meta: ThreadMeta; onSelect: () => void; onStar: () => void
}) {
  const dotColor: Record<string, string> = { urgent: 'bg-red-500', important: 'bg-amber-500', normal: 'bg-gray-300', low: 'bg-slate-200' }
  const isUnread = !meta.read

  return (
    <button onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 transition-colors border-l-2 group ${
        selected ? 'bg-blue-50/70 border-l-blue-600' : 'border-l-transparent hover:bg-gray-50'
      }`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
          isUnread ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-500'
        }`}>
          {thread.from.avatar || thread.from.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              {thread.from.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={e => { e.stopPropagation(); onStar() }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                <Star className={`w-3.5 h-3.5 ${meta.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'}`} />
              </button>
              <span className="text-[11px] text-gray-400">{timeAgo(thread.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-px">
            {analysis && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[analysis.priority] ?? 'bg-gray-300'}`} />}
            <p className={`text-sm truncate ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
              {thread.subject}
            </p>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{thread.preview}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {meta.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
            {analysis && <CategoryBadge category={analysis.category} />}
            {analysis?.followUpNeeded && <span className="text-[11px] text-orange-600 font-medium flex items-center gap-0.5"><Clock className="w-3 h-3" />Follow-up</span>}
            {meta.snoozedUntil && <span className="text-[11px] text-purple-600 flex items-center gap-0.5"><AlarmClock className="w-3 h-3" />Snoozed</span>}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Analysis sections ──────────────────────────────────────────

function SummarySection({ analysis }: { analysis: ComprehensiveAnalysis }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center flex-wrap gap-2">
        <PriorityBadge priority={analysis.priority} />
        <CategoryBadge category={analysis.category} />
        <SenderBadge importance={analysis.senderImportance} />
        {analysis.labels.map(l => (
          <span key={l} className="inline-flex items-center gap-0.5 text-[11px] bg-gray-100 text-gray-600 rounded px-1.5 py-px">
            <Tag className="w-2.5 h-2.5" />{l}
          </span>
        ))}
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">AI Summary</p>
        <ul className="space-y-1">
          {analysis.summary.map((s, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SmartRepliesSection({ replies, onUseReply }: { replies: string[]; onUseReply: (text: string) => void }) {
  if (replies.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> Quick Replies
      </p>
      <div className="flex flex-wrap gap-1.5">
        {replies.map((r, i) => (
          <button key={i} onClick={() => onUseReply(r)}
            className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-gray-700">
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}

function DraftReplySection({ draft }: { draft: string }) {
  const [copied, setCopied] = useState(false)
  if (!draft) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" /> AI-Suggested Reply
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-3 relative">
        <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">{draft}</p>
        <button onClick={() => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-100">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>
    </div>
  )
}

function MeetingsSection({ meetings, isAuthenticated }: { meetings: ComprehensiveAnalysis['meetings']; isAuthenticated?: boolean }) {
  const [addingIdx, setAddingIdx] = useState<number | null>(null)
  const [addedIdx, setAddedIdx] = useState<Set<number>>(new Set())

  const addToCalendar = async (meeting: ComprehensiveAnalysis['meetings'][0], idx: number) => {
    setAddingIdx(idx)
    try {
      const res = await fetch('/api/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meeting.title,
          date: meeting.date,
          time: meeting.time || undefined,
          attendees: meeting.attendees,
          description: `Meeting detected by MailMate AI`,
        })
      })
      if (res.ok) {
        setAddedIdx(prev => new Set(prev).add(idx))
      }
    } catch { /* ignore */ }
    finally { setAddingIdx(null) }
  }

  if (meetings.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" /> Detected Meetings
      </p>
      <div className="space-y-2">
        {meetings.map((m, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.date}</span>
                  {m.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.time}</span>}
                </div>
                {m.attendees.length > 0 && <p className="text-xs text-gray-400 mt-1"><Users className="w-3 h-3 inline mr-1" />{m.attendees.join(', ')}</p>}
              </div>
              {isAuthenticated && (
                <button
                  onClick={() => addToCalendar(m, i)}
                  disabled={addingIdx === i || addedIdx.has(i)}
                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                    addedIdx.has(i)
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  } disabled:opacity-50`}
                >
                  {addingIdx === i ? <Loader2 className="w-3 h-3 animate-spin" /> :
                   addedIdx.has(i) ? <><Check className="w-3 h-3" /> Added</> :
                   <><CalendarPlus className="w-3 h-3" /> Add to Calendar</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TasksSection({ tasks }: { tasks: ComprehensiveAnalysis['tasks'] }) {
  if (tasks.length === 0) return null
  const color: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-gray-500' }
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" /> Extracted Tasks
      </p>
      <div className="space-y-1.5">
        {tasks.map((t, i) => (
          <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <div className="w-4 h-4 rounded border-2 border-gray-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{t.title}</p>
              {t.deadline && <p className="text-xs text-gray-400">Due: {t.deadline}</p>}
            </div>
            <span className={`text-[11px] font-medium ${color[t.priority] ?? 'text-gray-500'}`}>{t.priority}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeadlinesSection({ deadlines }: { deadlines: ComprehensiveAnalysis['deadlines'] }) {
  if (deadlines.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" /> Deadlines
      </p>
      <div className="space-y-1.5">
        {deadlines.map((d, i) => (
          <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${d.urgent ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-white border border-gray-200 text-gray-700'}`}>
            {d.urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            <span className="flex-1">{d.description}</span>
            <span className="text-xs text-gray-500 shrink-0">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyInfoSection({ keyInfo }: { keyInfo: ComprehensiveAnalysis['keyInfo'] }) {
  const sections = [
    { icon: Calendar, label: 'Dates', items: keyInfo.dates },
    { icon: Link2, label: 'Links', items: keyInfo.links },
    { icon: Users, label: 'Contacts', items: keyInfo.contacts },
    { icon: DollarSign, label: 'Amounts', items: keyInfo.amounts },
  ].filter(s => s.items.length > 0)
  if (sections.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> Key Information
      </p>
      <div className="grid grid-cols-2 gap-2">
        {sections.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-2.5">
            <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mb-1"><s.icon className="w-3 h-3" />{s.label}</p>
            {s.items.map((item, i) => <p key={i} className="text-xs text-gray-700 truncate">{item}</p>)}
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowUpSection({ needed, suggestion }: { needed: boolean; suggestion: string }) {
  if (!needed) return null
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
      <Clock className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-orange-800">Follow-up needed</p>
        {suggestion && <p className="text-xs text-orange-600 mt-0.5">{suggestion}</p>}
      </div>
    </div>
  )
}

// ─── Compose panel with AI writing tools ────────────────────────

function ComposePanel({ thread, initialText, meta, onUpdateDraft, onClose, isAuthenticated }: {
  thread: Thread; initialText: string; meta: ThreadMeta
  onUpdateDraft: (text: string) => void; onClose: () => void; isAuthenticated?: boolean
}) {
  const [text, setText] = useState(initialText || meta.draft || '')
  const [rewriting, setRewriting] = useState<RewriteAction | null>(null)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { onUpdateDraft(text) }, [text, onUpdateDraft])
  useEffect(() => {
    if (initialText && initialText !== text) setText(initialText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText])

  const handleRewrite = useCallback(async (action: RewriteAction) => {
    if (!text.trim() || rewriting) return
    setRewriting(action)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, action })
      })
      const data = await res.json()
      if (data.text) setText(data.text)
    } catch { /* ignore */ }
    finally { setRewriting(null) }
  }, [text, rewriting])

  const handleSend = async () => {
    if (sending) return
    setSending(true)

    if (isAuthenticated) {
      // Send via Gmail API
      try {
        const lastEmail = thread.emails[thread.emails.length - 1]
        const to = lastEmail.from.email.includes('you@') ? thread.from.email : lastEmail.from.email
        await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            subject: `Re: ${thread.subject}`,
            body: text,
            threadId: thread.id,
          })
        })
      } catch (err) { console.error('Send failed:', err) }
    }

    setSent(true)
    setSending(false)
    onUpdateDraft('')
    setTimeout(() => { setSent(false); onClose() }, 1500)
  }

  const aiTools: { action: RewriteAction; icon: typeof Wand2; label: string }[] = [
    { action: 'fix-grammar', icon: CheckCheck, label: 'Fix Grammar' },
    { action: 'formalize', icon: Wand2, label: 'Formalize' },
    { action: 'shorten', icon: Minimize2, label: 'Shorten' },
    { action: 'elaborate', icon: Maximize2, label: 'Elaborate' },
  ]

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <CornerUpLeft className="w-3.5 h-3.5" /> Replying to {thread.from.name}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write your reply..."
          rows={5}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* AI writing tools */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[11px] text-gray-400 font-medium mr-1">AI Tools:</span>
          {aiTools.map(t => (
            <button key={t.action} onClick={() => handleRewrite(t.action)}
              disabled={!text.trim() || !!rewriting}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {rewriting === t.action ? <Loader2 className="w-3 h-3 animate-spin" /> : <t.icon className="w-3 h-3" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-gray-400">{text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} words` : ''}</p>
          <Button size="sm" onClick={handleSend} disabled={!text.trim() || sent || sending}
            className={sent ? 'bg-green-600 hover:bg-green-600' : ''}>
            {sending ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Sending...</> :
             sent ? <><Check className="w-3.5 h-3.5 mr-1" /> Sent{isAuthenticated ? ' via Gmail' : ''}</> :
             <><Send className="w-3.5 h-3.5 mr-1" /> {isAuthenticated ? 'Send via Gmail' : 'Send'}</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── AI Chat ────────────────────────────────────────────────────

function AIChatPanel({ thread }: { thread: Thread | null }) {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg: AIChatMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg.content, threadId: thread?.id ?? null }) })
      const data = await res.json()
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.reply ?? data.error ?? 'No response', timestamp: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Failed to get response.', timestamp: new Date().toISOString() }])
    } finally { setLoading(false) }
  }, [input, loading, thread])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Ask about {thread ? 'this email' : 'your emails'}
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-gray-100 rounded-lg px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div></div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask about this email..." className="text-sm" />
        <Button size="sm" onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}

// ─── Main inbox page ────────────────────────────────────────────

export default function InboxPage() {
  const { data: session, status: authStatus } = useSession()
  const isAuthenticated = !!session?.accessToken
  const isAuthLoading = authStatus === 'loading'

  const [threads, setThreads] = useState<Thread[]>(mockThreads)
  const [gmailLoading, setGmailLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<Record<string, ComprehensiveAnalysis>>({})
  const [metas, setMetas] = useState<Record<string, ThreadMeta>>({})
  const [loadingThreads, setLoadingThreads] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState<SidebarFolder>('inbox')
  const [showChat, setShowChat] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [composeInitial, setComposeInitial] = useState('')
  const [activeTab, setActiveTab] = useState<'analysis' | 'emails'>('analysis')
  const [allUserLabels, setAllUserLabels] = useState<string[]>([])
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [newLabelText, setNewLabelText] = useState('')

  const selectedThread = threads.find(t => t.id === selectedId) ?? null
  const getMeta = (id: string): ThreadMeta => metas[id] ?? defaultMeta

  // Fetch real Gmail threads when authenticated
  const fetchGmailThreads = useCallback(async (query?: string) => {
    if (!isAuthenticated) return
    setGmailLoading(true)
    try {
      const url = new URL('/api/gmail/threads', window.location.origin)
      if (query) url.searchParams.set('q', query)
      const res = await fetch(url.toString())
      if (res.ok) {
        const data = await res.json()
        if (data.threads?.length > 0) {
          setThreads(data.threads as Thread[])
        }
      }
    } catch (err) { console.error('Gmail fetch error:', err) }
    finally { setGmailLoading(false) }
  }, [isAuthenticated])

  // Load from storage / Gmail on mount
  useEffect(() => {
    setAnalyses(loadAnalyses())
    const stored = loadJson<Record<string, ThreadMeta>>(LS_META, {})
    const merged = { ...stored }
    for (const [id, partial] of Object.entries(initialMetas)) {
      if (!merged[id]) merged[id] = { ...defaultMeta, ...partial }
    }
    setMetas(merged)
    saveJson(LS_META, merged)
    setAllUserLabels(loadJson<string[]>(LS_LABELS, ['Important', 'Follow-up', 'Receipts', 'Travel', 'Project']))
  }, [])

  // Fetch Gmail when session is ready
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchGmailThreads()
    }
  }, [isAuthenticated, isAuthLoading, fetchGmailThreads])

  // Persist meta changes
  const updateMeta = useCallback((threadId: string, updates: Partial<ThreadMeta>) => {
    setMetas(prev => {
      const updated = { ...prev, [threadId]: { ...(prev[threadId] ?? defaultMeta), ...updates } }
      saveJson(LS_META, updated)
      return updated
    })
  }, [])

  // Analyze on select
  const analyzeThread = useCallback(async (threadId: string) => {
    if (analyses[threadId] || loadingThreads.has(threadId)) return
    setLoadingThreads(prev => new Set(prev).add(threadId))
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId }) })
      if (!res.ok) throw new Error('fail')
      const data: ComprehensiveAnalysis = await res.json()
      setAnalyses(prev => { const u = { ...prev, [threadId]: data }; saveJson(LS_ANALYSES, u); return u })
    } catch (err) { console.error(err) }
    finally { setLoadingThreads(prev => { const n = new Set(prev); n.delete(threadId); return n }) }
  }, [analyses, loadingThreads])

  // Gmail API action helper
  const gmailAction = useCallback(async (threadId: string, action: string) => {
    if (!isAuthenticated) return
    try {
      await fetch('/api/gmail/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, action })
      })
    } catch { /* local state is source of truth for UI */ }
  }, [isAuthenticated])

  const handleSelect = useCallback((threadId: string) => {
    setSelectedId(threadId)
    setActiveTab('analysis')
    setShowCompose(false)
    setComposeInitial('')
    updateMeta(threadId, { read: true })
    gmailAction(threadId, 'read')
    analyzeThread(threadId)
  }, [analyzeThread, updateMeta, gmailAction])

  const handleStar = useCallback((threadId: string) => {
    const current = getMeta(threadId)
    updateMeta(threadId, { starred: !current.starred })
    gmailAction(threadId, current.starred ? 'unstar' : 'star')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, updateMeta, gmailAction])

  const handleSnooze = useCallback((threadId: string) => {
    const current = getMeta(threadId)
    if (current.snoozedUntil) {
      updateMeta(threadId, { snoozedUntil: null })
    } else {
      const tomorrow = new Date(Date.now() + 86400000).toISOString()
      updateMeta(threadId, { snoozedUntil: tomorrow })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, updateMeta])

  const handleArchive = useCallback((threadId: string) => {
    updateMeta(threadId, { archived: true })
    gmailAction(threadId, 'archive')
    if (selectedId === threadId) setSelectedId(null)
  }, [updateMeta, selectedId, gmailAction])

  const handleTrash = useCallback((threadId: string) => {
    updateMeta(threadId, { trashed: true })
    gmailAction(threadId, 'trash')
    if (selectedId === threadId) setSelectedId(null)
  }, [updateMeta, selectedId, gmailAction])

  const handleMarkUnread = useCallback((threadId: string) => {
    updateMeta(threadId, { read: false })
    gmailAction(threadId, 'unread')
  }, [updateMeta, gmailAction])

  const handleUseReply = useCallback((text: string) => {
    setComposeInitial(text)
    setShowCompose(true)
  }, [])

  const handleAddLabel = useCallback((threadId: string, label: string) => {
    const current = getMeta(threadId)
    if (!current.userLabels.includes(label)) {
      updateMeta(threadId, { userLabels: [...current.userLabels, label] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, updateMeta])

  const handleRemoveLabel = useCallback((threadId: string, label: string) => {
    const current = getMeta(threadId)
    updateMeta(threadId, { userLabels: current.userLabels.filter(l => l !== label) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, updateMeta])

  const handleCreateLabel = useCallback((label: string) => {
    const trimmed = label.trim()
    if (trimmed && !allUserLabels.includes(trimmed)) {
      const updated = [...allUserLabels, trimmed]
      setAllUserLabels(updated)
      saveJson(LS_LABELS, updated)
    }
    setNewLabelText('')
    setShowLabelInput(false)
  }, [allUserLabels])

  // Filter threads by folder + search
  const filteredThreads = threads.filter(t => {
    const m = getMeta(t.id)

    // Folder filtering
    switch (folder) {
      case 'inbox': if (m.archived || m.trashed) return false; break
      case 'starred': if (!m.starred || m.trashed) return false; break
      case 'snoozed': if (!m.snoozedUntil || m.trashed) return false; break
      case 'sent': {
        const hasSent = t.emails.some(e => e.from.email.includes('you@'))
        if (!hasSent || m.trashed) return false; break
      }
      case 'drafts': if (!m.draft || m.trashed) return false; break
      case 'trash': if (!m.trashed) return false; break
      case 'all': if (m.trashed) return false; break
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      if (!t.subject.toLowerCase().includes(q) && !t.from.name.toLowerCase().includes(q) && !t.preview.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Folder counts
  const counts: Partial<Record<SidebarFolder, number>> = {}
  threads.forEach(t => {
    const m = getMeta(t.id)
    if (!m.archived && !m.trashed && !m.read) counts.inbox = (counts.inbox ?? 0) + 1
    if (m.starred && !m.trashed) counts.starred = (counts.starred ?? 0) + 1
    if (m.snoozedUntil && !m.trashed) counts.snoozed = (counts.snoozed ?? 0) + 1
    if (m.draft && !m.trashed) counts.drafts = (counts.drafts ?? 0) + 1
    if (m.trashed) counts.trash = (counts.trash ?? 0) + 1
  })
  // Sent count
  counts.sent = threads.filter(t => t.emails.some(e => e.from.email.includes('you@')) && !getMeta(t.id).trashed).length

  const selectedAnalysis = selectedId ? analyses[selectedId] : null
  const isLoadingSelected = selectedId ? loadingThreads.has(selectedId) : false

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="border-b border-gray-100 bg-white h-13 flex items-center px-4 gap-4 shrink-0">
        <NextLink href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </NextLink>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails..." className="pl-9 text-sm h-9 bg-gray-50 border-gray-200" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {gmailLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}

          {isAuthenticated && (
            <span className="text-[11px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Gmail Connected
            </span>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)}
            className={showChat ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}>
            <Bot className="w-4 h-4 mr-1" /> AI Chat
          </Button>

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-1" /> {session?.user?.name?.split(' ')[0] ?? 'Sign out'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => signIn('google', { callbackUrl: '/inbox' })}
              className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <LogIn className="w-4 h-4 mr-1" /> Connect Gmail
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 border-r border-gray-100 py-2 shrink-0 flex flex-col">
          <nav className="space-y-0.5 px-2">
            {sidebarItems.map(item => {
              const count = counts[item.folder]
              const active = folder === item.folder
              return (
                <button key={item.folder} onClick={() => setFolder(item.folder)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <item.icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {count ? <span className={`text-[11px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>{count}</span> : null}
                </button>
              )
            })}
          </nav>

          {/* Category filters */}
          <div className="mt-4 px-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">Categories</p>
            {Object.entries(categoryConfig).map(([key, val]) => (
              <button key={key} onClick={() => { setFolder('all'); setSearch(key) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <span className={`w-2 h-2 rounded-full ${val.cls.split(' ')[0]}`} />
                {val.label}
              </button>
            ))}
          </div>

          {/* User labels */}
          <div className="mt-4 px-2 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Labels</p>
              <button onClick={() => setShowLabelInput(true)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Create label">
                <Tag className="w-3 h-3" />
              </button>
            </div>
            {showLabelInput && (
              <div className="px-3 mb-1 flex gap-1">
                <input value={newLabelText} onChange={e => setNewLabelText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateLabel(newLabelText); if (e.key === 'Escape') { setShowLabelInput(false); setNewLabelText('') } }}
                  placeholder="Label name..."
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus />
                <button onClick={() => handleCreateLabel(newLabelText)} className="text-xs text-blue-600 font-medium px-1">Add</button>
              </div>
            )}
            {allUserLabels.map(label => (
              <button key={label} onClick={() => { setFolder('all'); setSearch(label.toLowerCase()) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Tag className="w-3 h-3 text-gray-400" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Thread list */}
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {filteredThreads.length} conversation{filteredThreads.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredThreads.map(t => (
              <ThreadListItem key={t.id} thread={t} selected={t.id === selectedId}
                analysis={analyses[t.id]} meta={getMeta(t.id)}
                onSelect={() => handleSelect(t.id)} onStar={() => handleStar(t.id)} />
            ))}
            {filteredThreads.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {folder === 'trash' ? 'Trash is empty' : folder === 'starred' ? 'No starred emails' : folder === 'drafts' ? 'No drafts' : 'No emails found'}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 flex overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an email to analyze</p>
                <p className="text-xs mt-1">MailMate will extract insights with AI</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Thread header */}
              <div className="px-6 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-semibold text-gray-900 truncate">{selectedThread.subject}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedThread.from.name} &middot; {selectedThread.emails.length} message{selectedThread.emails.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {selectedAnalysis && <PriorityBadge priority={selectedAnalysis.priority} />}
                    <SenderBadge importance={selectedAnalysis?.senderImportance ?? 'regular'} />
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button onClick={() => handleMarkUnread(selectedThread.id)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Mark as unread">
                      <Mail className={`w-4 h-4 ${!getMeta(selectedThread.id).read ? 'text-blue-500' : 'text-gray-400'}`} />
                    </button>
                    <button onClick={() => handleStar(selectedThread.id)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Star">
                      <Star className={`w-4 h-4 ${getMeta(selectedThread.id).starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                    </button>
                    <button onClick={() => handleSnooze(selectedThread.id)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Snooze">
                      <AlarmClock className={`w-4 h-4 ${getMeta(selectedThread.id).snoozedUntil ? 'text-purple-500' : 'text-gray-400'}`} />
                    </button>
                    <button onClick={() => handleArchive(selectedThread.id)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Archive">
                      <Archive className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleTrash(selectedThread.id)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Trash">
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* User labels on thread */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {getMeta(selectedThread.id).userLabels.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
                      <Tag className="w-2.5 h-2.5" />{label}
                      <button onClick={() => handleRemoveLabel(selectedThread.id, label)} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                  <div className="relative group">
                    <button className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-blue-600 rounded-full px-2 py-0.5 border border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      <Tag className="w-2.5 h-2.5" /> Add label
                    </button>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 hidden group-hover:block min-w-[140px]">
                      {allUserLabels.filter(l => !getMeta(selectedThread.id).userLabels.includes(l)).map(label => (
                        <button key={label} onClick={() => handleAddLabel(selectedThread.id, label)}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          {label}
                        </button>
                      ))}
                      {allUserLabels.filter(l => !getMeta(selectedThread.id).userLabels.includes(l)).length === 0 && (
                        <p className="px-3 py-1.5 text-xs text-gray-400">All labels applied</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-3">
                  <button onClick={() => setActiveTab('analysis')}
                    className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" />AI Analysis
                  </button>
                  <button onClick={() => setActiveTab('emails')}
                    className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'emails' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    <Mail className="w-3.5 h-3.5 inline mr-1" />Emails ({selectedThread.emails.length})
                  </button>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'analysis' ? (
                  <div className="p-6 space-y-5 max-w-3xl">
                    {isLoadingSelected ? (
                      <div className="py-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Analyzing with AI...</p>
                        <p className="text-xs text-gray-400 mt-1">Extracting insights, tasks, meetings, and more</p>
                      </div>
                    ) : selectedAnalysis ? (
                      <>
                        <SummarySection analysis={selectedAnalysis} />
                        <FollowUpSection needed={selectedAnalysis.followUpNeeded} suggestion={selectedAnalysis.followUpSuggestion} />
                        <SmartRepliesSection replies={selectedAnalysis.smartReplies} onUseReply={handleUseReply} />
                        <DraftReplySection draft={selectedAnalysis.draftReply} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          <MeetingsSection meetings={selectedAnalysis.meetings} isAuthenticated={isAuthenticated} />
                          <TasksSection tasks={selectedAnalysis.tasks} />
                        </div>
                        <DeadlinesSection deadlines={selectedAnalysis.deadlines} />
                        <KeyInfoSection keyInfo={selectedAnalysis.keyInfo} />

                        {/* Reply button */}
                        {!showCompose && (
                          <button onClick={() => { setComposeInitial(''); setShowCompose(true) }}
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                            <CornerUpLeft className="w-4 h-4" /> Reply to this email
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="py-16 text-center text-gray-400"><p className="text-sm">Analysis unavailable.</p></div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 space-y-4 max-w-3xl">
                    {selectedThread.emails.map(email => (
                      <div key={email.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                              email.from.email.includes('you@') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>{email.from.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{email.from.name}</p>
                              <p className="text-xs text-gray-400">{email.from.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{timeAgo(email.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{email.body}</div>
                        {email.attachments && email.attachments.length > 0 && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {email.attachments.map(a => (
                              <span key={a.name} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600">
                                <FileText className="w-3 h-3" />{a.name} <span className="text-gray-400">({a.size})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Reply button in emails tab */}
                    {!showCompose && (
                      <button onClick={() => { setComposeInitial(''); setShowCompose(true) }}
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                        <CornerUpLeft className="w-4 h-4" /> Reply
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Compose panel */}
              {showCompose && selectedThread && (
                <ComposePanel
                  thread={selectedThread}
                  initialText={composeInitial}
                  meta={getMeta(selectedThread.id)}
                  onUpdateDraft={(text) => updateMeta(selectedThread.id, { draft: text })}
                  onClose={() => setShowCompose(false)}
                  isAuthenticated={isAuthenticated}
                />
              )}
            </div>
          )}

          {/* Chat sidebar */}
          {showChat && (
            <aside className="w-80 border-l border-gray-100 flex flex-col shrink-0">
              <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Bot className="w-4 h-4 text-blue-600" /> AI Assistant</span>
                <button onClick={() => setShowChat(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <AIChatPanel thread={selectedThread} />
            </aside>
          )}
        </main>
      </div>
    </div>
  )
}

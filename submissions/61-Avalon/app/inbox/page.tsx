'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Mail, Search, PenSquare, Loader2, X, Inbox, Bot, Send, Paperclip,
  ChevronDown, AlertCircle, Sparkles, Home, ArrowDown
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ActionCards } from '@/components/action-cards'
import { mockThreads as initialThreads } from '@/data/emails'
import {
  AnalysisSummary, ReplyAction, CalendarAction, TaskAction, Thread,
  EmailCategory, AIChatMessage
} from '@/types'

// --- Helpers ---

type PriorityFilter = 'all' | 'urgent' | 'action' | 'fyi'
type CategoryFilter = 'all' | EmailCategory

const LS_ANALYSES_KEY = 'mailmate-analyses'
const LS_ACTIONS_KEY = 'mailmate-actions'

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// --- Sub-components ---

function PriorityBadge({ priority, small }: { priority: string; small?: boolean }) {
  const config: Record<string, { label: string; cls: string }> = {
    urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700 border-red-200' },
    action: { label: 'Action Required', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    fyi: { label: 'FYI', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  const c = config[priority] ?? config.fyi
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${c.cls} ${small ? 'text-[11px] px-2 py-px' : 'text-xs px-2.5 py-0.5'}`}>
      {c.label}
    </span>
  )
}

function ThreadListItem({ thread, selected, analysis, onClick }: {
  thread: Thread; selected: boolean; analysis?: AnalysisSummary | null; onClick: () => void
}) {
  const dotColor: Record<string, string> = { urgent: 'bg-red-500', action: 'bg-amber-500', fyi: 'bg-blue-500' }

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
        selected
          ? 'bg-blue-50/70 border-l-blue-600'
          : 'border-l-transparent hover:bg-gray-50'
      }`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 ${
          thread.unreadCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {thread.from.avatar || thread.from.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              {thread.from.name}
            </span>
            <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(thread.timestamp)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-px">
            {analysis && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[analysis.priority] ?? ''}`} />}
            <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
              {thread.subject}
            </p>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{thread.preview}</p>
        </div>
      </div>
    </button>
  )
}

// --- Main Page ---

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')

  const [analyses, setAnalyses] = useState<
    Record<string, { data: AnalysisSummary | null; loading: boolean; error: string | null }>
  >({})
  const [actionsMap, setActionsMap] = useState<
    Record<string, (ReplyAction | CalendarAction | TaskAction)[]>
  >({})
  const [actionsLoading, setActionsLoading] = useState<Record<string, boolean>>({})
  const [regeneratingId, setRegeneratingId] = useState<string | undefined>()

  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeSuggestLoading, setComposeSuggestLoading] = useState(false)

  const actionsRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Persist + restore
  useEffect(() => {
    const saved = loadFromStorage<Record<string, { data: AnalysisSummary | null; loading: boolean; error: string | null }>>(LS_ANALYSES_KEY, {})
    const savedActions = loadFromStorage<Record<string, (ReplyAction | CalendarAction | TaskAction)[]>>(LS_ACTIONS_KEY, {})
    setAnalyses(Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, { ...v, loading: false, error: v.error ?? null }])))
    setActionsMap(savedActions)
  }, [])

  useEffect(() => { if (Object.keys(analyses).length > 0) saveToStorage(LS_ANALYSES_KEY, analyses) }, [analyses])
  useEffect(() => { if (Object.keys(actionsMap).length > 0) saveToStorage(LS_ACTIONS_KEY, actionsMap) }, [actionsMap])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, chatLoading])

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

  // --- Handlers ---

  const handleAnalyze = useCallback(async (threadId: string) => {
    if (analyses[threadId]?.data) return
    setAnalyses((prev) => ({ ...prev, [threadId]: { data: null, loading: true, error: null } }))
    setActionsLoading((prev) => ({ ...prev, [threadId]: true }))
    try {
      const [analysisRes, actionsRes] = await Promise.all([
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId }) }),
        fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId }) }),
      ])
      if (!analysisRes.ok) { const err = await analysisRes.json(); throw new Error(err.error ?? 'Analysis failed') }
      if (!actionsRes.ok) { const err = await actionsRes.json(); throw new Error(err.error ?? 'Actions failed') }
      const analysis: AnalysisSummary = await analysisRes.json()
      const actions: (ReplyAction | CalendarAction | TaskAction)[] = await actionsRes.json()
      setAnalyses((prev) => ({ ...prev, [threadId]: { data: analysis, loading: false, error: null } }))
      setActionsMap((prev) => ({ ...prev, [threadId]: actions }))
    } catch (err) {
      setAnalyses((prev) => ({ ...prev, [threadId]: { data: null, loading: false, error: err instanceof Error ? err.message : 'Something went wrong' } }))
    } finally {
      setActionsLoading((prev) => ({ ...prev, [threadId]: false }))
    }
  }, [analyses])

  const handleSelectThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId)
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)))
    setChatMessages([])
    handleAnalyze(threadId)
  }, [handleAnalyze])

  const handleApprove = (actionId: string) => {
    if (!selectedThreadId) return
    setActionsMap((prev) => ({ ...prev, [selectedThreadId]: prev[selectedThreadId]?.map((a) => a.id === actionId ? { ...a, status: 'approved' as const } : a) ?? [] }))
  }
  const handleDiscard = (actionId: string) => {
    if (!selectedThreadId) return
    setActionsMap((prev) => ({ ...prev, [selectedThreadId]: prev[selectedThreadId]?.map((a) => a.id === actionId ? { ...a, status: 'discarded' as const } : a) ?? [] }))
  }
  const handleRegenerate = async (actionId: string) => {
    if (!selectedThreadId) return
    const action = (actionsMap[selectedThreadId] ?? []).find((a) => a.id === actionId)
    if (!action) return
    setRegeneratingId(actionId)
    try {
      const res = await fetch('/api/regenerate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId: selectedThreadId, actionType: action.type }) })
      if (!res.ok) throw new Error('fail')
      const updated = await res.json()
      setActionsMap((prev) => ({ ...prev, [selectedThreadId]: prev[selectedThreadId]?.map((a) => a.id === actionId ? { ...updated, id: actionId } : a) ?? [] }))
    } catch {} finally { setRegeneratingId(undefined) }
  }

  const handleAISuggest = async () => {
    if (!composeSubject.trim()) return
    setComposeSuggestLoading(true)
    try {
      const res = await fetch('/api/compose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: composeSubject, context: composeTo ? `To: ${composeTo}` : undefined }) })
      if (res.ok) { const data = await res.json(); setComposeBody(data.body ?? '') }
    } catch {} finally { setComposeSuggestLoading(false) }
  }

  const handleSendChat = async (overrideMsg?: string) => {
    const msg = overrideMsg ?? chatInput
    if (!msg.trim()) return
    const userMsg: AIChatMessage = { id: `u-${Date.now()}`, role: 'user', content: msg.trim(), timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg.trim(), threadId: selectedThreadId }) })
      const data = await res.json()
      setChatMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.response ?? 'No response', timestamp: new Date().toISOString() }])
    } catch {
      setChatMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: 'Something went wrong. Try again.', timestamp: new Date().toISOString() }])
    } finally { setChatLoading(false) }
  }

  const scrollToActions = () => { actionsRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  // --- Computed ---

  const analysisCounts = useMemo(() => {
    const c = { urgent: 0, action: 0, fyi: 0, total: 0 }
    for (const s of Object.values(analyses)) {
      if (!s.data) continue
      c.total++
      if (s.data.priority === 'urgent') c.urgent++
      else if (s.data.priority === 'action') c.action++
      else c.fyi++
    }
    return c
  }, [analyses])

  const displayedThreads = useMemo(() => {
    const order: Record<string, number> = { urgent: 0, action: 1, fyi: 2 }
    return [...threads]
      .filter((t) => {
        const q = searchQuery.toLowerCase()
        if (q && !t.subject.toLowerCase().includes(q) && !t.from.name.toLowerCase().includes(q)) return false
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
        if (priorityFilter !== 'all') {
          const a = analyses[t.id]?.data
          if (!a) return false
          return a.priority === priorityFilter
        }
        return true
      })
      .sort((a, b) => {
        const ap = analyses[a.id]?.data?.priority
        const bp = analyses[b.id]?.data?.priority
        const ao = ap ? order[ap] ?? 3 : 3
        const bo = bp ? order[bp] ?? 3 : 3
        if (ao !== bo) return ao - bo
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
  }, [threads, searchQuery, categoryFilter, priorityFilter, analyses])

  const currentAnalysis = selectedThreadId ? (analyses[selectedThreadId] ?? null) : null
  const currentActions = selectedThreadId ? (actionsMap[selectedThreadId] ?? []) : []
  const pendingActions = currentActions.filter(a => a.status === 'pending').length

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'primary', label: 'Primary' },
    { key: 'company', label: 'Company' }, { key: 'promotion', label: 'Promo' },
    { key: 'social', label: 'Social' },
  ]

  // --- Render ---

  return (
    <main className="h-screen flex overflow-hidden bg-gray-100">
      {/* ===== Left Sidebar ===== */}
      <div className="w-14 bg-gray-900 flex flex-col items-center py-3 shrink-0">
        <Link href="/" title="Home" className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center mb-6 hover:bg-blue-500 transition-colors">
          <Mail className="w-4.5 h-4.5 text-white" />
        </Link>
        <button title="Inbox" className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-800 text-white mb-1">
          <Inbox className="w-[18px] h-[18px]" />
        </button>
        <div className="flex-1" />
        <button onClick={() => setAiPanelOpen(!aiPanelOpen)} title="AI Assistant"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${
            aiPanelOpen ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'
          }`}>
          <Bot className="w-[18px] h-[18px]" />
        </button>
        <Link href="/" title="Back to home" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors mt-1">
          <Home className="w-[18px] h-[18px]" />
        </Link>
      </div>

      {/* ===== Email List ===== */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Inbox</h1>
              <p className="text-xs text-gray-400 mt-0.5">{threads.length} conversations{analysisCounts.total > 0 ? ` · ${analysisCounts.total} analyzed` : ''}</p>
            </div>
            <Button size="sm" variant="default" onClick={() => setComposeOpen(true)} className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <PenSquare className="w-3.5 h-3.5" /> New
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <button key={c.key} onClick={() => setCategoryFilter(c.key)}
                className={`text-[11px] py-1 px-2.5 rounded-full font-medium transition-all ${
                  categoryFilter === c.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority quick-filters — only show when there are analyzed threads */}
        {analysisCounts.total > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            {analysisCounts.urgent > 0 && (
              <button onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all ${
                  priorityFilter === 'urgent' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-red-50'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{analysisCounts.urgent}
              </button>
            )}
            {analysisCounts.action > 0 && (
              <button onClick={() => setPriorityFilter(priorityFilter === 'action' ? 'all' : 'action')}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all ${
                  priorityFilter === 'action' ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-amber-50'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{analysisCounts.action}
              </button>
            )}
            {analysisCounts.fyi > 0 && (
              <button onClick={() => setPriorityFilter(priorityFilter === 'fyi' ? 'all' : 'fyi')}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all ${
                  priorityFilter === 'fyi' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-blue-50'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{analysisCounts.fyi}
              </button>
            )}
            {priorityFilter !== 'all' && (
              <button onClick={() => setPriorityFilter('all')} className="text-[11px] text-gray-400 hover:text-gray-600 ml-auto">Clear</button>
            )}
          </div>
        )}

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {displayedThreads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400">No matching emails</p>
            </div>
          ) : (
            displayedThreads.map(t => (
              <ThreadListItem key={t.id} thread={t} selected={selectedThreadId === t.id}
                analysis={analyses[t.id]?.data} onClick={() => handleSelectThread(t.id)} />
            ))
          )}
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedThread ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{selectedThread.subject}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedThread.from.name} &middot; {selectedThread.emails.length} message{selectedThread.emails.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentAnalysis?.data && <PriorityBadge priority={currentAnalysis.data.priority} />}
                  {pendingActions > 0 && (
                    <button onClick={scrollToActions} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" />{pendingActions} pending
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content scroll area */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4 max-w-3xl">
                {/* Analysis loading */}
                {currentAnalysis?.loading && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Analyzing thread...</p>
                      <p className="text-xs text-blue-600 mt-0.5">Reading {selectedThread.emails.length} messages</p>
                    </div>
                  </div>
                )}

                {/* Analysis error */}
                {currentAnalysis?.error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{currentAnalysis.error}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-100" onClick={() => {
                      setAnalyses((prev) => { const n = { ...prev }; delete n[selectedThread.id]; return n })
                      handleAnalyze(selectedThread.id)
                    }}>Retry</Button>
                  </div>
                )}

                {/* AI Summary Card */}
                {currentAnalysis?.data && (
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">AI Summary</span>
                      <PriorityBadge priority={currentAnalysis.data.priority} small />
                    </div>
                    <ul className="space-y-2">
                      {currentAnalysis.data.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2.5 leading-relaxed">
                          <span className="text-blue-400 mt-px shrink-0">&bull;</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Functional chips */}
                    {currentActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-200/70">
                        <button onClick={scrollToActions}
                          className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors flex items-center gap-1 shadow-sm">
                          <ArrowDown className="w-3 h-3" /> View {currentActions.length} suggested actions
                        </button>
                        <button onClick={() => setAiPanelOpen(true)}
                          className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors flex items-center gap-1 shadow-sm">
                          <Bot className="w-3 h-3" /> Ask AI about this
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Email messages */}
                {selectedThread.emails.map((email, idx) => (
                  <div key={email.id} className={`rounded-xl p-5 ${idx === selectedThread.emails.length - 1 ? 'border-2 border-blue-200 bg-blue-50/30' : 'border border-gray-200 bg-white'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          email.from.name === 'You' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {email.from.name === 'You' ? 'You' : (selectedThread.from.avatar || email.from.name.charAt(0))}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{email.from.name}</p>
                          <p className="text-xs text-gray-400">{timeAgo(email.timestamp)}</p>
                        </div>
                      </div>
                      {idx === selectedThread.emails.length - 1 && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Latest</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-11">{email.body}</div>
                    {email.attachments && email.attachments.length > 0 && (
                      <div className="mt-3 pl-11 flex flex-wrap gap-2">
                        {email.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-gray-700">{att.name}</span>
                            <span className="text-gray-400">{att.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Action Cards */}
                {currentActions.length > 0 && (
                  <div ref={actionsRef} className="pt-2">
                    <ActionCards actions={currentActions} onApprove={handleApprove} onDiscard={handleDiscard}
                      onRegenerate={handleRegenerate} regeneratingId={regeneratingId} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-900 font-medium">No email selected</p>
              <p className="text-sm text-gray-400 mt-1">Choose a conversation from the left to start. AI will analyze it automatically.</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== AI Assistant Panel ===== */}
      {aiPanelOpen && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">MailMate AI</span>
                {selectedThread && <p className="text-[11px] text-gray-400 leading-tight truncate max-w-[200px]">{selectedThread.subject}</p>}
              </div>
            </div>
            <button onClick={() => setAiPanelOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick actions — only shown when no messages yet */}
          {chatMessages.length === 0 && selectedThread && (
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick actions</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Summarize thread', msg: 'Give me a concise summary of this email thread' },
                  { label: 'Draft a reply', msg: 'Draft a professional reply to the latest email in this thread' },
                  { label: 'List action items', msg: 'What action items and tasks are mentioned in this thread?' },
                  { label: 'Find deadlines', msg: 'What are all the dates and deadlines mentioned?' },
                ].map(a => (
                  <button key={a.label} onClick={() => handleSendChat(a.msg)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatMessages.length === 0 && !selectedThread && (
              <div className="text-center py-12">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Select an email first, then ask me anything about it.</p>
              </div>
            )}
            {chatMessages.length === 0 && selectedThread && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Use a quick action above, or type your question below.</p>
              </div>
            )}
            {chatMessages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={selectedThread ? 'Ask about this email...' : 'Select an email first'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
                disabled={!selectedThread}
                className="flex-1 h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 disabled:opacity-50"
              />
              <Button size="sm" onClick={() => handleSendChat()} disabled={chatLoading || !chatInput.trim() || !selectedThread}
                className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Compose Modal ===== */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">New message</h2>
              <button onClick={() => setComposeOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input type="email" placeholder="recipient@example.com" value={composeTo} onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                <input type="text" placeholder="What is this about?" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">Message</label>
                  <Button size="sm" variant="ghost" onClick={handleAISuggest} disabled={composeSuggestLoading || !composeSubject.trim()}
                    className="h-6 text-xs gap-1 text-blue-600 hover:text-blue-700">
                    {composeSuggestLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Drafting...</> : <><Sparkles className="w-3 h-3" />AI Draft</>}
                  </Button>
                </div>
                <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={8} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setComposeOpen(false)}>Discard</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                onClick={() => { setComposeOpen(false); setComposeTo(''); setComposeSubject(''); setComposeBody('') }}>
                <Send className="w-3.5 h-3.5" /> Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

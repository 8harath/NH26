'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Mail, Search, ArrowLeft, PenSquare, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InboxList } from '@/components/inbox-list'
import { ThreadDetail } from '@/components/thread-detail'
import { ActionCards } from '@/components/action-cards'
import { mockThreads as initialThreads } from '@/data/emails'
import { AnalysisSummary, ReplyAction, CalendarAction, TaskAction, Thread } from '@/types'

type PriorityFilter = 'all' | 'urgent' | 'action' | 'fyi'

const LS_ANALYSES_KEY = 'mailmate-analyses'
const LS_ACTIONS_KEY = 'mailmate-actions'

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')

  const [analyses, setAnalyses] = useState<
    Record<string, { data: AnalysisSummary | null; loading: boolean; error: string | null }>
  >({})
  const [actionsMap, setActionsMap] = useState<
    Record<string, (ReplyAction | CalendarAction | TaskAction)[]>
  >({})
  const [actionsLoading, setActionsLoading] = useState<Record<string, boolean>>({})
  const [regeneratingId, setRegeneratingId] = useState<string | undefined>()

  // Compose modal state
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeSuggestLoading, setComposeSuggestLoading] = useState(false)

  // Load persisted data on mount
  useEffect(() => {
    const savedAnalyses = loadFromStorage<
      Record<string, { data: AnalysisSummary | null; loading: boolean; error: string | null }>
    >(LS_ANALYSES_KEY, {})
    const savedActions = loadFromStorage<
      Record<string, (ReplyAction | CalendarAction | TaskAction)[]>
    >(LS_ACTIONS_KEY, {})
    // Reset loading/error flags since we're restoring from storage
    const restoredAnalyses = Object.fromEntries(
      Object.entries(savedAnalyses).map(([k, v]) => [
        k,
        { ...v, loading: false, error: v.error ?? null },
      ])
    )
    setAnalyses(restoredAnalyses)
    setActionsMap(savedActions)
  }, [])

  // Persist analyses and actions whenever they change
  useEffect(() => {
    if (Object.keys(analyses).length > 0) {
      saveToStorage(LS_ANALYSES_KEY, analyses)
    }
  }, [analyses])

  useEffect(() => {
    if (Object.keys(actionsMap).length > 0) {
      saveToStorage(LS_ACTIONS_KEY, actionsMap)
    }
  }, [actionsMap])

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

  const handleAnalyze = useCallback(
    async (threadId: string) => {
      // Don't re-analyze if already done
      if (analyses[threadId]?.data) return

      setAnalyses((prev) => ({
        ...prev,
        [threadId]: { data: null, loading: true, error: null },
      }))
      setActionsLoading((prev) => ({ ...prev, [threadId]: true }))

      try {
        const [analysisRes, actionsRes] = await Promise.all([
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId }),
          }),
          fetch('/api/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId }),
          }),
        ])

        if (!analysisRes.ok) {
          const err = await analysisRes.json()
          throw new Error(err.error ?? 'Analysis failed')
        }
        if (!actionsRes.ok) {
          const err = await actionsRes.json()
          throw new Error(err.error ?? 'Actions failed')
        }

        const analysis: AnalysisSummary = await analysisRes.json()
        const actions: (ReplyAction | CalendarAction | TaskAction)[] = await actionsRes.json()

        setAnalyses((prev) => ({
          ...prev,
          [threadId]: { data: analysis, loading: false, error: null },
        }))
        setActionsMap((prev) => ({ ...prev, [threadId]: actions }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setAnalyses((prev) => ({
          ...prev,
          [threadId]: { data: null, loading: false, error: message },
        }))
      } finally {
        setActionsLoading((prev) => ({ ...prev, [threadId]: false }))
      }
    },
    [analyses]
  )

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setSelectedThreadId(threadId)
      // Mark thread as read
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
      )
      // Auto-analyze on select
      handleAnalyze(threadId)
    },
    [handleAnalyze]
  )

  const handleApprove = (actionId: string) => {
    if (!selectedThreadId) return
    setActionsMap((prev) => ({
      ...prev,
      [selectedThreadId]: prev[selectedThreadId]?.map((a) =>
        a.id === actionId ? { ...a, status: 'approved' as const } : a
      ) ?? [],
    }))
  }

  const handleDiscard = (actionId: string) => {
    if (!selectedThreadId) return
    setActionsMap((prev) => ({
      ...prev,
      [selectedThreadId]: prev[selectedThreadId]?.map((a) =>
        a.id === actionId ? { ...a, status: 'discarded' as const } : a
      ) ?? [],
    }))
  }

  const handleRegenerate = async (actionId: string) => {
    if (!selectedThreadId) return
    const actions = actionsMap[selectedThreadId] ?? []
    const action = actions.find((a) => a.id === actionId)
    if (!action) return

    setRegeneratingId(actionId)
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThreadId, actionType: action.type }),
      })

      if (!res.ok) throw new Error('Regeneration failed')
      const updated = await res.json()

      setActionsMap((prev) => ({
        ...prev,
        [selectedThreadId]: prev[selectedThreadId]?.map((a) =>
          a.id === actionId ? { ...updated, id: actionId } : a
        ) ?? [],
      }))
    } catch {
      // silently fail — keep existing action
    } finally {
      setRegeneratingId(undefined)
    }
  }

  // Stats counts
  const analysisCounts = useMemo(() => {
    let urgent = 0
    let action = 0
    let fyi = 0
    for (const state of Object.values(analyses)) {
      if (!state.data) continue
      if (state.data.priority === 'urgent') urgent++
      else if (state.data.priority === 'action') action++
      else if (state.data.priority === 'fyi') fyi++
    }
    return { urgent, action, fyi }
  }, [analyses])

  // Sorted + filtered thread list
  const displayedThreads = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, action: 1, fyi: 2 }

    let filtered = threads.filter((t) => {
      // Search filter
      const q = searchQuery.toLowerCase()
      if (q && !t.subject.toLowerCase().includes(q) && !t.from.name.toLowerCase().includes(q)) {
        return false
      }
      // Priority filter
      if (priorityFilter === 'all') return true
      const analysis = analyses[t.id]?.data
      if (!analysis) return false
      return analysis.priority === priorityFilter
    })

    // Sort: analyzed urgent first, then by timestamp desc
    filtered = [...filtered].sort((a, b) => {
      const aPriority = analyses[a.id]?.data?.priority
      const bPriority = analyses[b.id]?.data?.priority
      const aOrder = aPriority !== undefined ? priorityOrder[aPriority] ?? 3 : 3
      const bOrder = bPriority !== undefined ? priorityOrder[bPriority] ?? 3 : 3
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return filtered
  }, [threads, searchQuery, priorityFilter, analyses])

  const currentAnalysis = selectedThreadId ? (analyses[selectedThreadId] ?? null) : null
  const currentActions = selectedThreadId ? (actionsMap[selectedThreadId] ?? []) : []

  // Compose AI suggest
  const handleAISuggest = async () => {
    if (!composeSubject.trim()) return
    setComposeSuggestLoading(true)
    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: composeSubject, context: composeTo ? `To: ${composeTo}` : undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setComposeBody(data.body ?? '')
      }
    } catch {
      // ignore
    } finally {
      setComposeSuggestLoading(false)
    }
  }

  const filterTabs: { key: PriorityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'action', label: 'Action' },
    { key: 'fyi', label: 'FYI' },
  ]

  return (
    <main className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">MailMate</h1>
            <p className="text-sm text-muted-foreground">AI-powered inbox &middot; Groq LLM</p>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-border">
          {/* Sidebar header: stats + compose */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between gap-2">
              {/* Stats bar */}
              <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                {analysisCounts.urgent > 0 && (
                  <span className="text-red-600 font-medium">&#128308; {analysisCounts.urgent} Urgent</span>
                )}
                {analysisCounts.urgent > 0 && (analysisCounts.action > 0 || analysisCounts.fyi > 0) && (
                  <span>&middot;</span>
                )}
                {analysisCounts.action > 0 && (
                  <span className="text-amber-600 font-medium">&#128993; {analysisCounts.action} Action</span>
                )}
                {analysisCounts.action > 0 && analysisCounts.fyi > 0 && (
                  <span>&middot;</span>
                )}
                {analysisCounts.fyi > 0 && (
                  <span className="text-blue-600 font-medium">&#128309; {analysisCounts.fyi} FYI</span>
                )}
                {analysisCounts.urgent === 0 && analysisCounts.action === 0 && analysisCounts.fyi === 0 && (
                  <span>No analyses yet</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setComposeOpen(true)}
                className="flex items-center gap-1 shrink-0"
              >
                <PenSquare className="w-3.5 h-3.5" />
                Compose
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Priority filter tabs */}
            <div className="flex gap-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPriorityFilter(tab.key)}
                  className={`flex-1 text-xs py-1 px-2 rounded font-medium transition-colors ${
                    priorityFilter === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <InboxList
              threads={displayedThreads}
              selectedId={selectedThreadId}
              onSelectThread={handleSelectThread}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedThread ? (
            <>
              <div className="flex-1 overflow-y-auto">
                <ThreadDetail
                  thread={selectedThread}
                  analysis={currentAnalysis?.data ?? null}
                  loading={currentAnalysis?.loading ?? false}
                  error={currentAnalysis?.error ?? null}
                  onAnalyze={() => handleAnalyze(selectedThread.id)}
                />
              </div>
              {currentActions.length > 0 && (
                <div className="border-t border-border overflow-y-auto max-h-96">
                  <ActionCards
                    actions={currentActions}
                    onApprove={handleApprove}
                    onDiscard={handleDiscard}
                    onRegenerate={handleRegenerate}
                    regeneratingId={regeneratingId}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select an email to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">New Message</h2>
              <button
                onClick={() => setComposeOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
                <Input
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Subject</label>
                <Input
                  placeholder="Email subject..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-muted-foreground">Body</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAISuggest}
                    disabled={composeSuggestLoading || !composeSubject.trim()}
                    className="h-6 text-xs gap-1 text-blue-600 hover:text-blue-700"
                  >
                    {composeSuggestLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      <>AI Suggest</>
                    )}
                  </Button>
                </div>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-background text-foreground"
                  rows={8}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // In a real app this would send the email
                  setComposeOpen(false)
                  setComposeTo('')
                  setComposeSubject('')
                  setComposeBody('')
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Mail, Search, Check, X, Calendar, CheckSquare, ChevronDown, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Mock data for demonstration
const mockThreads = [
  {
    id: 'thread-1',
    from: { name: 'Sarah Chen', email: 'sarah.chen@acmecorp.com' },
    subject: 'Q2 Budget Review Meeting - Urgent',
    preview: 'We need to finalize the Q2 budget allocations before the board meeting next Tuesday...',
    timestamp: '2024-03-21T09:15:00Z',
    unreadCount: 3,
    emails: [
      {
        id: 'email-1',
        from: { name: 'Sarah Chen', email: 'sarah.chen@acmecorp.com' },
        body: `Hi,\n\nI hope this message finds you well. We need to finalize the Q2 budget allocations before the board meeting next Tuesday.\n\nThe Finance team has prepared preliminary numbers, but we need departmental leads to review and approve their respective allocations.\n\nKey deadlines:\n- Q2 Budget draft: Friday EOD\n- Final review: Monday morning\n- Board presentation: Tuesday 10am\n\nCould you please review the attached spreadsheet and confirm your team's numbers by Friday?\n\nBest regards,\nSarah`,
        timestamp: '2024-03-21T09:15:00Z',
      },
    ],
  },
  {
    id: 'thread-2',
    from: { name: 'Mike Rodriguez', email: 'mike.rodriguez@startup.io' },
    subject: 'Feature Request: OAuth Integration',
    preview: 'We have multiple clients requesting OAuth support. This would significantly improve our adoption...',
    timestamp: '2024-03-20T16:22:00Z',
    unreadCount: 2,
    emails: [
      {
        id: 'email-2',
        from: { name: 'Mike Rodriguez', email: 'mike.rodriguez@startup.io' },
        body: `Hey there,\n\nWe have multiple clients requesting OAuth support (Google, GitHub, Microsoft). This would significantly improve our adoption and reduce friction for enterprise customers.\n\nFrom our sales pipeline, I'd estimate we could close 3-4 deals if we had this feature within 6 weeks.\n\nCould you scope this out and provide an estimate? Would also help if we could get this on the roadmap ASAP.\n\nThanks!\nMike`,
        timestamp: '2024-03-20T16:22:00Z',
      },
    ],
  },
  {
    id: 'thread-3',
    from: { name: 'James Thompson', email: 'james.thompson@marketing.io' },
    subject: 'Campaign Performance Report - March',
    preview: 'The March campaign report is complete. Overall performance exceeded targets by 23%...',
    timestamp: '2024-03-19T10:00:00Z',
    unreadCount: 0,
    emails: [
      {
        id: 'email-3',
        from: { name: 'James Thompson', email: 'james.thompson@marketing.io' },
        body: `Hi,\n\nThe March campaign report is complete. Overall performance exceeded targets by 23%.\n\nKey metrics:\n- Reach: 2.3M impressions (+31% vs target)\n- Engagement: 45K interactions (+18% vs target)\n- Conversions: 1,250 leads (+28% vs target)\n- Cost per lead: $8.50 (-15% vs budget)\n\nThe social media strategy pivot in week 2 really paid off. Detailed analysis attached.\n\nJames`,
        timestamp: '2024-03-19T10:00:00Z',
      },
    ],
  },
]

const mockAnalysisMap: Record<string, { priority: 'urgent' | 'action' | 'fyi'; bullets: string[] }> = {
  'thread-1': {
    priority: 'urgent',
    bullets: [
      'Board meeting deadline is next Tuesday requiring finalized Q2 budget',
      'Department leads must review and confirm budget numbers by Friday EOD',
      'Final review meeting scheduled for Monday morning before presentation',
    ],
  },
  'thread-2': {
    priority: 'action',
    bullets: [
      'Multiple clients are requesting OAuth support (Google, GitHub, Microsoft)',
      'Estimated 3-4 pipeline deals could close if feature ships within 6 weeks',
      'Scope estimate and roadmap placement needed as soon as possible',
    ],
  },
  'thread-3': {
    priority: 'fyi',
    bullets: [
      'March campaign exceeded all targets — 23% above overall goal',
      'Strongest metric: reach at +31% vs target with cost per lead down 15%',
      'Exec summary requested and Q2 social strategy discussion planned',
    ],
  },
}

const mockActionsMap: Record<
  string,
  Array<{
    id: string
    type: 'reply' | 'calendar' | 'task'
    title: string
    description: string
    content?: string
    date?: string
    time?: string
    attendees?: string[]
    dueDate?: string
    priority?: string
    status: 'pending'
  }>
> = {
  'thread-1': [
    {
      id: 'action-1a',
      type: 'reply',
      title: 'Draft Reply',
      description: 'Confirm receipt and commitment to deadline',
      content:
        "Hi Sarah,\n\nThank you for the heads up. I've reviewed the numbers and they look accurate. I'll have my team's confirmed allocations to you by Friday EOD as requested.\n\nLooking forward to the board presentation on Tuesday.\n\nBest regards",
      status: 'pending',
    },
    {
      id: 'action-1b',
      type: 'calendar',
      title: 'Board Presentation',
      description: 'Schedule calendar event for budget review meeting',
      date: '2024-03-26',
      time: '10:00 AM',
      attendees: ['sarah.chen@acmecorp.com'],
      status: 'pending',
    },
    {
      id: 'action-1c',
      type: 'task',
      title: 'Review Budget Numbers',
      description: 'Review department allocations and confirm by Friday',
      dueDate: '2024-03-22',
      priority: 'high',
      status: 'pending',
    },
  ],
  'thread-2': [
    {
      id: 'action-2a',
      type: 'reply',
      title: 'Draft Reply',
      description: 'Acknowledge request and provide initial scoping timeline',
      content:
        "Hi Mike,\n\nThanks for flagging this — OAuth is definitely on our radar. I'll put together a detailed scope and estimate by end of week and we can align in our next sync.\n\nGoogle and GitHub integrations look achievable in 3-4 weeks if we prioritize.\n\nCheers",
      status: 'pending',
    },
    {
      id: 'action-2b',
      type: 'task',
      title: 'Scope OAuth Integration',
      description: 'Prepare technical estimate for Google, GitHub, and Microsoft OAuth',
      dueDate: '2024-03-25',
      priority: 'high',
      status: 'pending',
    },
  ],
  'thread-3': [
    {
      id: 'action-3a',
      type: 'reply',
      title: 'Draft Reply',
      description: 'Acknowledge great results and confirm exec summary request',
      content:
        "Hi James,\n\nFantastic results — well done to the whole team! The exec summary sounds great, looking forward to reviewing it.\n\nLet's schedule time next week to dive into the Q2 social strategy.\n\nThanks",
      status: 'pending',
    },
    {
      id: 'action-3b',
      type: 'task',
      title: 'Review Exec Summary',
      description: 'Review 1-pager from James when ready and share with board',
      dueDate: '2024-03-25',
      priority: 'medium',
      status: 'pending',
    },
  ],
}

const priorityConfig = {
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200', dotColor: 'bg-red-500' },
  action: { label: 'Action Required', color: 'bg-amber-100 text-amber-800 border-amber-200', dotColor: 'bg-amber-500' },
  fyi: { label: 'For Your Info', color: 'bg-blue-100 text-blue-800 border-blue-200', dotColor: 'bg-blue-500' },
}

export default function DemoPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>('thread-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({})
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const selectedThread = mockThreads.find((t) => t.id === selectedThreadId)
  const selectedAnalysis = selectedThreadId ? mockAnalysisMap[selectedThreadId] : null
  const selectedActions = selectedThreadId ? (mockActionsMap[selectedThreadId] ?? []) : []

  const filteredThreads = useMemo(() => {
    if (!searchQuery) return mockThreads
    return mockThreads.filter(
      (t) =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.from.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleApprove = (actionId: string) => {
    setActionStatuses((prev) => ({ ...prev, [actionId]: 'approved' }))
    showNotification('success', 'Action approved!')
  }

  const handleDiscard = (actionId: string) => {
    setActionStatuses((prev) => ({ ...prev, [actionId]: 'discarded' }))
    showNotification('info', 'Action discarded')
  }

  const handleCopy = (actionId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(actionId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'discarded':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <main className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">MailMate - Demo</h1>
            <p className="text-sm text-muted-foreground">Interactive preview (no AI required)</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 flex flex-col border-r border-border bg-muted/20">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredThreads.map((thread) => {
              const analysis = mockAnalysisMap[thread.id]
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-l-4 ${
                    selectedThreadId === thread.id
                      ? 'bg-background border-l-blue-500 shadow-sm'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`font-medium text-sm flex-1 ${thread.unreadCount > 0 ? 'font-bold' : ''}`}>
                      {thread.from.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {analysis && (
                        <span
                          className={`w-2 h-2 rounded-full ${priorityConfig[analysis.priority].dotColor}`}
                          title={priorityConfig[analysis.priority].label}
                        />
                      )}
                      {thread.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{thread.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{thread.preview}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(thread.timestamp).toLocaleDateString()}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-auto">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="border-b border-border p-6 bg-background">
                <h1 className="text-2xl font-bold text-foreground mb-2">{selectedThread.subject}</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {selectedThread.from.name} ({selectedThread.from.email})
                </p>

                {/* Analysis Summary */}
                {selectedAnalysis && (
                  <div
                    className={`p-4 border rounded-lg ${
                      priorityConfig[selectedAnalysis.priority].color
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          priorityConfig[selectedAnalysis.priority].dotColor
                        }`}
                      />
                      <span className="font-semibold">
                        {priorityConfig[selectedAnalysis.priority].label}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {selectedAnalysis.bullets.map((bullet, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="font-medium">&bull;</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Email Thread */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {selectedThread.emails.map((email) => (
                    <div key={email.id} className="border border-border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{email.from.name}</p>
                          <p className="text-sm text-muted-foreground">{email.from.email}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(email.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {email.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Cards */}
              <div className="border-t border-border p-6 bg-background">
                <h2 className="text-lg font-bold text-foreground mb-4">Suggested Actions</h2>
                <div className="space-y-4">
                  {selectedActions.map((action) => {
                    const status = actionStatuses[action.id] || 'pending'
                    const isExpanded = expandedActions[action.id] || false

                    return (
                      <div
                        key={action.id}
                        className={`border rounded-lg overflow-hidden ${getStatusColor(status)}`}
                      >
                        <button
                          onClick={() =>
                            setExpandedActions((prev) => ({ ...prev, [action.id]: !isExpanded }))
                          }
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {action.type === 'reply' && <Mail className="w-5 h-5 text-blue-600" />}
                            {action.type === 'calendar' && <Calendar className="w-5 h-5 text-purple-600" />}
                            {action.type === 'task' && <CheckSquare className="w-5 h-5 text-green-600" />}
                            <span className="font-semibold text-foreground">{action.title}</span>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              isExpanded ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="border-t border-current/20 p-4 space-y-3">
                            <p className="text-sm text-foreground">{action.description}</p>

                            {action.type === 'reply' && (
                              <textarea
                                defaultValue={action.content}
                                className="w-full px-3 py-2 border border-current/20 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={4}
                              />
                            )}

                            {action.type === 'calendar' && (
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium">Date:</span> {action.date}
                                </p>
                                <p>
                                  <span className="font-medium">Time:</span> {action.time}
                                </p>
                                <p>
                                  <span className="font-medium">Attendees:</span>{' '}
                                  {action.attendees?.join(', ')}
                                </p>
                              </div>
                            )}

                            {action.type === 'task' && (
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium">Due:</span> {action.dueDate}
                                </p>
                                <p>
                                  <span className="font-medium">Priority:</span>{' '}
                                  <span className="capitalize">{action.priority}</span>
                                </p>
                              </div>
                            )}

                            {status === 'pending' && (
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => handleApprove(action.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                {action.type === 'reply' && action.content && (
                                  <Button
                                    onClick={() => handleCopy(action.id, action.content!)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Copy className="w-4 h-4 mr-1" />
                                    {copiedId === action.id ? 'Copied!' : 'Copy'}
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDiscard(action.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Discard
                                </Button>
                              </div>
                            )}

                            {status === 'approved' && (
                              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                <Check className="w-4 h-4" />
                                Approved
                              </div>
                            )}

                            {status === 'discarded' && (
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <X className="w-4 h-4" />
                                Discarded
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/50">
              <div className="text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select an email to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-sm font-medium text-white shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
          }`}
        >
          {notification.message}
        </div>
      )}
    </main>
  )
}

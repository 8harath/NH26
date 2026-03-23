'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Mail, Search, Loader2, X, Inbox, Bot, Send, Sparkles,
  Calendar, ListChecks, Clock, AlertTriangle, Tag, Star,
  Copy, Check, MessageSquare, FileText, Link2, Users, DollarSign,
  Archive, Trash2, AlarmClock, PenLine,
  Wand2, Minimize2, Maximize2, CheckCheck, CornerUpLeft,
  LogIn, LogOut, CalendarPlus, ExternalLink,
  RefreshCw, Filter, ChevronDown, ChevronRight, Plus, PenSquare, CalendarDays, Menu
} from 'lucide-react'
import NextLink from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar as DayPickerCalendar } from '@/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/logo'
import { mockThreads } from '@/data/emails'
import {
  Thread, ComprehensiveAnalysis, Priority, EmailCategory,
  EmailSender,
  AIChatMessage, ThreadMeta, SidebarFolder, RewriteAction
} from '@/types'

// ─── Storage helpers ────────────────────────────────────────────

const LS_ANALYSES = 'mailmate-analyses'
const LS_META = 'mailmate-thread-meta'
const LS_SIDEBAR_PINNED = 'mailmate-sidebar-pinned'

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
  const first = Object.values(data)[0] as unknown as Record<string, unknown> | undefined
  if (first && !('summary' in first && 'smartReplies' in first)) {
    localStorage.removeItem(LS_ANALYSES)
    return {}
  }
  return data
}

const LS_LABELS = 'mailmate-user-labels'

const defaultMeta: ThreadMeta = { read: false, starred: false, snoozedUntil: null, archived: false, trashed: false, draft: '', userLabels: [] }

const initialMetas: Record<string, Partial<ThreadMeta>> = {
  'thread-1': { starred: true },
  'thread-2': { starred: true },
  'thread-4': { snoozedUntil: new Date(Date.now() + 172800000).toISOString() },
  'thread-5': { read: true },
  'thread-6': { read: true },
  'thread-12': { read: true },
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

interface SyncedCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  htmlLink?: string
  attendees: string[]
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function buildPreview(text: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  return cleaned.length > 140 ? `${cleaned.slice(0, 137)}...` : cleaned
}

function parseAddress(input: string): EmailSender {
  const trimmed = input.trim()
  const match = trimmed.match(/^(.*?)<(.+?)>$/)
  if (match) {
    const name = match[1].replace(/"/g, '').trim()
    const email = match[2].trim()
    return { name: name || email.split('@')[0], email }
  }

  const email = trimmed
  const local = email.includes('@') ? email.split('@')[0] : email
  const formattedName = local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

  return {
    name: formattedName || email,
    email,
  }
}

function formatCalendarEventLabel(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const monthLookup: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function parseEventDateTime(input: string, fallbackIso: string) {
  const source = input.trim()
  if (!source) return null

  const fallbackDate = new Date(fallbackIso)
  if (Number.isNaN(fallbackDate.getTime())) return null

  let resolvedDate = ''
  const isoMatch = source.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (isoMatch) {
    resolvedDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  const monthMatch = source.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i)
  if (!resolvedDate && monthMatch) {
    const month = monthLookup[monthMatch[1].toLowerCase()]
    const day = Number(monthMatch[2])
    const year = monthMatch[3] ? Number(monthMatch[3]) : fallbackDate.getFullYear()
    resolvedDate = `${year}-${padNumber(month + 1)}-${padNumber(day)}`
  }

  const relativeMatch = source.match(/\b(today|tomorrow)\b/i)
  if (!resolvedDate && relativeMatch) {
    const relativeDate = new Date(fallbackDate)
    if (relativeMatch[1].toLowerCase() === 'tomorrow') {
      relativeDate.setDate(relativeDate.getDate() + 1)
    }
    resolvedDate = toIsoDate(relativeDate)
  }

  if (!resolvedDate) return null

  let resolvedTime = ''
  const meridiemMatch = source.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1])
    const minutes = meridiemMatch[2] ? Number(meridiemMatch[2]) : 0
    const meridiem = meridiemMatch[3].toLowerCase()
    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
    resolvedTime = `${padNumber(hours)}:${padNumber(minutes)}`
  } else {
    const twentyFourHourMatch = source.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
    if (twentyFourHourMatch) {
      resolvedTime = `${padNumber(Number(twentyFourHourMatch[1]))}:${twentyFourHourMatch[2]}`
    }
  }

  return {
    date: resolvedDate,
    time: resolvedTime,
  }
}

// ─── Config maps ────────────────────────────────────────────────

const priorityConfig: Record<string, { label: string; cls: string; dot: string }> = {
  urgent:    { label: 'Urgent',    cls: 'bg-red-50 text-red-700 border-red-200/80 ring-1 ring-red-100',       dot: 'bg-red-500' },
  important: { label: 'Important', cls: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-100', dot: 'bg-amber-500' },
  normal:    { label: 'Normal',    cls: 'bg-gray-50 text-gray-600 border-gray-200/80',                         dot: 'bg-gray-400' },
  low:       { label: 'Low',       cls: 'bg-slate-50 text-slate-500 border-slate-200/80',                      dot: 'bg-slate-300' },
}

const categoryConfig: Record<string, { label: string; cls: string; dot: string }> = {
  work:     { label: 'Work',     cls: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  personal: { label: 'Personal', cls: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  finance:  { label: 'Finance',  cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  updates:  { label: 'Updates',  cls: 'bg-cyan-50 text-cyan-700',    dot: 'bg-cyan-500' },
  spam:     { label: 'Spam',     cls: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
}

const sidebarItems: { folder: SidebarFolder; icon: typeof Inbox; label: string }[] = [
  { folder: 'inbox', icon: Inbox, label: 'Inbox' },
  { folder: 'starred', icon: Star, label: 'Starred' },
  { folder: 'snoozed', icon: AlarmClock, label: 'Snoozed' },
  { folder: 'sent', icon: Send, label: 'Sent' },
  { folder: 'drafts', icon: PenLine, label: 'Drafts' },
  { folder: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { folder: 'trash', icon: Trash2, label: 'Trash' },
  { folder: 'all', icon: Mail, label: 'All Mail' },
]

const folderMeta: Record<SidebarFolder, {
  label: string
  emptyTitle: string
  emptyDescription: string
}> = {
  inbox: {
    label: 'Inbox',
    emptyTitle: 'Inbox is clear',
    emptyDescription: 'No conversations are waiting here right now. New mail will appear as soon as it arrives.',
  },
  starred: {
    label: 'Starred',
    emptyTitle: 'No starred conversations',
    emptyDescription: 'Important threads you star will stay collected here for quick access.',
  },
  snoozed: {
    label: 'Snoozed',
    emptyTitle: 'Nothing is snoozed',
    emptyDescription: 'Snoozed emails will reappear here until their reminder time is over.',
  },
  sent: {
    label: 'Sent',
    emptyTitle: 'No sent mail yet',
    emptyDescription: 'Messages you send from MailMate will be available here so you can review the full thread.',
  },
  drafts: {
    label: 'Drafts',
    emptyTitle: 'No drafts saved',
    emptyDescription: 'Draft replies and unfinished messages will show up here instead of disappearing.',
  },
  calendar: {
    label: 'Calendar',
    emptyTitle: 'No calendar events found',
    emptyDescription: 'Connect Google Calendar or refresh the sync to load your upcoming schedule and meeting context.',
  },
  trash: {
    label: 'Trash',
    emptyTitle: 'Trash is empty',
    emptyDescription: 'Deleted conversations land here. If nothing is shown, there is nothing to clean up.',
  },
  all: {
    label: 'All Mail',
    emptyTitle: 'No mail available',
    emptyDescription: 'This workspace does not have any visible conversations yet.',
  },
}

function titleCase(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function deriveThreadTags(thread: Thread, analysis: ComprehensiveAnalysis | null | undefined, meta: ThreadMeta) {
  const tags: string[] = []
  const attachments = thread.emails.some(email => (email.attachments?.length ?? 0) > 0)

  tags.push(titleCase(analysis?.category ?? thread.category))

  if (analysis?.priority) tags.push(priorityConfig[analysis.priority]?.label ?? titleCase(analysis.priority))
  if (analysis?.senderImportance === 'vip') tags.push('VIP')
  if (analysis?.followUpNeeded) tags.push('Needs Reply')
  if (analysis?.meetings.length) tags.push('Meeting')
  if (analysis?.tasks.length) tags.push('Task')
  if (analysis?.deadlines.length) tags.push('Deadline')
  if (attachments) tags.push('Attachment')
  if (meta.starred) tags.push('Starred')
  if (!meta.read) tags.push('Unread')
  if (meta.userLabels.length) tags.push(...meta.userLabels.slice(0, 2))

  return Array.from(new Set(tags)).slice(0, 6)
}

function inferCalendarCandidates(thread: Thread, analysis: ComprehensiveAnalysis) {
  const normalizedMeetings = analysis.meetings
    .filter(meeting => meeting.date)
    .map(meeting => ({
      title: meeting.title || thread.subject,
      date: meeting.date,
      time: meeting.time || '',
      attendees: meeting.attendees,
    }))

  if (normalizedMeetings.length > 0) {
    return normalizedMeetings
  }

  const schedulingPattern = /\b(meeting|meet|call|sync|review|demo|interview|calendar|invite|appointment)\b/i
  const participants = Array.from(
    new Set(
      thread.emails.flatMap(email => [
        email.from.email,
        ...email.to.map(recipient => recipient.email),
      ]).filter(Boolean)
    )
  ).slice(0, 6)

  const candidateSnippets = [
    ...analysis.keyInfo.dates,
    ...thread.emails.flatMap(email => email.body.split(/\n|(?<=[.!?])/)),
  ]

  const inferredMeetings: ComprehensiveAnalysis['meetings'] = []
  for (const snippet of candidateSnippets) {
    const trimmed = snippet.trim()
    if (!trimmed) continue

    const parsed = parseEventDateTime(trimmed, thread.timestamp)
    if (!parsed) continue
    if (!schedulingPattern.test(trimmed) && !parsed.time) continue

    inferredMeetings.push({
      title: thread.subject.replace(/^re:\s*/i, '') || 'Meeting',
      date: parsed.date,
      time: parsed.time,
      attendees: participants,
    })
  }

  return inferredMeetings.filter((meeting, index, list) => (
    list.findIndex(candidate => (
      candidate.date === meeting.date &&
      candidate.time === meeting.time &&
      candidate.title === meeting.title
    )) === index
  )).slice(0, 3)
}

function getPositiveReply(thread: Thread, analysis: ComprehensiveAnalysis) {
  const positiveCandidate = analysis.smartReplies.find(reply => !/\b(no|not|can't|cannot|decline|unable|won't|pass)\b/i.test(reply))
  if (positiveCandidate) return positiveCandidate
  if (analysis.meetings.length > 0) return `This works for me. Please send the invite and I'll be there.`
  if (analysis.tasks.length > 0 || analysis.followUpNeeded) return `Thanks for sending this over. I'll take care of it and follow up shortly.`
  return `Thanks for the note about "${thread.subject}". This works for me and I'll move forward on my side.`
}

function getDeclineReply(thread: Thread, analysis: ComprehensiveAnalysis) {
  if (analysis.meetings.length > 0) {
    return `Thanks for the invitation. I won't be able to join this meeting, so please proceed without me or share notes afterward.`
  }

  switch (analysis.category) {
    case 'spam':
      return `Thanks for reaching out. I'm going to pass on this and won't take any action on it.`
    case 'updates':
      return `Thanks for the update. I don't need to take this forward from my side right now.`
    case 'finance':
      return `Thanks for sending this over. I can't approve or commit to this request at the moment.`
    case 'personal':
      return `Thanks for thinking of me. I won't be able to commit to this right now.`
    default:
      return `Thanks for the note. I won't be able to take this on right now, so please move ahead without me.`
  }
}

function buildQuickReplyOptions(thread: Thread, analysis: ComprehensiveAnalysis) {
  return [
    {
      kind: 'positive' as const,
      label: 'Positive',
      text: getPositiveReply(thread, analysis),
      tone: 'Approve or accept the request',
      classes: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50',
    },
    {
      kind: 'decline' as const,
      label: 'Decline',
      text: getDeclineReply(thread, analysis),
      tone: 'Politely decline or opt out',
      classes: 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100',
    },
  ]
}

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString()
}

function FolderEmptyState({
  folder,
  search,
  hasFilters,
  isAuthenticated,
  compact = false,
  onClearSearch,
  onClearFilters,
  onRefresh,
}: {
  folder: SidebarFolder
  search: string
  hasFilters: boolean
  isAuthenticated: boolean
  compact?: boolean
  onClearSearch: () => void
  onClearFilters: () => void
  onRefresh: () => void
}) {
  const iconMap: Record<SidebarFolder, typeof Inbox> = {
    inbox: Inbox,
    starred: Star,
    snoozed: AlarmClock,
    sent: Send,
    drafts: PenLine,
    calendar: CalendarDays,
    trash: Trash2,
    all: Mail,
  }

  const Icon = iconMap[folder]
  const searchLabel = search.trim()
  const hasSearch = searchLabel.length > 0
  const title = hasSearch || hasFilters
    ? 'Nothing matches this view'
    : folderMeta[folder].emptyTitle
  const description = hasSearch || hasFilters
    ? `MailMate could not find conversations in ${folderMeta[folder].label.toLowerCase()} for the current search or filters.`
    : folderMeta[folder].emptyDescription

  return (
    <Empty className={compact ? 'gap-4 rounded-2xl border-none px-4 py-12' : 'min-h-full gap-5 rounded-[1.75rem] border border-dashed border-gray-200 bg-white/80 p-10 shadow-sm'}>
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon" className={compact ? 'size-12 rounded-2xl bg-gray-100 text-gray-500' : 'size-14 rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-100 text-blue-700'}>
          <Icon className={compact ? 'size-6' : 'size-7'} />
        </EmptyMedia>
        <EmptyTitle className={compact ? 'text-base text-gray-700' : 'text-2xl text-gray-900'}>{title}</EmptyTitle>
        <EmptyDescription className={compact ? 'text-sm text-gray-500' : 'text-base text-gray-500'}>
          {description}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent className={compact ? 'max-w-xs gap-2' : 'max-w-md gap-3'}>
        {hasSearch && (
          <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
            Search: {searchLabel}
          </Badge>
        )}
        {hasFilters && (
          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
            Filters active
          </Badge>
        )}
        <div className={`flex ${compact ? 'flex-col' : 'flex-wrap'} items-center justify-center gap-2`}>
          {hasSearch && (
            <Button variant="outline" size={compact ? 'sm' : 'default'} className="rounded-full" onClick={onClearSearch}>
              Clear search
            </Button>
          )}
          {hasFilters && (
            <Button variant="outline" size={compact ? 'sm' : 'default'} className="rounded-full" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
          {isAuthenticated && !hasSearch && !hasFilters && folder !== 'calendar' && (
            <Button variant="outline" size={compact ? 'sm' : 'default'} className="rounded-full" onClick={onRefresh}>
              Refresh mailbox
            </Button>
          )}
        </div>
      </EmptyContent>
    </Empty>
  )
}

function CalendarWorkspace({
  events,
  loading,
  error,
  selectedDate,
  onDateSelect,
  onRefresh,
  onConnect,
  isAuthenticated,
}: {
  events: SyncedCalendarEvent[]
  loading: boolean
  error: string | null
  selectedDate: Date
  onDateSelect: (date: Date | undefined) => void
  onRefresh: () => void
  onConnect: () => void
  isAuthenticated: boolean
}) {
  const upcomingEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const selectedEvents = upcomingEvents.filter(event => isSameDay(new Date(event.start), selectedDate))
  const nextEvent = upcomingEvents[0] ?? null
  const todayCount = upcomingEvents.filter(event => isSameDay(new Date(event.start), new Date())).length

  return (
    <div className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f9fafb_100%)] p-6">
      <div className="grid h-full gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-gray-200/80 bg-white/90 shadow-xl shadow-blue-100/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900">Calendar cockpit</CardTitle>
                <CardDescription className="mt-1 text-gray-500">
                  Review upcoming meetings, focus days, and event context without leaving the inbox.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={isAuthenticated ? onRefresh : onConnect}>
                {isAuthenticated ? 'Refresh' : 'Connect'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Upcoming</p>
                <p className="mt-2 text-2xl font-bold text-blue-950">{upcomingEvents.length}</p>
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Today</p>
                <p className="mt-2 text-2xl font-bold text-cyan-950">{todayCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Next</p>
                <p className="mt-2 text-sm font-bold leading-tight text-emerald-950">
                  {nextEvent ? formatCalendarEventLabel(nextEvent.start) : 'No event'}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-gray-200 bg-white/90 p-3 shadow-sm">
              <DayPickerCalendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                className="w-full"
                classNames={{
                  root: 'w-full',
                  months: 'w-full',
                  month: 'w-full',
                  table: 'w-full',
                }}
              />
            </div>

            {nextEvent && (
              <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Next meeting</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{nextEvent.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatCalendarEventLabel(nextEvent.start)}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                    {nextEvent.attendees.length} attendee{nextEvent.attendees.length === 1 ? '' : 's'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden border-gray-200/80 bg-white/92 shadow-xl shadow-cyan-100/20">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900">
                  Agenda for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </CardTitle>
                <CardDescription className="mt-1 text-gray-500">
                  Upcoming events stay linked to Google Calendar so users can jump straight into the original booking.
                </CardDescription>
              </div>
              {loading && <Loader2 className="mt-1 h-4 w-4 animate-spin text-blue-500" />}
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 px-0 pb-0">
            {!isAuthenticated ? (
              <Empty className="m-6 flex-1 rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50/60">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-14 rounded-3xl bg-blue-50 text-blue-700">
                    <CalendarDays className="size-7" />
                  </EmptyMedia>
                  <EmptyTitle>Connect Google Calendar</EmptyTitle>
                  <EmptyDescription>
                    Calendar sync is ready, but the app needs your Google session before it can pull live events.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button className="rounded-full" onClick={onConnect}>Connect Gmail and Calendar</Button>
                </EmptyContent>
              </Empty>
            ) : error ? (
              <Empty className="m-6 flex-1 rounded-[1.5rem] border border-dashed border-red-200 bg-red-50/40">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-14 rounded-3xl bg-red-100 text-red-700">
                    <AlertTriangle className="size-7" />
                  </EmptyMedia>
                  <EmptyTitle>Calendar sync needs attention</EmptyTitle>
                  <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" className="rounded-full" onClick={onRefresh}>Try again</Button>
                </EmptyContent>
              </Empty>
            ) : selectedEvents.length === 0 ? (
              <Empty className="m-6 flex-1 rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50/60">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-14 rounded-3xl bg-cyan-50 text-cyan-700">
                    <CalendarDays className="size-7" />
                  </EmptyMedia>
                  <EmptyTitle>No meetings on this date</EmptyTitle>
                  <EmptyDescription>
                    The selected day is clear. Use the calendar to inspect another day or refresh to check for new invites.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" className="rounded-full" onClick={onRefresh}>Refresh events</Button>
                </EmptyContent>
              </Empty>
            ) : (
              <ScrollArea className="h-full w-full">
                <div className="space-y-4 p-6">
                  {selectedEvents.map(event => (
                    <div
                      key={event.id}
                      className="rounded-[1.5rem] border border-gray-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(255,255,255,0.95))] p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                              {formatCalendarEventLabel(event.start)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Ends {formatCalendarEventLabel(event.end)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {event.attendees.length > 0 ? event.attendees.map(attendee => (
                              <Badge key={attendee} variant="outline" className="rounded-full border-gray-200 bg-white text-gray-600">
                                <Users className="h-3 w-3" />
                                {attendee}
                              </Badge>
                            )) : (
                              <Badge variant="outline" className="rounded-full border-gray-200 bg-white text-gray-600">
                                No attendee list
                              </Badge>
                            )}
                          </div>
                        </div>
                        {event.htmlLink && (
                          <Button asChild variant="outline" size="sm" className="rounded-full">
                            <a href={event.htmlLink} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Small components ───────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityConfig[priority] ?? priorityConfig.normal
  return <span className={`inline-flex items-center border rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${c.cls}`}>{c.label}</span>
}

function CategoryBadge({ category }: { category: string }) {
  const c = categoryConfig[category] ?? categoryConfig.work
  return <span className={`inline-flex items-center rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${c.cls}`}>{c.label}</span>
}

function SenderBadge({ importance }: { importance: string }) {
  if (importance === 'vip') return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Star className="w-3 h-3 fill-amber-500" /> VIP</span>
  return null
}

// ─── Thread list item ───────────────────────────────────────────

function ThreadListItem({ thread, selected, analysis, meta, onSelect, onStar }: {
  thread: Thread; selected: boolean; analysis?: ComprehensiveAnalysis | null
  meta: ThreadMeta; onSelect: () => void; onStar: () => void
}) {
  const dotColor: Record<string, string> = { urgent: 'bg-red-500', important: 'bg-amber-500', normal: 'bg-gray-300', low: 'bg-slate-200' }
  const isUnread = !meta.read
  const overviewTags = deriveThreadTags(thread, analysis, meta).slice(0, 3)

  return (
    <button onClick={onSelect}
      className={`w-full text-left px-4 py-3 transition-all border-l-[3px] group ${
        selected
          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border-l-blue-600'
          : 'border-l-transparent hover:bg-gray-50/80'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5 font-semibold transition-colors ${
          isUnread
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {thread.from.avatar || thread.from.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
              {thread.from.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={e => { e.stopPropagation(); onStar() }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                <Star className={`w-3.5 h-3.5 ${meta.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'}`} />
              </button>
              <span className="text-[11px] text-gray-400 font-medium">{timeAgo(thread.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {analysis && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[analysis.priority] ?? 'bg-gray-300'}`} />}
            <p className={`text-[13px] truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {thread.subject}
            </p>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{thread.preview}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {meta.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
            {analysis && <CategoryBadge category={analysis.category} />}
            {analysis?.followUpNeeded && (
              <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-0.5 bg-orange-50 px-1.5 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" />Follow-up
              </span>
            )}
            {meta.snoozedUntil && (
              <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-0.5 bg-purple-50 px-1.5 py-0.5 rounded-full">
                <AlarmClock className="w-2.5 h-2.5" />Snoozed
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {overviewTags.map(tag => (
              <Badge key={tag} variant="outline" className="rounded-full border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Analysis sections ──────────────────────────────────────────

function SummarySection({ thread, analysis, meta }: { thread: Thread; analysis: ComprehensiveAnalysis; meta: ThreadMeta }) {
  const overviewTags = deriveThreadTags(thread, analysis, meta)
  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={analysis.priority} />
          <CategoryBadge category={analysis.category} />
          <SenderBadge importance={analysis.senderImportance} />
          {overviewTags.map(tag => (
            <Badge key={tag} variant="outline" className="rounded-full border-gray-200 bg-gray-50 text-gray-600">
              <Tag className="w-3 h-3" />
              {tag}
            </Badge>
          ))}
        </div>
        <div>
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Executive summary
          </CardTitle>
          <CardDescription className="mt-1 text-gray-500">
            Condensed thread context for fast review before you approve the next action.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <ul className="space-y-3">
          {analysis.summary.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
              <p className="text-sm leading-relaxed text-gray-700">{s}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function SmartRepliesSection({ thread, analysis, onUseReply }: { thread: Thread; analysis: ComprehensiveAnalysis; onUseReply: (text: string) => void }) {
  const replies = buildQuickReplyOptions(thread, analysis)
  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Quick replies
        </CardTitle>
        <CardDescription className="text-gray-500">
          One affirmative option and one decline option, ready to place into the reply composer.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 lg:grid-cols-2">
        {replies.map(reply => (
          <button
            key={reply.kind}
            onClick={() => onUseReply(reply.text)}
            className={`rounded-2xl border p-4 text-left transition-all ${reply.classes}`}
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline" className="rounded-full border-current/15 bg-white/70 text-current">
                {reply.label}
              </Badge>
              <span className="text-[11px] font-medium text-gray-500">{reply.tone}</span>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed">{reply.text}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

function DraftReplySection({ draft }: { draft: string }) {
  const [copied, setCopied] = useState(false)
  if (!draft) return null
  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <FileText className="w-4 h-4 text-blue-600" />
          Drafted reply
        </CardTitle>
        <CardDescription className="text-gray-500">
          A full professional draft built from the latest thread context.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative p-5">
        <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8 leading-relaxed">{draft}</p>
        <button onClick={() => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </CardContent>
    </Card>
  )
}

function MeetingsSection({
  meetings,
  isAuthenticated,
  onCalendarAdded,
  onOpenCalendar,
}: {
  meetings: ComprehensiveAnalysis['meetings']
  isAuthenticated?: boolean
  onCalendarAdded?: () => void
  onOpenCalendar?: () => void
}) {
  const [addingIdx, setAddingIdx] = useState<number | null>(null)
  const [addedIdx, setAddedIdx] = useState<Set<number>>(new Set())
  const [eventLinks, setEventLinks] = useState<Record<number, string>>({})

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
        const data = await res.json()
        setAddedIdx(prev => new Set(prev).add(idx))
        if (data.event?.htmlLink) {
          setEventLinks(prev => ({ ...prev, [idx]: data.event.htmlLink as string }))
        }
        onCalendarAdded?.()
      }
    } catch { /* ignore */ }
    finally { setAddingIdx(null) }
  }

  if (meetings.length === 0) return null
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Meeting actions
        </CardTitle>
        <CardDescription className="text-gray-500">
          Calendar-ready events extracted from the thread.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {meetings.map((m, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3 text-emerald-500" />{m.date}</span>
                  {m.time && <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3 text-blue-500" />{m.time}</span>}
                </div>
                {m.attendees.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.attendees.map(attendee => (
                      <Badge key={attendee} variant="outline" className="rounded-full border-gray-200 bg-white text-gray-600">
                        <Users className="w-3 h-3" />
                        {attendee}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {isAuthenticated && (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    onClick={() => addToCalendar(m, i)}
                    disabled={addingIdx === i || addedIdx.has(i)}
                    variant="outline"
                    size="sm"
                    className={`rounded-xl ${
                      addedIdx.has(i)
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {addingIdx === i ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     addedIdx.has(i) ? <><Check className="w-3 h-3" /> Added</> :
                     <><CalendarPlus className="w-3 h-3" /> Add to calendar</>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenCalendar}
                    className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <CalendarDays className="w-3 h-3" />
                    Calendar
                  </Button>
                  {eventLinks[i] && (
                    <Button asChild variant="ghost" size="sm" className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                      <a href={eventLinks[i]} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3" />
                        Open event
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TasksSection({ tasks }: { tasks: ComprehensiveAnalysis['tasks'] }) {
  if (tasks.length === 0) return null
  const color: Record<string, string> = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-gray-500 bg-gray-50' }
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5 text-rose-500" /> Extracted Tasks
      </p>
      <div className="space-y-2">
        {tasks.map((t, i) => (
          <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="w-5 h-5 rounded-lg border-2 border-gray-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-medium">{t.title}</p>
              {t.deadline && <p className="text-xs text-gray-400 mt-0.5">Due: {t.deadline}</p>}
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color[t.priority] ?? 'text-gray-500 bg-gray-50'}`}>{t.priority}</span>
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
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Deadlines
      </p>
      <div className="space-y-2">
        {deadlines.map((d, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-sm ${
            d.urgent ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-white border border-gray-200 text-gray-700'
          }`}>
            {d.urgent && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            <span className="flex-1">{d.description}</span>
            <span className="text-xs text-gray-500 shrink-0 font-semibold">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyInfoSection({ keyInfo }: { keyInfo: ComprehensiveAnalysis['keyInfo'] }) {
  const sections = [
    { icon: Calendar, label: 'Dates', items: keyInfo.dates, color: 'text-blue-600' },
    { icon: Link2, label: 'Links', items: keyInfo.links, color: 'text-emerald-600' },
    { icon: Users, label: 'Contacts', items: keyInfo.contacts, color: 'text-purple-600' },
    { icon: DollarSign, label: 'Amounts', items: keyInfo.amounts, color: 'text-amber-600' },
  ].filter(s => s.items.length > 0)
  if (sections.length === 0) return null
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Key Information
      </p>
      <div className="grid grid-cols-2 gap-3">
        {sections.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
            <p className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${s.color}`}>
              <s.icon className="w-3 h-3" />{s.label}
            </p>
            {s.items.map((item, i) => <p key={i} className="text-xs text-gray-700 truncate font-medium">{item}</p>)}
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowUpSection({ needed, suggestion }: { needed: boolean; suggestion: string }) {
  if (!needed) return null
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,1),rgba(255,255,255,1))] p-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4 text-orange-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-orange-800">Follow-up needed</p>
        {suggestion && <p className="text-xs text-orange-600 mt-1 leading-relaxed">{suggestion}</p>}
      </div>
    </div>
  )
}

// ─── Compose panel with AI writing tools ────────────────────────

function ComposePanel({ thread, initialText, meta, onUpdateDraft, onClose, isAuthenticated, senderName, recipientName, userEmail, onSent }: {
  thread: Thread; initialText: string; meta: ThreadMeta
  onUpdateDraft: (text: string) => void; onClose: () => void; isAuthenticated?: boolean
  senderName?: string; recipientName?: string
  userEmail?: string
  onSent?: (payload: { to: EmailSender; subject: string; body: string }) => void
}) {
  const [text, setText] = useState(initialText || meta.draft || '')
  const [rewriting, setRewriting] = useState<RewriteAction | null>(null)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (text !== meta.draft) onUpdateDraft(text)
  }, [meta.draft, onUpdateDraft, text])
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
        body: JSON.stringify({ text, action, senderName, recipientName })
      })
      const data = await res.json()
      if (data.text) setText(data.text)
    } catch { /* ignore */ }
    finally { setRewriting(null) }
  }, [text, rewriting, senderName, recipientName])

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    let didSend = !isAuthenticated

    const lastEmail = thread.emails[thread.emails.length - 1]
    const replyToEmail = userEmail && normalizeEmail(lastEmail.from.email) === normalizeEmail(userEmail)
      ? thread.from.email
      : lastEmail.from.email
    const replyToName = recipientName || thread.from.name

    if (isAuthenticated) {
      try {
        const res = await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: replyToEmail,
            subject: `Re: ${thread.subject}`,
            body: text,
            threadId: thread.id,
          })
        })
        if (!res.ok) throw new Error('Send failed')
        didSend = true
      } catch (err) { console.error('Send failed:', err) }
    }

    if (!didSend) {
      setSending(false)
      return
    }

    onSent?.({
      to: { name: replyToName, email: replyToEmail },
      subject: `Re: ${thread.subject}`,
      body: text,
    })
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
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <CornerUpLeft className="w-3.5 h-3.5 text-blue-500" /> Replying to {recipientName || thread.from.name}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write your reply..."
          rows={5}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 transition-all"
        />

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-1">AI Tools</span>
          {aiTools.map(t => (
            <button key={t.action} onClick={() => handleRewrite(t.action)}
              disabled={!text.trim() || !!rewriting}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {rewriting === t.action ? <Loader2 className="w-3 h-3 animate-spin" /> : <t.icon className="w-3 h-3" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px] text-gray-400 font-medium">{text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} words` : ''}</p>
          <Button size="sm" onClick={handleSend} disabled={!text.trim() || sent || sending}
            className={`rounded-xl px-5 ${sent ? 'bg-green-600 hover:bg-green-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>
            {sending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending...</> :
             sent ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Sent{isAuthenticated ? ' via Gmail' : ''}</> :
             <><Send className="w-3.5 h-3.5 mr-1.5" /> {isAuthenticated ? 'Send via Gmail' : 'Send'}</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── New Email Compose ──────────────────────────────────────────

function NewComposePanel({ onClose, isAuthenticated, senderName, onSent }: {
  onClose: () => void; isAuthenticated?: boolean; senderName?: string
  onSent?: (payload: { to: EmailSender; subject: string; body: string }) => void
}) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [rewriting, setRewriting] = useState<RewriteAction | null>(null)

  const handleRewrite = async (action: RewriteAction) => {
    if (!body.trim() || rewriting) return
    setRewriting(action)
    try {
      // Try to extract recipient name from the "to" field
      const recipientName = to.includes('<') ? to.split('<')[0].trim() : to.split('@')[0]
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, action, senderName, recipientName: recipientName || undefined })
      })
      const data = await res.json()
      if (data.text) setBody(data.text)
    } catch { /* ignore */ }
    finally { setRewriting(null) }
  }

  const handleSend = async () => {
    if (sending || !to.trim() || !subject.trim() || !body.trim()) return
    setSending(true)
    try {
      if (isAuthenticated) {
        const res = await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body })
        })
        if (!res.ok) throw new Error('Send failed')
      }
      onSent?.({ to: parseAddress(to), subject, body })
      setSent(true)
      setTimeout(() => { onClose() }, 1500)
    } catch (err) { console.error('Send failed:', err) }
    finally { setSending(false) }
  }

  const aiTools: { action: RewriteAction; icon: typeof Wand2; label: string }[] = [
    { action: 'fix-grammar', icon: CheckCheck, label: 'Fix Grammar' },
    { action: 'formalize', icon: Wand2, label: 'Formalize' },
    { action: 'shorten', icon: Minimize2, label: 'Shorten' },
    { action: 'elaborate', icon: Maximize2, label: 'Elaborate' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <PenSquare className="w-4 h-4 text-blue-600" /> New Email
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-3 flex-1 overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">To</label>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@email.com"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email..."
              rows={8}
              className="w-full text-sm border border-gray-200 rounded-xl p-4 mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 transition-all" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-1">AI Tools</span>
            {aiTools.map(t => (
              <button key={t.action} onClick={() => handleRewrite(t.action)}
                disabled={!body.trim() || !!rewriting}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {rewriting === t.action ? <Loader2 className="w-3 h-3 animate-spin" /> : <t.icon className="w-3 h-3" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">{body.length > 0 ? `${body.split(/\s+/).filter(Boolean).length} words` : ''}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button size="sm" onClick={handleSend}
              disabled={!to.trim() || !subject.trim() || !body.trim() || sent || sending}
              className={`rounded-xl px-5 ${sent ? 'bg-green-600 hover:bg-green-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>
              {sending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending...</> :
               sent ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Sent!</> :
               <><Send className="w-3.5 h-3.5 mr-1.5" /> {isAuthenticated ? 'Send via Gmail' : 'Send'}</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AI Chat ────────────────────────────────────────────────────

function AIChatPanel({ thread, isGmail }: { thread: Thread | null; isGmail?: boolean }) {
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
      const payload: Record<string, unknown> = { message: userMsg.content }
      // For Gmail threads, send full thread data; for mock threads, send threadId
      if (thread) {
        if (isGmail) {
          payload.thread = thread
        } else {
          payload.threadId = thread.id
        }
      }
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.reply ?? data.error ?? 'No response', timestamp: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Failed to get response.', timestamp: new Date().toISOString() }])
    } finally { setLoading(false) }
  }, [input, loading, thread, isGmail])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bot className="w-7 h-7 text-blue-400" />
            </div>
            <p className="font-medium text-gray-500">AI Assistant</p>
            <p className="text-xs mt-1">Ask about {thread ? 'this email' : 'your emails'}</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about this email..." className="text-sm rounded-xl" />
        <Button size="sm" onClick={send} disabled={loading || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Filter types ───────────────────────────────────────────────

type FilterPriority = 'all' | 'urgent' | 'important' | 'normal' | 'low'
type FilterCategory = 'all' | 'work' | 'personal' | 'finance' | 'updates' | 'spam'
type FilterRead = 'all' | 'read' | 'unread'

// ─── Main inbox page ────────────────────────────────────────────

export default function InboxPage() {
  const { data: session, status: authStatus } = useSession()
  const isAuthenticated = !!session?.accessToken
  const isAuthLoading = authStatus === 'loading'
  const userName = session?.user?.name ?? ''
  const userEmail = session?.user?.email ?? ''

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
  const [activeTab, setActiveTab] = useState<'analysis' | 'emails'>('emails')
  const [allUserLabels, setAllUserLabels] = useState<string[]>([])
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [newLabelText, setNewLabelText] = useState('')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [labelsOpen, setLabelsOpen] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(true)
  const [showNewCompose, setShowNewCompose] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all')
  const [filterRead, setFilterRead] = useState<FilterRead>('all')
  const [calendarEvents, setCalendarEvents] = useState<SyncedCalendarEvent[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [gmailError, setGmailError] = useState<string | null>(null)
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const filterRef = useRef<HTMLDivElement>(null)

  const getMeta = (id: string): ThreadMeta => metas[id] ?? defaultMeta
  const isSidebarOpen = sidebarPinned || sidebarExpanded
  const isCalendarView = folder === 'calendar'
  const isOwnEmail = useCallback((email: string) => {
    const normalized = normalizeEmail(email)
    return userEmail ? normalized === normalizeEmail(userEmail) : normalized.includes('you@')
  }, [userEmail])
  const hasGmailLabel = useCallback((thread: Thread, label: string) => {
    return Array.isArray(thread.gmailLabels) && thread.gmailLabels.includes(label)
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch real Gmail threads when authenticated
  const fetchGmailThreads = useCallback(async (query?: string) => {
    if (!isAuthenticated) return
    setGmailLoading(true)
    setGmailError(null)
    try {
      const url = new URL('/api/gmail/threads', window.location.origin)
      url.searchParams.set('q', query ? `in:anywhere ${query}` : 'in:anywhere')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Mail sync failed')

      const data = await res.json()
      if (Array.isArray(data.threads)) {
        setThreads(data.threads as Thread[])
      } else {
        setThreads([])
      }
    } catch (err) {
      console.error('Gmail fetch error:', err)
      setGmailError('Mail sync failed. You can keep using cached conversations and try refreshing again.')
    }
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
    const storedSidebarPinned = loadJson<boolean>(LS_SIDEBAR_PINNED, true)
    setSidebarPinned(storedSidebarPinned)
    setSidebarExpanded(storedSidebarPinned)
  }, [])

  useEffect(() => {
    saveJson(LS_SIDEBAR_PINNED, sidebarPinned)
  }, [sidebarPinned])

  // Fetch Gmail when session is ready
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchGmailThreads()
    }
  }, [isAuthenticated, isAuthLoading, fetchGmailThreads])

  const fetchCalendarEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setCalendarEvents([])
      setCalendarError(null)
      return
    }

    setCalendarLoading(true)
    setCalendarError(null)
    try {
      const res = await fetch('/api/calendar/events')
      if (!res.ok) throw new Error('Calendar sync failed')
      const data = await res.json()
      setCalendarEvents(Array.isArray(data.events) ? data.events as SyncedCalendarEvent[] : [])
    } catch (err) {
      console.error('Calendar fetch error:', err)
      setCalendarEvents([])
      setCalendarError('Calendar sync failed. Refresh to retry or reconnect your Google account.')
    } finally {
      setCalendarLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchCalendarEvents()
    } else {
      setCalendarEvents([])
      setCalendarError(null)
    }
  }, [isAuthenticated, isAuthLoading, fetchCalendarEvents])

  // Persist meta changes
  const updateMeta = useCallback((threadId: string, updates: Partial<ThreadMeta>) => {
    setMetas(prev => {
      const current = prev[threadId] ?? defaultMeta
      const nextMeta = { ...current, ...updates }
      const changed = Object.keys(updates).some(key => {
        const field = key as keyof ThreadMeta
        const currentValue = current[field]
        const nextValue = nextMeta[field]
        if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
          return currentValue.length !== nextValue.length || currentValue.some((value, index) => value !== nextValue[index])
        }
        return currentValue !== nextValue
      })

      if (!changed) return prev

      const updated = { ...prev, [threadId]: nextMeta }
      saveJson(LS_META, updated)
      return updated
    })
  }, [])

  // Analyze thread — sends full thread data for Gmail threads
  const analyzeThread = useCallback(async (threadId: string) => {
    if (analyses[threadId] || loadingThreads.has(threadId)) return
    const thread = threads.find(t => t.id === threadId)
    if (!thread) return
    setLoadingThreads(prev => new Set(prev).add(threadId))
    try {
      const payload: Record<string, unknown> = { threadId }
      // For Gmail threads (not mock), send full thread data
      const isMock = mockThreads.some(m => m.id === threadId)
      if (!isMock) {
        payload.thread = thread
      }
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('fail')
      const data: ComprehensiveAnalysis = await res.json()
      setAnalyses(prev => { const u = { ...prev, [threadId]: data }; saveJson(LS_ANALYSES, u); return u })
    } catch (err) { console.error(err) }
    finally { setLoadingThreads(prev => { const n = new Set(prev); n.delete(threadId); return n }) }
  }, [analyses, loadingThreads, threads])

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
    setActiveTab('emails')  // Default to emails tab
    setShowCompose(false)
    setComposeInitial('')
    updateMeta(threadId, { read: true })
    gmailAction(threadId, 'read')
    // Don't auto-analyze — user clicks Analysis tab to trigger it
  }, [updateMeta, gmailAction])

  // Trigger analysis when user clicks the Analysis tab
  const handleAnalysisTab = useCallback(() => {
    setActiveTab('analysis')
    if (selectedId && !analyses[selectedId] && !loadingThreads.has(selectedId)) {
      analyzeThread(selectedId)
    }
  }, [selectedId, analyses, loadingThreads, analyzeThread])

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

  const handleRefresh = useCallback(() => {
    if (isAuthenticated) {
      fetchGmailThreads()
      fetchCalendarEvents()
    }
  }, [isAuthenticated, fetchGmailThreads, fetchCalendarEvents])

  const handleSidebarPinToggle = useCallback(() => {
    setSidebarPinned(prev => {
      const next = !prev
      setSidebarExpanded(next)
      return next
    })
  }, [])

  const handleReplySent = useCallback((threadId: string, payload: { to: EmailSender; subject: string; body: string }) => {
    const timestamp = new Date().toISOString()
    const from = {
      name: userName || 'You',
      email: userEmail || 'you@local.dev',
    }

    setThreads(prev => prev.map(thread => {
      if (thread.id !== threadId) return thread

      return {
        ...thread,
        timestamp,
        preview: buildPreview(payload.body),
        emails: [
          ...thread.emails,
          {
            id: `local-email-${crypto.randomUUID()}`,
            threadId,
            from,
            to: [payload.to],
            subject: payload.subject,
            body: payload.body,
            timestamp,
            isRead: true,
          }
        ],
      }
    }))
    updateMeta(threadId, { draft: '', read: true })
  }, [updateMeta, userEmail, userName])

  const handleNewComposeSent = useCallback((payload: { to: EmailSender; subject: string; body: string }) => {
    const timestamp = new Date().toISOString()
    const threadId = `local-thread-${crypto.randomUUID()}`
    const from = {
      name: userName || 'You',
      email: userEmail || 'you@local.dev',
    }

    const newThread: Thread = {
      id: threadId,
      from: payload.to,
      subject: payload.subject,
      preview: buildPreview(payload.body),
      timestamp,
      unreadCount: 0,
      category: 'work',
      emails: [
        {
          id: `local-email-${crypto.randomUUID()}`,
          threadId,
          from,
          to: [payload.to],
          subject: payload.subject,
          body: payload.body,
          timestamp,
          isRead: true,
        }
      ],
    }

    setThreads(prev => [newThread, ...prev])
    updateMeta(threadId, { read: true })
    setSelectedId(threadId)
    setFolder('sent')
    setActiveTab('emails')
  }, [updateMeta, userEmail, userName])

  const activeFiltersCount = (filterPriority !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterRead !== 'all' ? 1 : 0)

  const clearFilters = () => { setFilterPriority('all'); setFilterCategory('all'); setFilterRead('all') }
  const clearSearch = () => setSearch('')

  const handleFolderChange = useCallback((nextFolder: SidebarFolder) => {
    setFolder(nextFolder)
    setShowCompose(false)
    setComposeInitial('')
    setShowFilterMenu(false)
    if (nextFolder === 'calendar') {
      setActiveTab('emails')
    }
  }, [])

  const handleDraftUpdate = useCallback((text: string) => {
    if (!selectedId) return
    updateMeta(selectedId, { draft: text })
  }, [selectedId, updateMeta])

  // Filter threads by folder + search + filters
  const filteredThreads = threads.filter(t => {
    if (folder === 'calendar') return false

    const m = getMeta(t.id)
    const isGmailThread = Array.isArray(t.gmailLabels) && t.gmailLabels.length > 0
    const isSentThread = isGmailThread ? hasGmailLabel(t, 'SENT') : t.emails.some(e => isOwnEmail(e.from.email))
    const analysis = analyses[t.id]

    switch (folder) {
      case 'inbox':
        if (m.archived || m.trashed) return false
        if (isGmailThread && !hasGmailLabel(t, 'INBOX')) return false
        break
      case 'starred': if (!m.starred || m.trashed) return false; break
      case 'snoozed': if (!m.snoozedUntil || m.trashed) return false; break
      case 'sent': {
        if (!isSentThread || m.trashed) return false; break
      }
      case 'drafts': if (!m.draft || m.trashed) return false; break
      case 'trash': if (!m.trashed) return false; break
      case 'all': if (m.trashed) return false; break
    }

    if (search) {
      const q = search.toLowerCase()
      const searchableValues = [
        t.subject,
        t.from.name,
        t.from.email,
        t.preview,
        t.category,
        ...t.emails.flatMap(email => [
          email.subject,
          email.body,
          email.from.name,
          email.from.email,
          ...email.to.flatMap(recipient => [recipient.name, recipient.email]),
        ]),
        ...m.userLabels,
        ...(analysis?.labels ?? []),
        analysis?.category ?? '',
      ]

      if (!searchableValues.some(value => value.toLowerCase().includes(q))) return false
    }

    // Apply filters
    if (filterRead === 'read' && !m.read) return false
    if (filterRead === 'unread' && m.read) return false

    if (filterPriority !== 'all' && (!analysis || analysis.priority !== filterPriority)) return false
    if (filterCategory !== 'all' && (!analysis || analysis.category !== filterCategory)) return false

    return true
  })

  // Folder counts
  const counts: Partial<Record<SidebarFolder, number>> = {}
  threads.forEach(t => {
    const m = getMeta(t.id)
    const isGmailInboxThread = Array.isArray(t.gmailLabels) ? t.gmailLabels.includes('INBOX') : true
    if (!m.archived && !m.trashed && !m.read && isGmailInboxThread) counts.inbox = (counts.inbox ?? 0) + 1
    if (m.starred && !m.trashed) counts.starred = (counts.starred ?? 0) + 1
    if (m.snoozedUntil && !m.trashed) counts.snoozed = (counts.snoozed ?? 0) + 1
    if (m.draft && !m.trashed) counts.drafts = (counts.drafts ?? 0) + 1
    if (m.trashed) counts.trash = (counts.trash ?? 0) + 1
  })
  counts.sent = threads.filter(t => {
    const isGmailThread = Array.isArray(t.gmailLabels) && t.gmailLabels.length > 0
    const isSentThread = isGmailThread ? hasGmailLabel(t, 'SENT') : t.emails.some(e => isOwnEmail(e.from.email))
    return isSentThread && !getMeta(t.id).trashed
  }).length

  const selectedThread = filteredThreads.find(t => t.id === selectedId) ?? null
  const selectedAnalysis = selectedThread ? analyses[selectedThread.id] : null
  const isLoadingSelected = selectedThread ? loadingThreads.has(selectedThread.id) : false
  const calendarMeetings = selectedThread && selectedAnalysis
    ? inferCalendarCandidates(selectedThread, selectedAnalysis)
    : []

  useEffect(() => {
    if (isCalendarView) {
      if (showCompose) setShowCompose(false)
      return
    }

    if (filteredThreads.length === 0) {
      if (selectedId !== null) setSelectedId(null)
      if (showCompose) setShowCompose(false)
      if (composeInitial) setComposeInitial('')
      if (activeTab !== 'emails') setActiveTab('emails')
      return
    }

    if (!selectedId || !filteredThreads.some(thread => thread.id === selectedId)) {
      setSelectedId(filteredThreads[0].id)
      if (showCompose) setShowCompose(false)
      if (composeInitial) setComposeInitial('')
      if (activeTab !== 'emails') setActiveTab('emails')
    }
  }, [activeTab, composeInitial, filteredThreads, isCalendarView, selectedId, showCompose])

  // Determine sender and recipient names for the compose panel
  const currentSenderName = userName || undefined
  const currentRecipientName = selectedThread?.from.name || undefined
  const availableThreadLabels = selectedThread
    ? allUserLabels.filter(label => !getMeta(selectedThread.id).userLabels.includes(label))
    : []

  return (
    <div className="h-screen flex flex-col bg-gray-50/50">
      {/* Top bar */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-xl h-16 flex items-center px-4 gap-4 shrink-0 shadow-sm shadow-gray-100/50">
        <NextLink href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </NextLink>

        <div className="flex-1 max-w-lg relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isCalendarView ? 'Calendar workspace is active' : 'Search emails, contacts, labels, and thread content...'}
            disabled={isCalendarView}
            className="pl-10 text-sm h-10 bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          />
          {search && !isCalendarView && (
            <button onClick={clearSearch} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {gmailLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}

          {/* Refresh button */}
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={gmailLoading}
              className="rounded-full" title="Refresh emails">
              <RefreshCw className={`w-4 h-4 ${gmailLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {/* Compose new email */}
          <Button variant="outline" size="sm" onClick={() => setShowNewCompose(true)}
            className="rounded-full">
            <PenSquare className="w-4 h-4 mr-1.5" /> Compose
          </Button>

          {isAuthenticated && (
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Gmail Connected
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)}
            className={`rounded-full ${showChat ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}>
            <Bot className="w-4 h-4 mr-1.5" /> AI Chat
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full border border-gray-200 bg-white pl-2 pr-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? 'User'} />
                    <AvatarFallback className="bg-slate-100 text-slate-700">
                      {session?.user?.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left leading-tight">
                    <p className="max-w-[140px] truncate text-sm font-semibold text-gray-800">
                      {session?.user?.name ?? 'Connected account'}
                    </p>
                    <p className="max-w-[160px] truncate text-xs text-gray-500">
                      {session?.user?.email ?? 'Google connected'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-200 p-2">
                <DropdownMenuLabel className="text-xs text-gray-500">Connected Google account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {session?.user?.email ?? 'No email available'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="rounded-lg text-sm">
                  <LogOut className="w-4 h-4 text-gray-400" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => signIn('google', { callbackUrl: '/inbox' })}
              className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50">
              <LogIn className="w-4 h-4 mr-1.5" /> Connect Gmail
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — collapsed (icons only) by default, expands on hover */}
        <aside
          onMouseEnter={() => {
            if (!sidebarPinned) setSidebarExpanded(true)
          }}
          onMouseLeave={() => {
            if (!sidebarPinned) setSidebarExpanded(false)
          }}
          className={`border-r border-gray-200/80 bg-white shrink-0 flex flex-col transition-all duration-200 ease-in-out overflow-hidden ${
            isSidebarOpen ? 'w-60' : 'w-16'
          }`}>
          <ScrollArea className="h-full">
            <div className="py-3">
          <div className={`mb-3 flex px-2 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            <button
              onClick={handleSidebarPinToggle}
              aria-pressed={sidebarPinned}
              title={sidebarPinned ? 'Unpin navigation' : 'Pin navigation open'}
              className={`inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 ${
                isSidebarOpen ? 'w-full justify-between px-3' : 'w-10 justify-center'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Menu className="h-4 w-4" />
                {isSidebarOpen && <span className="text-sm font-medium">Navigation</span>}
              </span>
              {isSidebarOpen && (
                <Badge
                  variant="outline"
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    sidebarPinned
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {sidebarPinned ? 'Pinned' : 'Hover'}
                </Badge>
              )}
            </button>
          </div>
          <nav className="space-y-0.5 px-2">
            {sidebarItems.map(item => {
              const count = counts[item.folder]
              const active = folder === item.folder
              return (
                <button key={item.folder} onClick={() => handleFolderChange(item.folder)}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-sm shadow-blue-100/50'
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  } ${isSidebarOpen ? '' : 'justify-center'}`}>
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {isSidebarOpen && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {isSidebarOpen && count ? (
                    <span className={`text-[11px] font-bold min-w-[20px] text-center ${
                      active ? 'text-blue-600' : item.folder === 'inbox' && count > 0 ? 'bg-blue-600 text-white rounded-full px-1.5 py-0.5' : 'text-gray-400'
                    }`}>{count}</span>
                  ) : null}
                  {!isSidebarOpen && count && item.folder === 'inbox' && count > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600" />
                  ) : null}
                </button>
              )
            })}
          </nav>

          {/* Categories — collapsible, only visible when sidebar expanded */}
          {isSidebarOpen && (
            <div className="mt-5 px-2">
              <button onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between px-3 mb-1 group">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categories</p>
                {categoriesOpen
                  ? <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                  : <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />}
              </button>
              {categoriesOpen && Object.entries(categoryConfig).map(([key, val]) => (
                <button key={key} onClick={() => { handleFolderChange('all'); clearSearch(); setFilterCategory(key as FilterCategory) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                  <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
                  {val.label}
                </button>
              ))}
            </div>
          )}

          {/* Labels — collapsible, only visible when sidebar expanded */}
          {isSidebarOpen && (
            <div className="mt-5 px-2 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-3 mb-1">
                <button onClick={() => setLabelsOpen(!labelsOpen)} className="flex items-center gap-1 group">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Labels</p>
                  {labelsOpen
                    ? <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    : <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />}
                </button>
                {labelsOpen && (
                  <button onClick={() => setShowLabelInput(true)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Create label">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {labelsOpen && (
                <>
                  {showLabelInput && (
                    <div className="px-3 mb-2 flex gap-1">
                      <input value={newLabelText} onChange={e => setNewLabelText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateLabel(newLabelText); if (e.key === 'Escape') { setShowLabelInput(false); setNewLabelText('') } }}
                        placeholder="Label name..."
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300"
                        autoFocus />
                      <button onClick={() => handleCreateLabel(newLabelText)} className="text-xs text-blue-600 font-bold px-1.5">Add</button>
                    </div>
                  )}
                  {allUserLabels.map(label => (
                    <button key={label} onClick={() => { handleFolderChange('all'); setSearch(label.toLowerCase()) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      {label}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
          {isSidebarOpen && (
            <div className="mt-5 px-2 pb-2 border-t border-gray-100">
              <button onClick={() => setCalendarOpen(!calendarOpen)}
                className="w-full flex items-center justify-between px-3 pt-4 mb-1 group">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calendar</p>
                </div>
                {calendarOpen
                  ? <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                  : <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />}
              </button>
              {calendarOpen && (
                <div className="space-y-2 px-3">
                  <Button variant="outline" size="sm" className="w-full rounded-xl justify-start" onClick={() => handleFolderChange('calendar')}>
                    <CalendarDays className="w-4 h-4" />
                    Open calendar workspace
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-400 py-1">Connect Google to load live events here.</p>
                  )}
                  {calendarLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Syncing upcoming events...
                    </div>
                  )}
                  {!calendarLoading && calendarError && (
                    <p className="text-xs text-red-500 py-2">{calendarError}</p>
                  )}
                  {!calendarLoading && !calendarError && isAuthenticated && calendarEvents.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">No upcoming events found.</p>
                  )}
                  {!calendarLoading && !calendarError && calendarEvents.slice(0, 3).map(event => (
                    <a
                      key={event.id}
                      href={event.htmlLink ?? '#'}
                      target={event.htmlLink ? '_blank' : undefined}
                      rel={event.htmlLink ? 'noreferrer' : undefined}
                      className="block rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50/60 transition-colors"
                    >
                      <p className="text-xs font-semibold text-gray-800 truncate">{event.title}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{formatCalendarEventLabel(event.start)}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </ScrollArea>
        </aside>

        {!isCalendarView && (
          <div className="w-80 border-r border-gray-200/80 flex flex-col shrink-0 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {filteredThreads.length} conversation{filteredThreads.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <div ref={filterRef} className="relative">
                    <button onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className={`p-1.5 rounded-lg transition-colors ${showFilterMenu || activeFiltersCount > 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}
                      title="Filters">
                      <Filter className="w-3.5 h-3.5" />
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl py-3 px-4 z-30 w-56">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-gray-700">Filters</p>
                          {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="text-[10px] text-blue-600 font-semibold hover:underline">Clear all</button>
                          )}
                        </div>

                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</p>
                          <div className="flex gap-1 flex-wrap">
                            {(['all', 'unread', 'read'] as FilterRead[]).map(v => (
                              <button key={v} onClick={() => setFilterRead(v)}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                  filterRead === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {v === 'all' ? 'All' : v === 'unread' ? 'Unread' : 'Read'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority</p>
                          <div className="flex gap-1 flex-wrap">
                            {(['all', 'urgent', 'important', 'normal', 'low'] as FilterPriority[]).map(v => (
                              <button key={v} onClick={() => setFilterPriority(v)}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all capitalize ${
                                  filterPriority === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</p>
                          <div className="flex gap-1 flex-wrap">
                            {(['all', 'work', 'personal', 'finance', 'updates', 'spam'] as FilterCategory[]).map(v => (
                              <button key={v} onClick={() => setFilterCategory(v)}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all capitalize ${
                                  filterCategory === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {isAuthenticated && (
                    <button onClick={handleRefresh} disabled={gmailLoading}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Refresh">
                      <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-gray-200 bg-gray-50 text-gray-600">
                  {folderMeta[folder].label}
                </Badge>
                {search && (
                  <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                    Search active
                  </Badge>
                )}
                {activeFiltersCount > 0 && (
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                    {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'}
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="pb-4">
                {filteredThreads.map(t => (
                  <ThreadListItem key={t.id} thread={t} selected={t.id === selectedId}
                    analysis={analyses[t.id]} meta={getMeta(t.id)}
                    onSelect={() => handleSelect(t.id)} onStar={() => handleStar(t.id)} />
                ))}
                {filteredThreads.length === 0 && (
                  <FolderEmptyState
                    folder={folder}
                    search={search}
                    hasFilters={activeFiltersCount > 0}
                    isAuthenticated={isAuthenticated}
                    compact
                    onClearSearch={clearSearch}
                    onClearFilters={clearFilters}
                    onRefresh={handleRefresh}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 flex overflow-hidden bg-gray-50/50">
          {isCalendarView ? (
            <CalendarWorkspace
              events={calendarEvents}
              loading={calendarLoading}
              error={calendarError}
              selectedDate={calendarDate}
              onDateSelect={date => date && setCalendarDate(date)}
              onRefresh={handleRefresh}
              onConnect={() => signIn('google', { callbackUrl: '/inbox' })}
              isAuthenticated={isAuthenticated}
            />
          ) : filteredThreads.length === 0 ? (
            <div className="flex-1 p-6">
              <FolderEmptyState
                folder={folder}
                search={search}
                hasFilters={activeFiltersCount > 0}
                isAuthenticated={isAuthenticated}
                onClearSearch={clearSearch}
                onClearFilters={clearFilters}
                onRefresh={handleRefresh}
              />
            </div>
          ) : !selectedThread ? (
            <div className="flex-1 p-6">
              <Empty className="min-h-full rounded-[1.75rem] border border-dashed border-gray-200 bg-white/80 shadow-sm">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-16 rounded-3xl bg-blue-50 text-blue-700">
                    <Mail className="size-8" />
                  </EmptyMedia>
                  <EmptyTitle>Select an email to read</EmptyTitle>
                  <EmptyDescription>
                    Choose any conversation from the list to open the thread and run AI analysis when you need it.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-white to-gray-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{selectedThread.subject}</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                      {selectedThread.from.name} &middot; {selectedThread.emails.length} message{selectedThread.emails.length !== 1 ? 's' : ''}
                    </p>
                    {gmailError && (
                      <p className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        {gmailError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    {selectedAnalysis && <PriorityBadge priority={selectedAnalysis.priority} />}
                    <SenderBadge importance={selectedAnalysis?.senderImportance ?? 'regular'} />
                    <div className="w-px h-5 bg-gray-200 mx-1.5" />
                    <button onClick={() => handleMarkUnread(selectedThread.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Mark as unread">
                      <Mail className={`w-4 h-4 ${!getMeta(selectedThread.id).read ? 'text-blue-500' : 'text-gray-400'}`} />
                    </button>
                    <button onClick={() => handleStar(selectedThread.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Star">
                      <Star className={`w-4 h-4 ${getMeta(selectedThread.id).starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                    </button>
                    <button onClick={() => handleSnooze(selectedThread.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Snooze">
                      <AlarmClock className={`w-4 h-4 ${getMeta(selectedThread.id).snoozedUntil ? 'text-purple-500' : 'text-gray-400'}`} />
                    </button>
                    <button onClick={() => handleArchive(selectedThread.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Archive">
                      <Archive className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleTrash(selectedThread.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Trash">
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* User labels on thread */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {getMeta(selectedThread.id).userLabels.map(label => (
                    <Badge key={label} variant="outline" className="rounded-full border-indigo-100 bg-indigo-50 text-indigo-700">
                      <Tag className="w-2.5 h-2.5" />{label}
                      <button onClick={() => handleRemoveLabel(selectedThread.id, label)} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-2.5 h-2.5" /></button>
                    </Badge>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-slate-900 rounded-full px-2.5 py-1 border border-dashed border-gray-300 hover:border-slate-400 transition-colors font-medium">
                        <Tag className="w-2.5 h-2.5" /> Add label
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 rounded-xl border-gray-200 p-2">
                      <DropdownMenuLabel className="text-xs text-gray-500">Apply a label</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableThreadLabels.map(label => (
                        <DropdownMenuItem key={label} onClick={() => handleAddLabel(selectedThread.id, label)} className="rounded-lg text-sm">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          {label}
                        </DropdownMenuItem>
                      ))}
                      {availableThreadLabels.length === 0 && (
                        <DropdownMenuItem disabled className="rounded-lg text-sm text-gray-400">
                          All labels already applied
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tabs — Emails first (default), then Analysis */}
                <div className="flex gap-1 mt-4">
                  <button onClick={() => setActiveTab('emails')}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                      activeTab === 'emails'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    <Mail className="w-3.5 h-3.5" />Emails ({selectedThread.emails.length})
                  </button>
                  <button onClick={handleAnalysisTab}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                      activeTab === 'analysis'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    <Sparkles className="w-3.5 h-3.5" />AI Analysis
                  </button>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'emails' ? (
                  <div className="p-6 space-y-4 max-w-3xl">
                    {selectedThread.emails.length === 0 && (
                      <Empty className="rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50/70">
                        <EmptyHeader>
                          <EmptyMedia variant="icon" className="size-14 rounded-3xl bg-gray-100 text-gray-600">
                            <Mail className="size-7" />
                          </EmptyMedia>
                          <EmptyTitle>No messages available</EmptyTitle>
                          <EmptyDescription>
                            This thread is present, but there are no message bodies available to display yet.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                    {selectedThread.emails.map(email => (
                      <div key={email.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
                              isOwnEmail(email.from.email)
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>{email.from.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{email.from.name}</p>
                              <p className="text-xs text-gray-400">{email.from.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{timeAgo(email.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{email.body}</div>
                        {email.attachments && email.attachments.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {email.attachments.map(a => (
                              <span key={a.name} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600 font-medium">
                                <FileText className="w-3 h-3" />{a.name} <span className="text-gray-400">({a.size})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Reply button in emails tab */}
                    {!showCompose && selectedThread.emails.length > 0 && (
                      <button onClick={() => { setComposeInitial(''); setShowCompose(true) }}
                        className="inline-flex items-center gap-2.5 text-sm font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-5 py-3 rounded-xl transition-all border border-blue-200/60">
                        <CornerUpLeft className="w-4 h-4" /> Reply
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-6 space-y-6 max-w-3xl">
                    {isLoadingSelected ? (
                      <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">Analyzing with AI...</p>
                        <p className="text-xs text-gray-400 mt-1.5">Extracting insights, tasks, meetings, and more</p>
                      </div>
                    ) : selectedAnalysis ? (
                      <>
                        <SummarySection thread={selectedThread} analysis={selectedAnalysis} meta={getMeta(selectedThread.id)} />
                        <FollowUpSection needed={selectedAnalysis.followUpNeeded} suggestion={selectedAnalysis.followUpSuggestion} />
                        <SmartRepliesSection thread={selectedThread} analysis={selectedAnalysis} onUseReply={handleUseReply} />
                        <DraftReplySection draft={selectedAnalysis.draftReply} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <MeetingsSection
                            meetings={calendarMeetings}
                            isAuthenticated={isAuthenticated}
                            onCalendarAdded={fetchCalendarEvents}
                            onOpenCalendar={() => handleFolderChange('calendar')}
                          />
                          <TasksSection tasks={selectedAnalysis.tasks} />
                        </div>
                        <DeadlinesSection deadlines={selectedAnalysis.deadlines} />
                        <KeyInfoSection keyInfo={selectedAnalysis.keyInfo} />

                        {!showCompose && (
                          <button onClick={() => { setComposeInitial(''); setShowCompose(true) }}
                            className="inline-flex items-center gap-2.5 text-sm font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-5 py-3 rounded-xl transition-all border border-blue-200/60">
                            <CornerUpLeft className="w-4 h-4" /> Reply to this email
                          </button>
                        )}
                      </>
                    ) : (
                      <Empty className="rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50/60 py-20">
                        <EmptyHeader>
                          <EmptyMedia variant="icon" className="size-14 rounded-3xl bg-gray-100 text-gray-600">
                            <Sparkles className="size-7" />
                          </EmptyMedia>
                          <EmptyTitle>Analysis unavailable</EmptyTitle>
                          <EmptyDescription>
                            MailMate could not prepare insights for this thread yet. Refresh or switch to another conversation.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
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
                  onUpdateDraft={handleDraftUpdate}
                  onClose={() => setShowCompose(false)}
                  isAuthenticated={isAuthenticated}
                  senderName={currentSenderName}
                  recipientName={currentRecipientName}
                  userEmail={userEmail || undefined}
                  onSent={(payload) => handleReplySent(selectedThread.id, payload)}
                />
              )}
            </div>
          )}

          {/* Chat sidebar */}
          {showChat && (
            <aside className="w-80 border-l border-gray-200/80 flex flex-col shrink-0 bg-white">
              <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  AI Assistant
                </span>
                <button onClick={() => setShowChat(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <AIChatPanel thread={selectedThread} isGmail={isAuthenticated && !mockThreads.some(m => m.id === (selectedThread?.id ?? ''))} />
            </aside>
          )}
        </main>
      </div>

      {/* New compose modal */}
      {showNewCompose && (
        <NewComposePanel
          onClose={() => setShowNewCompose(false)}
          isAuthenticated={isAuthenticated}
          senderName={currentSenderName}
          onSent={handleNewComposeSent}
        />
      )}
    </div>
  )
}

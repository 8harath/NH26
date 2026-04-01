// --- Core Email Types ---

export interface EmailSender {
  name: string
  email: string
  avatar?: string
}

export interface Attachment {
  name: string
  size: string
  type: string
}

export interface Email {
  id: string
  threadId: string
  from: EmailSender
  to: EmailSender[]
  subject: string
  body: string
  timestamp: string
  isRead: boolean
  attachments?: Attachment[]
}

export type EmailCategory = 'work' | 'personal' | 'finance' | 'updates' | 'spam'

export interface Thread {
  id: string
  from: EmailSender
  subject: string
  preview: string
  timestamp: string
  unreadCount: number
  emails: Email[]
  category: EmailCategory
  gmailLabels?: string[]
}

// --- Comprehensive Analysis ---

export type Priority = 'urgent' | 'important' | 'normal' | 'low'

export interface DetectedMeeting {
  title: string
  date: string
  time: string
  attendees: string[]
}

export interface ExtractedTask {
  title: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
}

export interface DetectedDeadline {
  description: string
  date: string
  urgent: boolean
}

export interface KeyInfo {
  dates: string[]
  links: string[]
  contacts: string[]
  amounts: string[]
}

export interface ComprehensiveAnalysis {
  summary: string[]
  priority: Priority
  category: EmailCategory
  smartReplies: string[]
  draftReply: string
  meetings: DetectedMeeting[]
  tasks: ExtractedTask[]
  deadlines: DetectedDeadline[]
  keyInfo: KeyInfo
  labels: string[]
  followUpNeeded: boolean
  followUpSuggestion: string
  senderImportance: 'vip' | 'regular' | 'unknown'
}

// --- Thread State (user actions) ---

export type RewriteAction = 'formalize' | 'shorten' | 'elaborate' | 'fix-grammar'

export interface ThreadMeta {
  read: boolean
  starred: boolean
  snoozedUntil: string | null  // ISO date string or null
  archived: boolean
  trashed: boolean
  draft: string  // user's reply draft text
  userLabels: string[]  // custom user-created labels
}

export type SidebarFolder = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'calendar' | 'trash' | 'all'

// --- UI State Types ---

export interface ThreadAnalysisState {
  data: ComprehensiveAnalysis | null
  loading: boolean
  error: string | null
}

export interface AgentStep {
  toolCalls?: { name: string; args: Record<string, unknown> }[]
  toolResults?: { name: string; result: unknown }[]
  text?: string
}

export interface AgentResponse {
  reply: string
  steps: AgentStep[]
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  steps?: AgentStep[]
  delegations?: DelegationStep[]
  memoriesUsed?: AgentMemoryEntry[]
  memoriesStored?: { category: MemoryCategory; key: string; value: string }[]
}

// --- Agent Memory Types ---

export type MemoryCategory =
  | 'sender_preference'
  | 'priority_rule'
  | 'scheduling_preference'
  | 'writing_style'
  | 'general'

export interface AgentMemoryEntry {
  id: string
  user_id: string
  category: MemoryCategory
  key: string
  value: string
  confidence: number
  source_message?: string
  created_at: string
  updated_at: string
}

// --- Coordinator Types ---

export interface DelegationStep {
  agent: 'triage' | 'scheduler' | 'writer' | 'memory'
  action: string
  result: string
}

export interface CoordinatorResult {
  reply: string
  steps: AgentStep[]
  delegations: DelegationStep[]
  memoriesUsed: AgentMemoryEntry[]
  memoriesStored: { category: MemoryCategory; key: string; value: string }[]
}

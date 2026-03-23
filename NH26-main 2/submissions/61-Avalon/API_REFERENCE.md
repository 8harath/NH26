# Email Triage - API Reference

## Groq AI Functions

All AI functions are in `src/lib/groq.ts` and use the Groq `llama-3.3-70b-versatile` model.

### analyzeThread

Analyzes an email thread and generates a summary with priority classification.

```typescript
import { analyzeThread } from '@/src/lib/groq'

const summary = await analyzeThread(thread)
// Returns: { bullets: string[], priority: "urgent" | "action" | "fyi" }
```

**Parameters:**
- `thread: Thread` - Email thread to analyze

**Returns:**
```typescript
{
  bullets: [
    "First key point",
    "Second key point", 
    "Third key point"
  ],
  priority: "urgent" | "action" | "fyi"
}
```

**Example:**
```typescript
const result = await analyzeThread({
  id: 'thread-1',
  from: { name: 'Sarah', email: 'sarah@example.com' },
  subject: 'Urgent: Q2 Budget Review',
  emails: [...],
  // ... other fields
})

// Result:
// {
//   bullets: [
//     "Budget allocations need approval by Friday EOD",
//     "Board meeting scheduled for Tuesday at 10am",
//     "Department leads must review and confirm numbers"
//   ],
//   priority: "urgent"
// }
```

### generateReply

Generates a professional email reply based on the thread context.

```typescript
import { generateReply } from '@/src/lib/groq'

const draftBody = await generateReply(thread)
// Returns: string (email body without subject/salutation)
```

**Parameters:**
- `thread: Thread` - Email thread context

**Returns:**
- `string` - Professional email reply body

**Example:**
```typescript
const draft = await generateReply(thread)

// Result:
// "Thanks for the heads up. I'm reviewing the numbers now. 
//  I have a few questions about the headcount allocations - 
//  can we schedule a quick sync? I should have feedback by 
//  Thursday EOD at the latest."
```

### extractCalendarEvent

Extracts calendar event details from an email thread.

```typescript
import { extractCalendarEvent } from '@/src/lib/groq'

const event = await extractCalendarEvent(thread)
// Returns: { title, date, time, description, attendees }
```

**Parameters:**
- `thread: Thread` - Email thread to extract event from

**Returns:**
```typescript
{
  title: string,              // Event title
  date: string,               // YYYY-MM-DD format
  time: string,               // HH:mm format (24-hour)
  description: string,        // Event description
  attendees: string[]         // Array of email addresses
}
```

**Example:**
```typescript
const event = await extractCalendarEvent(thread)

// Result:
// {
//   title: "Q2 Budget Review Sync",
//   date: "2024-03-21",
//   time: "14:00",
//   description: "Discuss Q2 budget allocations and headcount adjustments",
//   attendees: ["sarah.chen@acmecorp.com", "you@acmecorp.com"]
// }
```

### extractTasks

Extracts action items and tasks from an email thread.

```typescript
import { extractTasks } from '@/src/lib/groq'

const tasks = await extractTasks(thread)
// Returns: Array of { title, description, dueDate, priority }
```

**Parameters:**
- `thread: Thread` - Email thread to extract tasks from

**Returns:**
```typescript
[
  {
    title: string,                      // Task title
    description: string,                // Task description
    dueDate: string,                    // YYYY-MM-DD format
    priority: "low" | "medium" | "high" // Priority level
  },
  // ... more tasks
]
```

**Example:**
```typescript
const tasks = await extractTasks(thread)

// Result:
// [
//   {
//     title: "Review Q2 budget spreadsheet",
//     description: "Review the Finance team's preliminary numbers and confirm departmental allocations",
//     dueDate: "2024-03-22",
//     priority: "high"
//   },
//   {
//     title: "Schedule sync with Sarah",
//     description: "Discuss headcount allocations and address questions",
//     dueDate: "2024-03-21",
//     priority: "high"
//   }
// ]
```

## Type Definitions

All types are defined in `src/types/index.ts`.

### Thread

```typescript
interface Thread {
  id: string
  from: EmailSender
  subject: string
  preview: string
  timestamp: string          // ISO 8601 format
  unreadCount: number
  emails: Email[]
}
```

### Email

```typescript
interface Email {
  id: string
  threadId: string
  from: EmailSender
  to: EmailSender[]
  subject: string
  body: string
  timestamp: string          // ISO 8601 format
  isRead: boolean
}
```

### EmailSender

```typescript
interface EmailSender {
  name: string
  email: string
  avatar?: string            // Optional emoji or URL
}
```

### AnalysisSummary

```typescript
interface AnalysisSummary {
  bullets: string[]
  priority: Priority
}

type Priority = 'urgent' | 'action' | 'fyi'
```

### Action Types

```typescript
// Base action interface
interface ActionCard {
  id: string
  type: ActionType
  threadId: string
  emailId: string
  status: 'pending' | 'approved' | 'discarded'
  createdAt: string
}

type ActionType = 'reply' | 'calendar' | 'task'

// Reply action
interface ReplyAction extends ActionCard {
  type: 'reply'
  draftBody: string
}

// Calendar action
interface CalendarAction extends ActionCard {
  type: 'calendar'
  title: string
  date: string                // YYYY-MM-DD
  time: string                // HH:mm
  description: string
  attendees: string[]
}

// Task action
interface TaskAction extends ActionCard {
  type: 'task'
  title: string
  description: string
  dueDate: string             // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high'
}
```

### ThreadAnalysis

```typescript
interface ThreadAnalysis {
  threadId: string
  summary: AnalysisSummary
  actions: (ReplyAction | CalendarAction | TaskAction)[]
  loading: boolean
  error: string | null
  regeneratingActionId?: string
}
```

## Component APIs

### InboxList

Displays list of email threads with search/filter.

```typescript
interface InboxListProps {
  threads: Thread[]
  selectedId: string | null
  onSelectThread: (threadId: string) => void
  searchQuery: string
}
```

**Usage:**
```tsx
<InboxList
  threads={threads}
  selectedId={selectedThreadId}
  onSelectThread={setSelectedThreadId}
  searchQuery={searchQuery}
/>
```

### ThreadDetail

Displays thread emails and AI analysis.

```typescript
interface ThreadDetailProps {
  thread: Thread
  analysis: AnalysisSummary | null
  loading: boolean
  error: string | null
  onAnalyze: () => Promise<void>
}
```

**Usage:**
```tsx
<ThreadDetail
  thread={selectedThread}
  analysis={currentAnalysis?.summary || null}
  loading={currentAnalysis?.loading || false}
  error={currentAnalysis?.error || null}
  onAnalyze={handleAnalyzeThread}
/>
```

### ActionCards

Displays suggested actions with approval workflow.

```typescript
interface ActionCardsProps {
  actions: (ReplyAction | CalendarAction | TaskAction)[]
  onApprove: (actionId: string) => void
  onDiscard: (actionId: string) => void
  onRegenerate: (actionId: string) => void
  regeneratingId?: string
}
```

**Usage:**
```tsx
<ActionCards
  actions={currentAnalysis?.actions || []}
  onApprove={handleApproveAction}
  onDiscard={handleDiscardAction}
  onRegenerate={handleRegenerateAction}
  regeneratingId={currentAnalysis?.regeneratingActionId}
/>
```

### Notification

Toast notification component.

```typescript
interface NotificationProps {
  type: 'success' | 'error' | 'info'
  message: string
}
```

**Usage:**
```tsx
{toast && <Notification type={toast.type} message={toast.message} />}
```

## Mock Data

### Email Threads

Six realistic email threads are included in `src/data/emails.ts`:

1. **Q2 Budget Review** - Urgent financial planning (3 emails)
2. **OAuth Integration** - Feature request with sales impact (3 emails)
3. **Website Redesign** - Design review round 2 (3 emails)
4. **Team Offsite** - Event coordination (3 emails)
5. **Client Proposal** - $250K contract proposal (3 emails)
6. **Campaign Report** - Marketing analytics (3 emails)

Total: 6 threads, 18 emails

Access with:
```typescript
import { mockThreads } from '@/src/data/emails'
```

## Error Handling

All Groq functions return fallback values on error:

```typescript
// analyzeThread: Returns generic summary
{
  bullets: ['Unable to analyze this thread'],
  priority: 'fyi'
}

// generateReply: Returns empty string
""

// extractCalendarEvent: Returns default event
{
  title: 'Meeting from ' + thread.from.name,
  date: new Date().toISOString().split('T')[0],
  time: '14:00',
  description: thread.subject,
  attendees: [thread.from.email]
}

// extractTasks: Returns empty array
[]
```

## Rate Limits

Groq free tier limits (as of 2024):
- **Requests per minute**: ~30
- **Concurrent requests**: 2-3
- **Monthly limit**: Check your console.groq.com dashboard

## Deployment Notes

- All functions are client-side (React Server Components not used)
- Groq API key required in environment variables
- No server-side API routes needed for MVP
- Consider adding backend routes for production:
  ```typescript
  // pages/api/analyze.ts (example for future enhancement)
  export default async function handler(req, res) {
    const { thread } = req.body
    const analysis = await analyzeThread(thread)
    res.status(200).json(analysis)
  }
  ```

## Testing

To test the API locally:

```typescript
// In browser console
import { analyzeThread } from '@/src/lib/groq'
import { mockThreads } from '@/src/data/emails'

const result = await analyzeThread(mockThreads[0])
console.log(result)
```

## Version Info

- **AI SDK**: v6.0.0+
- **Groq SDK**: Latest
- **Model**: llama-3.3-70b-versatile
- **Next.js**: 16.2.0+
- **React**: 19.2.4+

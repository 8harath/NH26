# Email Triage - Smart Inbox Intelligence

An AI-powered email triage application that automatically analyzes emails, assigns priorities, and suggests actionable items (replies, calendar events, and tasks).

## Features

- **Email Inbox Management**: Browse and organize emails with unread indicators
- **AI-Powered Analysis**: Uses Groq LLM to analyze email threads and generate:
  - 3-bullet summaries
  - Priority classification (Urgent, Action Required, For Your Info)
- **Intelligent Action Suggestions**: AI automatically suggests:
  - **Draft Replies**: Generate professional email responses
  - **Calendar Events**: Extract meeting details and create events
  - **Task Extraction**: Identify and create action items from emails
- **Human-in-the-Loop Workflow**: 
  - Review AI-generated actions
  - Edit and customize suggestions
  - Approve, discard, or regenerate actions
- **Real-time Search**: Filter emails by sender, subject, or content
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **AI Integration**: Groq API with AI SDK
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Groq API key (free at https://console.groq.com)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd email-triage
```

2. Install dependencies
```bash
pnpm install
# or
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local and add your Groq API key
```

4. Run the development server
```bash
pnpm dev
# or
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main page with state management
│   └── globals.css          # Global styles and theme
├── components/
│   ├── action-cards.tsx     # Action suggestion cards (Reply, Calendar, Task)
│   ├── inbox-list.tsx       # Email inbox list sidebar
│   ├── thread-detail.tsx    # Email thread display and analysis
│   └── ui/                  # shadcn/ui components
├── src/
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── lib/
│   │   └── groq.ts          # Groq API integration and AI functions
│   └── data/
│       └── emails.ts        # Mock email dataset (6 threads, 18 emails)
└── public/                  # Static assets
```

## Key Components

### InboxList (`components/inbox-list.tsx`)
- Displays list of email threads
- Shows sender, subject, preview, and unread count
- Real-time search filtering
- Click to select threads

### ThreadDetail (`components/thread-detail.tsx`)
- Displays full email thread conversation
- Shows AI analysis summary with priority badge
- "Analyze with AI" button to trigger analysis
- Displays analysis results with 3-bullet summary

### ActionCards (`components/action-cards.tsx`)
Three expandable card types:
1. **Reply Card** (Blue): Draft email responses
   - Editable reply body
   - Approve/Discard/Regenerate actions
   
2. **Calendar Card** (Green): Create calendar events
   - Title, Date, Time, Description, Attendees
   - Full edit capability
   
3. **Task Card** (Purple): Extract action items
   - Title, Description, Due Date, Priority
   - Full edit capability

## AI Functions

### `analyzeThread(thread)`
Generates a summary with 3 bullets and priority level
- Returns: `{ bullets: string[], priority: "urgent" | "action" | "fyi" }`

### `generateReply(thread)`
Creates a professional draft email reply
- Returns: `string` (email body)

### `extractCalendarEvent(thread)`
Extracts meeting details from thread
- Returns: `{ title, date, time, description, attendees }`

### `extractTasks(thread)`
Identifies action items and todos
- Returns: `{ title, description, dueDate, priority }[]`

## Mock Data

The application includes 6 sample email threads with realistic scenarios:

1. **Q2 Budget Review** - Urgent financial planning request
2. **OAuth Integration** - Feature request with sales impact
3. **Website Redesign** - Design review round 2
4. **Team Offsite Planning** - Event coordination
5. **Client Proposal Review** - High-value contract proposal
6. **Campaign Performance Report** - Marketing analytics review

Each thread contains 2-3 emails showing realistic conversation flows.

## User Workflow

1. **Browse Inbox**: Select an email thread from the list
2. **Analyze**: Click "Analyze with AI" to trigger AI analysis
3. **Review**: Read the AI-generated summary and priority
4. **Act**: Review suggested actions (Reply, Calendar, Task)
5. **Customize**: Edit any action details as needed
6. **Manage**: 
   - ✓ Approve to confirm the action
   - ✗ Discard to remove the action
   - 🔄 Regenerate to create a new variant

## Environment Variables

- `GROQ_API_KEY` - Your Groq API key (required for AI features)

## Performance Notes

- All AI analysis happens on-demand (not pre-cached)
- Groq models used: `llama-3.3-70b-versatile` (fast inference)
- API calls are made from the client (Groq API key required in .env)
- No server-side caching or persistence

## Future Enhancements

- Server-side API routes for secure API key handling
- Database integration for persisting actions and approvals
- Email provider integrations (Gmail, Outlook, etc.)
- More AI models and customizable model selection
- Action execution (actually send replies, create calendar events)
- Advanced filtering and labeling
- Multi-user support with collaboration

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add `GROQ_API_KEY` environment variable in Vercel dashboard
4. Deploy

```bash
vercel
```

### Other Platforms

Add `GROQ_API_KEY` to your platform's environment variables during deployment.

## Troubleshooting

### "GROQ_API_KEY is not set"
- Ensure `.env.local` exists in project root
- Verify you've added your Groq API key
- For Vercel, check Settings → Environment Variables

### AI Analysis fails
- Verify Groq API key is valid
- Check Groq console for API usage limits
- Ensure you have quota available

### Components not rendering
- Run `pnpm install` to ensure all dependencies are installed
- Check browser console for TypeScript errors
- Verify all imports use `@/` path aliases

## License

MIT

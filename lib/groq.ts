import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { Thread, ComprehensiveAnalysis, RewriteAction } from '@/types'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const MODEL = 'llama-3.3-70b-versatile'

export async function comprehensiveAnalyze(thread: Thread): Promise<ComprehensiveAnalysis> {
  const emailContent = thread.emails
    .map((e) => `From: ${e.from.name} <${e.from.email}>\nDate: ${e.timestamp}\n\n${e.body}`)
    .join('\n\n---\n\n')

  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are MailMate, an AI email analysis engine. Analyze the email thread and respond with ONLY a valid JSON object. No markdown, no explanation, just JSON.

The JSON must match this exact schema:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "priority": "urgent" | "important" | "normal" | "low",
  "category": "work" | "personal" | "finance" | "updates" | "spam",
  "smartReplies": ["short reply 1", "short reply 2", "short reply 3", "short reply 4", "short reply 5"],
  "draftReply": "full professional reply draft text",
  "meetings": [{"title": "string", "date": "YYYY-MM-DD", "time": "HH:mm", "attendees": ["email"]}],
  "tasks": [{"title": "string", "deadline": "YYYY-MM-DD", "priority": "high|medium|low"}],
  "deadlines": [{"description": "string", "date": "YYYY-MM-DD", "urgent": true/false}],
  "keyInfo": {"dates": ["string"], "links": ["string"], "contacts": ["name <email>"], "amounts": ["$X"]},
  "labels": ["label1", "label2"],
  "followUpNeeded": true/false,
  "followUpSuggestion": "suggestion or empty string",
  "senderImportance": "vip" | "regular" | "unknown"
}

Guidelines:
- priority: "urgent" = immediate action/time-sensitive. "important" = needs response soon. "normal" = standard. "low" = FYI only.
- category: Classify based on content. "work" = professional/business. "personal" = personal matters. "finance" = money/invoices/budgets. "updates" = newsletters/status reports. "spam" = promotional/unwanted.
- smartReplies: Generate 5 short, natural one-click reply options appropriate to the email context. Examples: "Sounds good, I'll review it", "Thanks for the update", "Let me check and get back to you", "I'll have it ready by Friday", "Can we discuss this tomorrow?"
- draftReply: Write a full, professional reply to the most recent email. Be context-aware of the entire thread.
- meetings: Extract any meetings, calls, or events mentioned. Empty array if none.
- tasks: Extract action items with realistic deadlines. Empty array if none.
- deadlines: Extract all deadlines/due dates mentioned. Mark as urgent if within 3 days.
- keyInfo: Extract dates, URLs/links, contact info, and monetary amounts mentioned. Empty arrays if none.
- labels: Suggest 2-4 short labels for organizing this email (e.g., "budget", "q2", "design-review", "client").
- followUpNeeded: true if the latest email expects a response from the user.
- followUpSuggestion: If follow-up needed, suggest when/how to follow up.
- senderImportance: "vip" for executives/clients/key stakeholders, "regular" for known contacts, "unknown" for new senders.`,
    prompt: `Analyze this email thread:\n\nSubject: ${thread.subject}\nFrom: ${thread.from.name} <${thread.from.email}>\n\nThread:\n${emailContent}`,
  })

  try {
    // Clean potential markdown wrapping
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)

    return {
      summary: Array.isArray(result.summary) ? result.summary.slice(0, 3) : ['Unable to summarize'],
      priority: ['urgent', 'important', 'normal', 'low'].includes(result.priority) ? result.priority : 'normal',
      category: ['work', 'personal', 'finance', 'updates', 'spam'].includes(result.category) ? result.category : 'work',
      smartReplies: Array.isArray(result.smartReplies) ? result.smartReplies.slice(0, 5) : [],
      draftReply: typeof result.draftReply === 'string' ? result.draftReply : '',
      meetings: Array.isArray(result.meetings) ? result.meetings.map((m: Record<string, unknown>) => ({
        title: String(m.title ?? 'Meeting'),
        date: String(m.date ?? ''),
        time: String(m.time ?? ''),
        attendees: Array.isArray(m.attendees) ? m.attendees.map(String) : [],
      })) : [],
      tasks: Array.isArray(result.tasks) ? result.tasks.map((t: Record<string, unknown>) => ({
        title: String(t.title ?? 'Task'),
        deadline: String(t.deadline ?? ''),
        priority: ['high', 'medium', 'low'].includes(String(t.priority)) ? String(t.priority) as 'high' | 'medium' | 'low' : 'medium',
      })) : [],
      deadlines: Array.isArray(result.deadlines) ? result.deadlines.map((d: Record<string, unknown>) => ({
        description: String(d.description ?? ''),
        date: String(d.date ?? ''),
        urgent: Boolean(d.urgent),
      })) : [],
      keyInfo: {
        dates: Array.isArray(result.keyInfo?.dates) ? result.keyInfo.dates.map(String) : [],
        links: Array.isArray(result.keyInfo?.links) ? result.keyInfo.links.map(String) : [],
        contacts: Array.isArray(result.keyInfo?.contacts) ? result.keyInfo.contacts.map(String) : [],
        amounts: Array.isArray(result.keyInfo?.amounts) ? result.keyInfo.amounts.map(String) : [],
      },
      labels: Array.isArray(result.labels) ? result.labels.map(String).slice(0, 4) : [],
      followUpNeeded: Boolean(result.followUpNeeded),
      followUpSuggestion: typeof result.followUpSuggestion === 'string' ? result.followUpSuggestion : '',
      senderImportance: ['vip', 'regular', 'unknown'].includes(result.senderImportance) ? result.senderImportance : 'regular',
    }
  } catch {
    return {
      summary: ['Unable to analyze this thread'],
      priority: 'normal',
      category: 'work',
      smartReplies: [],
      draftReply: '',
      meetings: [],
      tasks: [],
      deadlines: [],
      keyInfo: { dates: [], links: [], contacts: [], amounts: [] },
      labels: [],
      followUpNeeded: false,
      followUpSuggestion: '',
      senderImportance: 'unknown',
    }
  }
}

export async function composeDraft(subject: string, context?: string): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: 'You are a professional email assistant. Write a clear, professional email body based on the subject and context. Return ONLY the email body text.',
    prompt: `Write an email about: ${subject}${context ? `\n\nContext: ${context}` : ''}`,
  })
  return text.trim()
}

const rewritePrompts: Record<RewriteAction, string> = {
  'formalize': 'Rewrite the following email text in a formal, professional tone. Keep the same meaning but make it polished and business-appropriate. Always include a proper greeting (e.g., "Dear [Name]," or "Hi [Name],") at the start and a professional sign-off (e.g., "Best regards," or "Kind regards,") at the end.',
  'shorten': 'Rewrite the following email text to be much shorter and more concise. Keep the key message but remove unnecessary words. Always preserve or add a brief greeting at the start and a short sign-off at the end.',
  'elaborate': 'Expand the following email text with more detail, context, and explanation. Make it more thorough while keeping the core message. Always include a warm greeting at the start and a professional sign-off at the end.',
  'fix-grammar': 'Fix all grammar, spelling, and punctuation errors in the following email text. Keep the original tone and style. If a greeting or sign-off is missing, add an appropriate one.',
}

export async function rewriteText(text: string, action: RewriteAction, senderName?: string, recipientName?: string): Promise<string> {
  const nameContext = []
  if (recipientName) nameContext.push(`The recipient's name is "${recipientName}" — use it in the greeting (e.g., "Hi ${recipientName}," or "Dear ${recipientName},"). Do NOT use placeholder text like [Name] or [Recipient].`)
  if (senderName) nameContext.push(`The sender's name is "${senderName}" — use it in the sign-off (e.g., "Best regards,\\n${senderName}"). Do NOT use placeholder text like [Your Name] or [Sender].`)
  const nameInstructions = nameContext.length > 0 ? '\n\n' + nameContext.join('\n') : ''

  const { text: result } = await generateText({
    model: groq(MODEL),
    system: `You are an email writing assistant. ${rewritePrompts[action]} The output must be a complete email body with greeting and sign-off. Return ONLY the rewritten email text. No explanations, no quotes, no prefixes like "Here is...".${nameInstructions}`,
    prompt: text,
  })
  return result.trim()
}

export async function chatAboutThread(message: string, thread: Thread | null): Promise<string> {
  const emailContext = thread
    ? thread.emails.map((e) => `From: ${e.from.name}\n${e.body}`).join('\n---\n')
    : 'No email selected.'

  const { text } = await generateText({
    model: groq(MODEL),
    system: 'You are MailMate, an AI email assistant. Help users understand and respond to emails. Be concise and actionable.',
    prompt: `Email thread context:\nSubject: ${thread?.subject ?? 'None'}\n\n${emailContext}\n\nUser: ${message}`,
  })
  return text.trim()
}

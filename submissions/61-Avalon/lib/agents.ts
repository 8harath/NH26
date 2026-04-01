import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createAgentTools } from './agent-tools'
import { Thread, AgentStep } from '@/types'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

function formatSteps(steps: Awaited<ReturnType<typeof generateText>>['steps']): AgentStep[] {
  return steps.map((s) => ({
    toolCalls: s.toolCalls?.map((tc) => ({ name: tc.toolName, args: tc.args as Record<string, unknown> })),
    toolResults: s.toolResults?.map((tr) => ({ name: tr.toolName, result: tr.result as unknown })),
    text: s.text || undefined,
  }))
}

// ─── Email Assistant Agent ──────────────────────────────────────

export async function runEmailAssistant(
  message: string,
  thread: Thread | null,
  accessToken: string | null,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  memoryContext: string = ''
) {
  const tools = accessToken ? createAgentTools(accessToken) : {}

  const threadContext = thread
    ? `Currently viewing thread: "${thread.subject}" from ${thread.from.name} <${thread.from.email}>\n` +
      `Thread has ${thread.emails.length} messages.\n\n` +
      thread.emails
        .slice(-3)
        .map(
          (e) =>
            `[${e.from.name} <${e.from.email}>] (${e.timestamp}):\n${e.body.slice(0, 500)}`
        )
        .join('\n---\n')
    : 'No email thread is currently selected.'

  const hasTools = Object.keys(tools).length > 0

  const systemPrompt = `You are MailMate, an intelligent email assistant.${
    hasTools
      ? `

You have access to tools for Gmail and Google Calendar. You can:
- Search the inbox for emails (searchInbox)
- Read full email threads (readThread)
- Check upcoming calendar events (listCalendarEvents)
- Create calendar events (createCalendarEvent)
- Draft email replies for review (draftReply)
- Send emails after user confirmation (sendEmail)
- Archive, star, or trash threads (modifyThread)

IMPORTANT RULES:
1. NEVER send an email without explicit user confirmation. Always draft first.
2. Explain what you're doing before using a tool.
3. When you search or read emails, summarize the key findings.
4. For calendar operations, always check for conflicts first.`
      : '\n\nYou are in demo mode without Gmail/Calendar access. Answer based on the email context provided.'
  }

Current context:
${threadContext}
${memoryContext}
Today's date: ${new Date().toISOString().split('T')[0]}`

  const { text, steps } = await generateText({
    model: groq(MODEL),
    system: systemPrompt,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ],
    tools,
    maxSteps: 5,
  })

  return {
    reply: text,
    steps: formatSteps(steps),
  }
}

// ─── Triage Agent ───────────────────────────────────────────────

export async function runTriageAgent(accessToken: string, memoryContext: string = '') {
  const tools = createAgentTools(accessToken)

  const { text, steps } = await generateText({
    model: groq(MODEL),
    system: `You are MailMate Triage, an AI inbox organizer.

Your job:
1. Search for unread emails in the user's inbox.
2. For each thread, classify its priority (urgent / important / normal / low).
3. Suggest a specific action for each: reply now, schedule follow-up, archive, or read later.
4. Present an executive summary: what needs attention now, what can wait, and what to skip.

Use the searchInbox tool with "is:unread" to find unread messages.
If needed, use readThread to get more context on ambiguous threads.
Be concise and actionable. Format your response as a clear triage report.
${memoryContext}
Today's date: ${new Date().toISOString().split('T')[0]}`,
    prompt: 'Review my unread inbox and give me a triage summary with priorities and recommended actions.',
    tools,
    maxSteps: 5,
  })

  return { summary: text, steps: formatSteps(steps) }
}

// ─── Scheduling Agent ───────────────────────────────────────────

export async function runSchedulingAgent(thread: Thread, accessToken: string, memoryContext: string = '') {
  const tools = createAgentTools(accessToken)

  const emailContent = thread.emails
    .slice(-3)
    .map((e) => `[${e.from.name}]: ${e.body.slice(0, 500)}`)
    .join('\n---\n')

  const { text, steps } = await generateText({
    model: groq(MODEL),
    system: `You are MailMate Scheduler, an AI meeting coordinator.

Your job:
1. Extract any meeting requests, proposed times, or scheduling needs from the email thread.
2. Check the user's calendar for conflicts using listCalendarEvents.
3. Suggest available time slots that work.
4. Offer to create a calendar event and draft a confirmation reply.

IMPORTANT: Always check the calendar before suggesting times.
NEVER create an event without the user explicitly asking for it — only propose.
${memoryContext}
Today's date: ${new Date().toISOString().split('T')[0]}`,
    prompt: `Process this email thread for scheduling:\n\nSubject: ${thread.subject}\nFrom: ${thread.from.name} <${thread.from.email}>\n\n${emailContent}`,
    tools,
    maxSteps: 6,
  })

  return { reply: text, steps: formatSteps(steps) }
}

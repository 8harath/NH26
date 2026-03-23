import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  const { subject, context } = await request.json()

  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are a professional email drafting assistant. Write clear, concise, and professional email bodies.
Return ONLY the email body text — no subject line, no "Subject:" prefix, no salutation like "Dear..." unless it fits naturally.
Keep it professional and appropriately brief.`,
      prompt: `Draft a new email body for the following subject${context ? ` with this additional context: ${context}` : ''}.

Subject: ${subject}`,
    })

    return NextResponse.json({ body: text.trim() })
  } catch (error) {
    console.error('Compose error:', error)
    return NextResponse.json({ error: 'Email drafting failed. Check your GROQ_API_KEY.' }, { status: 500 })
  }
}

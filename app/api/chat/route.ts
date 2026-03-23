import { NextRequest, NextResponse } from 'next/server'
import { chatAboutThread } from '@/lib/groq'
import { mockThreads } from '@/data/emails'
import { Thread } from '@/types'

export async function POST(request: NextRequest) {
  const { message, threadId, thread: inlineThread } = await request.json()

  let thread: Thread | null = null
  if (inlineThread && inlineThread.id && inlineThread.emails) {
    thread = inlineThread as Thread
  } else if (threadId) {
    thread = mockThreads.find((t) => t.id === threadId) ?? null
  }

  try {
    const reply = await chatAboutThread(message, thread)
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ reply: 'Sorry, something went wrong. Please try again.' })
  }
}

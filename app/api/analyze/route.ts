import { NextRequest, NextResponse } from 'next/server'
import { comprehensiveAnalyze } from '@/lib/groq'
import { mockThreads } from '@/data/emails'
import { Thread } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { threadId, thread: inlineThread } = body

  // If full thread data is provided (Gmail mode), use it directly
  // Otherwise fall back to mock threads lookup (demo mode)
  let thread: Thread | undefined
  if (inlineThread && inlineThread.id && inlineThread.emails) {
    thread = inlineThread as Thread
  } else {
    thread = mockThreads.find((t) => t.id === threadId)
  }

  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  try {
    const analysis = await comprehensiveAnalyze(thread)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed. Check your GROQ_API_KEY.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { rewriteText } from '@/lib/groq'
import { RewriteAction } from '@/types'

const validActions: RewriteAction[] = ['formalize', 'shorten', 'elaborate', 'fix-grammar']

export async function POST(request: NextRequest) {
  const { text, action, senderName, recipientName } = await request.json()

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
    const result = await rewriteText(text, action, senderName, recipientName)
    return NextResponse.json({ text: result })
  } catch (error) {
    console.error('Rewrite error:', error)
    return NextResponse.json({ error: 'Rewrite failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { to, subject, body, threadId, inReplyTo } = await request.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 })
  }

  try {
    const result = await sendEmail(session.accessToken, to, subject, body, threadId, inReplyTo)
    return NextResponse.json({ success: true, messageId: result.id })
  } catch (error) {
    console.error('Gmail send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

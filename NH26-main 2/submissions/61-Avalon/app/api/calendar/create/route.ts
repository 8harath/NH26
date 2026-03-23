import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCalendarEvent } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { title, date, time, duration, description, attendees } = await request.json()

  if (!title || !date) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }

  try {
    const event = await createCalendarEvent(session.accessToken, {
      title, date, time, duration, description, attendees,
    })
    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Calendar create error:', error)
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
}

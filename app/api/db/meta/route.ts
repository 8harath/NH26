import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getThreadMetas, saveThreadMeta } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const metas = await getThreadMetas(session.userId)
    return NextResponse.json({ metas })
  } catch (error) {
    console.error('Get metas error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { threadId, ...meta } = await request.json()
  if (!threadId) return NextResponse.json({ error: 'threadId required' }, { status: 400 })

  try {
    await saveThreadMeta(session.userId, threadId, meta)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save meta error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

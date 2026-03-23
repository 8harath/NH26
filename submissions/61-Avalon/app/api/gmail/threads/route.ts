import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFullThreads } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const maxResults = parseInt(searchParams.get('max') ?? '20')

  try {
    const threads = await getFullThreads(session.accessToken, maxResults, query)
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Gmail threads error:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}

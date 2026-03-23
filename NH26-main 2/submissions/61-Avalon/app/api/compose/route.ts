import { NextRequest, NextResponse } from 'next/server'
import { composeDraft } from '@/lib/groq'

export async function POST(request: NextRequest) {
  const { subject, context } = await request.json()
  try {
    const body = await composeDraft(subject, context)
    return NextResponse.json({ body })
  } catch (error) {
    console.error('Compose error:', error)
    return NextResponse.json({ body: '' }, { status: 200 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserLabels, createUserLabel, deleteUserLabel } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const labels = await getUserLabels(session.userId)
    return NextResponse.json({ labels })
  } catch (error) {
    console.error('Get labels error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  try {
    const label = await createUserLabel(session.userId, name)
    return NextResponse.json({ label })
  } catch (error) {
    console.error('Create label error:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await deleteUserLabel(session.userId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete label error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

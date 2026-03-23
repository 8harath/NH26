import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create clients if env vars are set
let supabase: SupabaseClient | null = null
let supabaseAdmin: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase
}

export { supabase, supabaseAdmin }

// ─── Database helpers (no-op when Supabase not configured) ──────

export async function upsertUser(user: { id: string; email: string; name: string; image?: string }) {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin.from('users').upsert({
    id: user.id, email: user.email, name: user.name,
    avatar_url: user.image ?? null, updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) console.error('upsertUser error:', error)
}

export async function saveAnalysis(userId: string, threadId: string, gmailThreadId: string, analysis: Record<string, unknown>) {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin.from('analyses').upsert({
    user_id: userId, thread_id: threadId, gmail_thread_id: gmailThreadId,
    analysis_data: analysis, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,thread_id' })
  if (error) console.error('saveAnalysis error:', error)
}

export async function getAnalysis(userId: string, threadId: string) {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin.from('analyses')
    .select('analysis_data').eq('user_id', userId).eq('thread_id', threadId).single()
  return data?.analysis_data ?? null
}

export async function saveThreadMeta(userId: string, threadId: string, meta: Record<string, unknown>) {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin.from('thread_meta').upsert({
    user_id: userId, thread_id: threadId, ...meta, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,thread_id' })
  if (error) console.error('saveThreadMeta error:', error)
}

export async function getThreadMetas(userId: string) {
  if (!supabaseAdmin) return []
  const { data } = await supabaseAdmin.from('thread_meta').select('*').eq('user_id', userId)
  return data ?? []
}

export async function getUserLabels(userId: string) {
  if (!supabaseAdmin) return []
  const { data } = await supabaseAdmin.from('user_labels').select('*').eq('user_id', userId).order('name')
  return data ?? []
}

export async function createUserLabel(userId: string, name: string) {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin.from('user_labels').insert({ user_id: userId, name }).select().single()
  if (error) console.error('createUserLabel error:', error)
  return data
}

export async function deleteUserLabel(userId: string, labelId: string) {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin.from('user_labels').delete().eq('id', labelId).eq('user_id', userId)
  if (error) console.error('deleteUserLabel error:', error)
}

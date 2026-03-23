import { google } from 'googleapis'

function getOAuth2Client(accessToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2.setCredentials({ access_token: accessToken })
  return oauth2
}

export interface GmailThread {
  id: string
  historyId: string
  messages: GmailMessage[]
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  internalDate: string
  payload: {
    headers: { name: string; value: string }[]
    mimeType: string
    body?: { data?: string; size: number }
    parts?: { mimeType: string; body?: { data?: string; size: number } }[]
  }
}

// ─── Parse helpers ──────────────────────────────────────────────

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

function extractBody(payload: GmailMessage['payload']): string {
  // Try plain text first
  if (payload.parts) {
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain')
    if (textPart?.body?.data) return decodeBase64Url(textPart.body.data)
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html')
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data)
      return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    }
  }
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  return ''
}

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/)
  if (match) return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() }
  return { name: raw, email: raw }
}

// ─── API functions ──────────────────────────────────────────────

export async function listThreads(accessToken: string, maxResults = 20, query?: string) {
  const auth = getOAuth2Client(accessToken)
  const gmail = google.gmail({ version: 'v1', auth })

  const { data } = await gmail.users.threads.list({
    userId: 'me',
    maxResults,
    q: query || undefined,
  })

  return data.threads ?? []
}

export async function getThread(accessToken: string, threadId: string): Promise<GmailThread | null> {
  const auth = getOAuth2Client(accessToken)
  const gmail = google.gmail({ version: 'v1', auth })

  try {
    const { data } = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    })
    return data as unknown as GmailThread
  } catch {
    return null
  }
}

export async function getFullThreads(accessToken: string, maxResults = 20, query?: string) {
  const threadList = await listThreads(accessToken, maxResults, query)

  const threads = await Promise.all(
    threadList.map(async (t) => {
      const full = await getThread(accessToken, t.id!)
      if (!full) return null

      const messages = full.messages ?? []
      const firstMsg = messages[0]
      if (!firstMsg) return null

      const headers = firstMsg.payload.headers
      const from = parseEmailAddress(getHeader(headers, 'From'))
      const subject = getHeader(headers, 'Subject') || '(No subject)'

      const emails = messages.map(msg => {
        const h = msg.payload.headers
        const msgFrom = parseEmailAddress(getHeader(h, 'From'))
        const msgTo = getHeader(h, 'To').split(',').map(t => parseEmailAddress(t.trim()))

        return {
          id: msg.id,
          threadId: msg.threadId,
          from: msgFrom,
          to: msgTo,
          subject: getHeader(h, 'Subject') || subject,
          body: extractBody(msg.payload),
          timestamp: new Date(parseInt(msg.internalDate)).toISOString(),
          isRead: !msg.labelIds?.includes('UNREAD'),
          labelIds: msg.labelIds ?? [],
        }
      })

      const unreadCount = messages.filter(m => m.labelIds?.includes('UNREAD')).length
      const latestMsg = messages[messages.length - 1]
      const latestDate = new Date(parseInt(latestMsg.internalDate)).toISOString()

      // Determine category from Gmail labels
      let category: 'work' | 'personal' | 'finance' | 'updates' | 'spam' = 'work'
      const allLabels = messages.flatMap(m => m.labelIds ?? [])
      if (allLabels.includes('CATEGORY_PROMOTIONS') || allLabels.includes('SPAM')) category = 'spam'
      else if (allLabels.includes('CATEGORY_UPDATES')) category = 'updates'
      else if (allLabels.includes('CATEGORY_PERSONAL')) category = 'personal'
      else if (allLabels.includes('CATEGORY_SOCIAL')) category = 'personal'
      else if (allLabels.includes('CATEGORY_FORUMS')) category = 'updates'

      return {
        id: full.id,
        from: { ...from, avatar: undefined },
        subject,
        preview: firstMsg.snippet || '',
        timestamp: latestDate,
        unreadCount,
        emails,
        category,
        gmailLabels: allLabels,
      }
    })
  )

  return threads.filter(Boolean)
}

export async function sendEmail(accessToken: string, to: string, subject: string, body: string, threadId?: string, inReplyTo?: string) {
  const auth = getOAuth2Client(accessToken)
  const gmail = google.gmail({ version: 'v1', auth })

  // Get user's email
  const { data: profile } = await gmail.users.getProfile({ userId: 'me' })
  const fromEmail = profile.emailAddress!

  let rawHeaders = `From: ${fromEmail}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n`
  if (inReplyTo) {
    rawHeaders += `In-Reply-To: ${inReplyTo}\nReferences: ${inReplyTo}\n`
  }
  rawHeaders += `\n${body}`

  const raw = Buffer.from(rawHeaders).toString('base64url')

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId },
  })

  return data
}

export async function modifyThread(accessToken: string, threadId: string, addLabels: string[], removeLabels: string[]) {
  const auth = getOAuth2Client(accessToken)
  const gmail = google.gmail({ version: 'v1', auth })

  await gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: {
      addLabelIds: addLabels.length > 0 ? addLabels : undefined,
      removeLabelIds: removeLabels.length > 0 ? removeLabels : undefined,
    },
  })
}

export async function markAsRead(accessToken: string, threadId: string) {
  return modifyThread(accessToken, threadId, [], ['UNREAD'])
}

export async function markAsUnread(accessToken: string, threadId: string) {
  return modifyThread(accessToken, threadId, ['UNREAD'], [])
}

export async function starThread(accessToken: string, threadId: string) {
  return modifyThread(accessToken, threadId, ['STARRED'], [])
}

export async function unstarThread(accessToken: string, threadId: string) {
  return modifyThread(accessToken, threadId, [], ['STARRED'])
}

export async function trashThread(accessToken: string, threadId: string) {
  const auth = getOAuth2Client(accessToken)
  const gmail = google.gmail({ version: 'v1', auth })
  await gmail.users.threads.trash({ userId: 'me', id: threadId })
}

export async function archiveThread(accessToken: string, threadId: string) {
  return modifyThread(accessToken, threadId, [], ['INBOX'])
}

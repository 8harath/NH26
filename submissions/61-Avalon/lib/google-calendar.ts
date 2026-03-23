import { google } from 'googleapis'

function getOAuth2Client(accessToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2.setCredentials({ access_token: accessToken })
  return oauth2
}

export interface CalendarEventInput {
  title: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:mm (optional, creates all-day if missing)
  duration?: number   // minutes (default 60)
  description?: string
  attendees?: string[] // email addresses
}

export async function createCalendarEvent(accessToken: string, event: CalendarEventInput) {
  const auth = getOAuth2Client(accessToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const duration = event.duration ?? 60

  let start: { dateTime?: string; date?: string; timeZone?: string }
  let end: { dateTime?: string; date?: string; timeZone?: string }

  if (event.time) {
    // Timed event
    const startDt = new Date(`${event.date}T${event.time}:00`)
    const endDt = new Date(startDt.getTime() + duration * 60000)
    start = { dateTime: startDt.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    end = { dateTime: endDt.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  } else {
    // All-day event
    const nextDay = new Date(event.date)
    nextDay.setDate(nextDay.getDate() + 1)
    start = { date: event.date }
    end = { date: nextDay.toISOString().split('T')[0] }
  }

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      start,
      end,
      attendees: event.attendees?.map(email => ({ email })),
      reminders: { useDefault: true },
    },
  })

  return {
    id: data.id,
    htmlLink: data.htmlLink,
    summary: data.summary,
    start: data.start,
    end: data.end,
  }
}

export async function listUpcomingEvents(accessToken: string, maxResults = 10) {
  const auth = getOAuth2Client(accessToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (data.items ?? []).map(e => ({
    id: e.id,
    title: e.summary ?? '(No title)',
    start: e.start?.dateTime ?? e.start?.date ?? '',
    end: e.end?.dateTime ?? e.end?.date ?? '',
    htmlLink: e.htmlLink,
    attendees: (e.attendees ?? []).map(a => a.email ?? ''),
  }))
}

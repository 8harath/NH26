import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { upsertUser } from '@/lib/supabase'

const providers = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, save tokens
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.userId = account.providerAccountId
      }

      // Refresh token if expired
      if (token.expiresAt && Date.now() / 1000 > (token.expiresAt as number)) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          })
          const data = await response.json()
          if (data.access_token) {
            token.accessToken = data.access_token
            token.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
        }
      }

      if (profile) {
        token.name = profile.name
        token.email = profile.email
        token.picture = (profile as Record<string, unknown>).picture as string | undefined
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.userId = token.userId as string
      if (session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (user && account) {
        try {
          await upsertUser({
            id: account.providerAccountId,
            email: user.email ?? '',
            name: user.name ?? '',
            image: user.image ?? undefined,
          })
        } catch (e) {
          console.error('upsertUser on sign-in:', e)
        }
      }
      return true
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
}

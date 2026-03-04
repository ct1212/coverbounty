import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { band: { select: { id: true } } },
        })

        if (!user?.password_hash) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash,
        )

        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          bandId: user.band?.id ?? null,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.bandId = (user as { bandId?: string | null }).bandId ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.bandId = (token.bandId as string) ?? undefined
      }
      return session
    },
  },
})

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Band Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const band = await prisma.band.findUnique({
          where: { email: credentials.email as string },
        })

        if (!band?.password_hash) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          band.password_hash,
        )

        if (!valid) return null

        return {
          id: band.id,
          name: band.name,
          email: band.email,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/band/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.bandId = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.bandId as string
      }
      return session
    },
  },
})

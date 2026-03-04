import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

const COOKIE_NAME = 'cb_fan_session'

export async function getOrCreateFan(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    const fan = await prisma.fan.findUnique({
      where: { fan_session_token: token },
    })
    if (fan) return fan.id
  }

  // Create new fan with session token
  const newToken = crypto.randomUUID()
  const fan = await prisma.fan.create({
    data: { fan_session_token: newToken },
  })

  cookieStore.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  return fan.id
}

export async function getFanId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const fan = await prisma.fan.findUnique({
    where: { fan_session_token: token },
  })

  return fan?.id ?? null
}

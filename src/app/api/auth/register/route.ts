import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, bandName } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'name, email, and password are required' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      )
    }

    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        ...(bandName
          ? {
              band: {
                create: { name: bandName },
              },
            }
          : {}),
      },
      include: { band: { select: { id: true } } },
    })

    return NextResponse.json(
      {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          bandId: user.band?.id ?? null,
          created_at: user.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

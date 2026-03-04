import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

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

    const existing = await prisma.band.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'A band with this email already exists' },
        { status: 409 },
      )
    }

    const password_hash = await bcrypt.hash(password, 10)

    const band = await prisma.band.create({
      data: { name, email, password_hash },
      select: { id: true, name: true, email: true, created_at: true },
    })

    return NextResponse.json({ data: band }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, stripe_connect_id, default_request_cutoff } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }

    const band = await prisma.band.create({
      data: {
        name,
        email,
        stripe_connect_id: stripe_connect_id ?? null,
        default_request_cutoff: default_request_cutoff ?? 0,
      },
    })

    return NextResponse.json({ data: band }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A band with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

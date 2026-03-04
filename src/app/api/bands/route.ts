import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, stripe_connect_id, default_request_cutoff } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const band = await prisma.band.create({
      data: {
        name,
        stripe_connect_id: stripe_connect_id ?? null,
        default_request_cutoff: default_request_cutoff ?? 0,
      },
    })

    return NextResponse.json({ data: band }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

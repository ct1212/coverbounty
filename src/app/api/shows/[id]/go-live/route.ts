import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emitToShow } from '@/lib/socket'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const show = await prisma.show.findUnique({ where: { id } })
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    if (show.status === 'live') {
      return NextResponse.json({ error: 'Show is already live' }, { status: 409 })
    }

    if (!['created', 'synced'].includes(show.status)) {
      return NextResponse.json(
        { error: `Cannot go live from status: ${show.status}` },
        { status: 400 },
      )
    }

    const updated = await prisma.show.update({
      where: { id },
      data: { status: 'live' },
      include: { band: { select: { id: true, name: true } } },
    })

    emitToShow(id, 'show:live', updated)

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

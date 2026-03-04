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

    if (show.status !== 'live') {
      return NextResponse.json(
        { error: `Cannot end show with status: ${show.status}` },
        { status: 400 },
      )
    }

    const settlementDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // Move open bounties to settling
    await prisma.bounty.updateMany({
      where: { show_id: id, status: 'open' },
      data: { status: 'settling', settlement_deadline: settlementDeadline },
    })

    const updated = await prisma.show.update({
      where: { id },
      data: {
        status: 'settling',
        settlement_deadline: settlementDeadline,
      },
      include: { band: { select: { id: true, name: true } } },
    })

    emitToShow(id, 'show:ended', updated)

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emitToShow } from '@/lib/socket'

// Band calls this to mark a bounty song as played
// Opens a 2-hour settlement window for fan confirmation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: { show: true },
    })

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'open') {
      return NextResponse.json(
        { error: `Cannot mark played for bounty with status: ${bounty.status}` },
        { status: 400 },
      )
    }

    const settlementDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

    const updated = await prisma.bounty.update({
      where: { id },
      data: {
        status: 'settling',
        settlement_deadline: settlementDeadline,
      },
      include: { song: true },
    })

    emitToShow(bounty.show_id, 'bounty:updated', updated)

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

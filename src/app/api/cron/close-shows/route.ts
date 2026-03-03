import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emitToShow } from '@/lib/socket'

// Called by a cron job (or manually) to close shows that have ended
// and move their open bounties into settlement window.
// Auth: expects CRON_SECRET header for production use.
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret')
  if (
    process.env.CRON_SECRET &&
    cronSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    // Find all live shows that ended more than 30 minutes ago
    const expiredShows = await prisma.show.findMany({
      where: {
        status: 'live',
        end_time: { lte: thirtyMinutesAgo },
      },
      include: {
        bounties: {
          where: { status: 'open' },
        },
      },
    })

    if (expiredShows.length === 0) {
      return NextResponse.json({ data: { processed: 0, message: 'No expired shows found' } })
    }

    const settlementDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    const results = []

    for (const show of expiredShows) {
      // Move all open bounties to settling
      await prisma.bounty.updateMany({
        where: { show_id: show.id, status: 'open' },
        data: { status: 'settling', settlement_deadline: settlementDeadline },
      })

      // Move show to settling
      const updatedShow = await prisma.show.update({
        where: { id: show.id },
        data: { status: 'settling', settlement_deadline: settlementDeadline },
      })

      emitToShow(show.id, 'show:settling', {
        show: updatedShow,
        settlement_deadline: settlementDeadline,
        bounties_settling: show.bounties.length,
      })

      results.push({
        show_id: show.id,
        bounties_moved: show.bounties.length,
      })
    }

    return NextResponse.json({ data: { processed: results.length, results } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Also allow GET for health check / Vercel cron
export async function GET(request: NextRequest) {
  return POST(request)
}

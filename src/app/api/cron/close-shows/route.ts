import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { autoEndShowIfExpired } from '@/lib/show-lifecycle'

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
    })

    if (expiredShows.length === 0) {
      return NextResponse.json({ data: { processed: 0, message: 'No expired shows found' } })
    }

    const results = []

    for (const show of expiredShows) {
      const ended = await autoEndShowIfExpired(show.id)
      if (ended) {
        results.push({ show_id: show.id })
      }
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

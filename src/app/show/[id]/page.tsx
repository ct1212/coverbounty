import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import BountyBoard from '@/components/bounty/BountyBoard'
import { autoEndShowIfExpired } from '@/lib/show-lifecycle'

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Handle demo show
  if (id === 'demo') {
    return <BountyBoard showId="demo" />
  }

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      band: { select: { id: true, name: true } },
      bounties: {
        include: { song: true },
        orderBy: { total_amount: 'desc' },
      },
    },
  })

  if (!show) notFound()

  // Auto-end show if past end_time
  if (show.status === 'live' && show.end_time <= new Date()) {
    const ended = await autoEndShowIfExpired(show.id)
    if (ended) {
      // Re-read status after transition
      show.status = 'settling'
    }
  }

  const showData = {
    id: show.id,
    bandName: show.band.name,
    venueName: show.venue_name,
    startTime: show.start_time.toISOString(),
    endTime: show.end_time.toISOString(),
    status: show.status as 'synced' | 'created' | 'live' | 'settling' | 'ended',
    requestCutoff: show.request_cutoff ?? 0,
    requestsLockedAt: show.requests_locked_at?.toISOString() ?? null,
  }

  const bountyData = show.bounties.map((b) => ({
    id: b.id,
    songTitle: b.song.title,
    artist: b.song.artist,
    songId: b.song.id,
    totalAmount: b.total_amount,
    backerCount: b.backer_count,
    status: b.status,
  }))

  return (
    <BountyBoard showId={show.id} initialShow={showData} initialBounties={bountyData} />
  )
}

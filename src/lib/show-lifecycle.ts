import { prisma } from '@/lib/db'
import { emitToShow } from '@/lib/socket'

/**
 * Auto-end a show if it's live and past its end_time.
 * Transitions open bounties to settling, sets 2hr settlement deadline.
 * Idempotent: returns false if already transitioned or not applicable.
 */
export async function autoEndShowIfExpired(showId: string): Promise<boolean> {
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: { bounties: { where: { status: 'open' } } },
  })

  if (!show || show.status !== 'live') return false
  if (show.end_time > new Date()) return false

  const settlementDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000)

  await prisma.bounty.updateMany({
    where: { show_id: show.id, status: 'open' },
    data: { status: 'settling', settlement_deadline: settlementDeadline },
  })

  const updatedShow = await prisma.show.update({
    where: { id: show.id },
    data: { status: 'settling', settlement_deadline: settlementDeadline },
  })

  emitToShow(show.id, 'show:settling', {
    show: updatedShow,
    settlement_deadline: settlementDeadline,
    bounties_settling: show.bounties.length,
  })

  return true
}

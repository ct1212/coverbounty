/**
 * Refresh show dates so they're in the future for demo/dev purposes.
 * Usage: npx tsx scripts/refresh-shows.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  // Fillmore: live show, happening right now
  await prisma.show.update({
    where: { id: 'show-fillmore-live' },
    data: {
      status: 'live',
      start_time: new Date(now.getTime() - 60 * 60 * 1000),
      end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      settlement_deadline: null,
    },
  }).catch(() => console.log('show-fillmore-live not found, skipping'))

  // Troubadour: upcoming in 5 days
  await prisma.show.update({
    where: { id: 'show-troubadour-upcoming' },
    data: {
      status: 'created',
      start_time: new Date(now.getTime() + 5 * day),
      end_time: new Date(now.getTime() + 5 * day + 3 * 60 * 60 * 1000),
    },
  }).catch(() => console.log('show-troubadour-upcoming not found, skipping'))

  // House of Blues: upcoming in 2 weeks
  await prisma.show.update({
    where: { id: 'show-hob-settling' },
    data: {
      status: 'created',
      start_time: new Date(now.getTime() + 14 * day),
      end_time: new Date(now.getTime() + 14 * day + 3 * 60 * 60 * 1000),
      settlement_deadline: null,
    },
  }).catch(() => console.log('show-hob-settling not found, skipping'))

  // Red Rocks: upcoming in 6 weeks
  await prisma.show.update({
    where: { id: 'show-redrocks-ended' },
    data: {
      status: 'created',
      start_time: new Date(now.getTime() + 42 * day),
      end_time: new Date(now.getTime() + 42 * day + 4 * 60 * 60 * 1000),
    },
  }).catch(() => console.log('show-redrocks-ended not found, skipping'))

  // Reset bounties on refreshed shows to open
  await prisma.bounty.updateMany({
    where: {
      show_id: { in: ['show-hob-settling', 'show-redrocks-ended'] },
      status: { in: ['settling', 'completed', 'refunded'] },
    },
    data: { status: 'open', settlement_deadline: null },
  })

  const shows = await prisma.show.findMany({
    select: { id: true, venue_name: true, status: true, start_time: true, end_time: true },
    orderBy: { start_time: 'asc' },
  })

  console.log('Updated shows:')
  for (const s of shows) {
    const daysOut = Math.round((s.start_time.getTime() - now.getTime()) / day)
    console.log(`  ${s.venue_name.padEnd(30)} ${s.status.padEnd(10)} ${daysOut >= 0 ? `in ${daysOut} days` : 'now'}`)
  }

  await prisma.$disconnect()
}

main()

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

async function main() {
  const shows = await p.show.findMany({
    select: { id: true, venue_name: true, status: true, start_time: true, end_time: true, venue_lat: true, venue_lng: true }
  })
  const now = new Date()
  console.log('NOW:', now.toISOString())
  console.log('')
  for (const s of shows) {
    const future = s.end_time > now
    const hasCoords = s.venue_lat !== null
    console.log(
      s.venue_name.padEnd(30),
      'status:', s.status.padEnd(10),
      'end:', s.end_time.toISOString(),
      'future:', future,
      'coords:', hasCoords
    )
  }
  await p.$disconnect()
}
main()

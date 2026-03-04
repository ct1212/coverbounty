/**
 * Migration script: Create User records from existing Band records.
 *
 * This script was designed to run against the transitional schema
 * (before email/password_hash were removed from Band).
 * It has already been executed and is kept for reference.
 *
 * Usage: npx tsx scripts/migrate-to-users.ts
 */
// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const bands = await prisma.band.findMany({
    where: { user_id: null },
  })

  console.log(`Found ${bands.length} bands without user_id`)

  for (const band of bands) {
    // Bands without email/password_hash can't be migrated (shouldn't exist, but guard)
    if (!band.email || !band.password_hash) {
      console.log(`Skipping band ${band.id} (${band.name}) - missing email or password`)
      continue
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: band.email },
    })

    if (existingUser) {
      // Link existing user to band
      await prisma.band.update({
        where: { id: band.id },
        data: { user_id: existingUser.id },
      })
      console.log(`Linked band ${band.name} to existing user ${existingUser.id}`)
      continue
    }

    // Create user from band data
    const user = await prisma.user.create({
      data: {
        email: band.email,
        password_hash: band.password_hash,
        name: band.name,
      },
    })

    await prisma.band.update({
      where: { id: band.id },
      data: { user_id: user.id },
    })

    console.log(`Created user ${user.id} for band ${band.name} (${band.email})`)
  }

  // Migrate contributions: link fan-based contributions to users where possible
  const fansWithEmail = await prisma.fan.findMany({
    where: { email: { not: null } },
  })

  for (const fan of fansWithEmail) {
    if (!fan.email) continue
    const user = await prisma.user.findUnique({ where: { email: fan.email } })
    if (user) {
      await prisma.contribution.updateMany({
        where: { fan_id: fan.id, user_id: null },
        data: { user_id: user.id },
      })
      console.log(`Linked contributions from fan ${fan.email} to user ${user.id}`)
    }
  }

  console.log('Migration complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

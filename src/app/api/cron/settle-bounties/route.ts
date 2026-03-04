import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

// Auto-settle bounties past their settlement deadline
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find bounties past settlement deadline
    const expiredBounties = await prisma.bounty.findMany({
      where: {
        status: 'settling',
        settlement_deadline: { lte: now },
      },
      include: {
        show: { include: { band: true } },
        contributions: { where: { status: 'authorized' } },
      },
    })

    if (expiredBounties.length === 0) {
      return NextResponse.json({ data: { settled: 0 } })
    }

    const useMock =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder'

    const results = []

    for (const bounty of expiredBounties) {
      try {
        const contributions = bounty.contributions

        // Count votes
        const refundVotes = contributions.filter(
          (c) => c.fan_vote === 'no' || c.fan_vote === 'left_early',
        ).length
        const captureVotes = contributions.filter(
          (c) => c.fan_vote === 'yes' || c.fan_vote === 'no_response',
        ).length

        const shouldRefund = contributions.length > 0 && refundVotes > captureVotes

        if (shouldRefund) {
          // Void all
          for (const c of contributions) {
            try {
              if (!useMock && !c.stripe_payment_intent_id.startsWith('pi_mock_')) {
                await stripe.paymentIntents.cancel(c.stripe_payment_intent_id)
              }
              await prisma.contribution.update({
                where: { id: c.id },
                data: { status: 'refunded' },
              })
            } catch {
              // Per-contribution error handling: continue with others
            }
          }

          await prisma.bounty.update({
            where: { id: bounty.id },
            data: { status: 'refunded' },
          })

          results.push({ bounty_id: bounty.id, action: 'refunded' })
        } else {
          // Capture all
          const totalAmount = contributions.reduce((s, c) => s + c.amount, 0)
          const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT)
          const bandConnectId = bounty.show.band.stripe_connect_id

          for (const c of contributions) {
            try {
              if (!useMock && !c.stripe_payment_intent_id.startsWith('pi_mock_')) {
                await stripe.paymentIntents.capture(c.stripe_payment_intent_id)
              }
              await prisma.contribution.update({
                where: { id: c.id },
                data: { status: 'captured' },
              })
            } catch {
              // Per-contribution error handling
            }
          }

          // Transfer to band
          if (!useMock && bandConnectId && totalAmount > 0) {
            try {
              await stripe.transfers.create({
                amount: totalAmount - platformFee,
                currency: 'usd',
                destination: bandConnectId,
                metadata: { bounty_id: bounty.id },
              })
            } catch {
              // Transfer failed but captures succeeded
            }
          }

          await prisma.bounty.update({
            where: { id: bounty.id },
            data: { status: 'completed' },
          })

          await prisma.band.update({
            where: { id: bounty.show.band_id },
            data: {
              total_bounties_fulfilled: { increment: 1 },
              total_earned: { increment: totalAmount - platformFee },
            },
          })

          results.push({ bounty_id: bounty.id, action: 'captured' })
        }

        // Check if all bounties for this show are settled
        const remainingSettling = await prisma.bounty.count({
          where: { show_id: bounty.show_id, status: 'settling' },
        })
        if (remainingSettling === 0) {
          await prisma.show.update({
            where: { id: bounty.show_id },
            data: { status: 'ended' },
          })
        }
      } catch {
        results.push({ bounty_id: bounty.id, action: 'error' })
      }
    }

    return NextResponse.json({ data: { settled: results.length, results } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}

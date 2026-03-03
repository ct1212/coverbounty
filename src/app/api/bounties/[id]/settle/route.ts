import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { PLATFORM_FEE_PERCENT } from '@/lib/stripe'
import { emitToShow } from '@/lib/socket'

// Settle a bounty: capture or void based on fan vote majority
// Called after the 2-hour settlement window closes (by cron or manually)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: { show: { include: { band: true } }, song: true },
    })

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'settling') {
      return NextResponse.json(
        { error: `Cannot settle bounty with status: ${bounty.status}` },
        { status: 400 },
      )
    }

    const contributions = await prisma.contribution.findMany({
      where: { bounty_id: id, status: 'authorized' },
    })

    // Count votes: no + left_early are refund votes; yes + no_response are capture votes
    const refundVotes = contributions.filter(
      (c) => c.fan_vote === 'no' || c.fan_vote === 'left_early',
    ).length
    const captureVotes = contributions.filter(
      (c) => c.fan_vote === 'yes' || c.fan_vote === 'no_response',
    ).length

    const shouldRefund = contributions.length > 0 && refundVotes > captureVotes

    const useMock =
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder'

    if (shouldRefund) {
      // Void all authorized PaymentIntents
      await Promise.all(
        contributions.map(async (contribution) => {
          if (!useMock && !contribution.stripe_payment_intent_id.startsWith('pi_mock_')) {
            await stripe.paymentIntents.cancel(contribution.stripe_payment_intent_id)
          }
          await prisma.contribution.update({
            where: { id: contribution.id },
            data: { status: 'refunded' },
          })
        }),
      )

      const settled = await prisma.bounty.update({
        where: { id },
        data: { status: 'refunded' },
        include: { song: true },
      })

      emitToShow(bounty.show_id, 'bounty:updated', settled)
      return NextResponse.json({ data: settled, action: 'refunded' })
    } else {
      // Capture all authorized PaymentIntents
      const bandConnectId = bounty.show.band.stripe_connect_id
      const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0)
      const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT)

      await Promise.all(
        contributions.map(async (contribution) => {
          if (!useMock && !contribution.stripe_payment_intent_id.startsWith('pi_mock_')) {
            await stripe.paymentIntents.capture(contribution.stripe_payment_intent_id)
          }
          await prisma.contribution.update({
            where: { id: contribution.id },
            data: { status: 'captured' },
          })
        }),
      )

      // Transfer to band's Stripe Connect account (85% of total)
      if (!useMock && bandConnectId && totalAmount > 0) {
        await stripe.transfers.create({
          amount: totalAmount - platformFee,
          currency: 'usd',
          destination: bandConnectId,
          metadata: { bounty_id: id },
        })
      }

      const settled = await prisma.bounty.update({
        where: { id },
        data: { status: 'completed' },
        include: { song: true },
      })

      // Update band stats
      await prisma.band.update({
        where: { id: bounty.show.band_id },
        data: {
          total_bounties_fulfilled: { increment: 1 },
          total_earned: { increment: totalAmount - platformFee },
        },
      })

      emitToShow(bounty.show_id, 'bounty:updated', settled)
      return NextResponse.json({ data: settled, action: 'captured' })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

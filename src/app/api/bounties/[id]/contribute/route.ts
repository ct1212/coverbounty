import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { emitToShow } from '@/lib/socket'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, tip_amount, fan_email, fan_id } = body

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'amount is required and must be at least 100 cents ($1.00)' },
        { status: 400 },
      )
    }

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: { show: true, song: true },
    })

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'open') {
      return NextResponse.json(
        { error: `Cannot contribute to a bounty with status: ${bounty.status}` },
        { status: 400 },
      )
    }

    const totalCharge = amount + (tip_amount ?? 0)
    let stripePaymentIntentId: string

    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
      // Create a real PaymentIntent with manual capture (authorization hold)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCharge,
        currency: 'usd',
        capture_method: 'manual',
        metadata: {
          bounty_id: id,
          show_id: bounty.show_id,
          song_title: bounty.song.title,
        },
        ...(fan_email ? { receipt_email: fan_email } : {}),
      })
      stripePaymentIntentId = paymentIntent.id
    } else {
      // Mock PaymentIntent for development
      stripePaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }

    // Resolve or create fan record
    let resolvedFanId = fan_id ?? null
    if (!resolvedFanId && fan_email) {
      const fan = await prisma.fan.upsert({
        where: { id: fan_id ?? '' },
        update: {},
        create: { email: fan_email },
      })
      resolvedFanId = fan.id
    }

    const [contribution] = await prisma.$transaction([
      prisma.contribution.create({
        data: {
          bounty_id: id,
          fan_id: resolvedFanId,
          amount,
          tip_amount: tip_amount ?? 0,
          stripe_payment_intent_id: stripePaymentIntentId,
          status: 'authorized',
        },
      }),
      prisma.bounty.update({
        where: { id },
        data: {
          total_amount: { increment: amount },
          backer_count: { increment: 1 },
        },
      }),
    ])

    const updatedBounty = await prisma.bounty.findUnique({
      where: { id },
      include: { song: true },
    })

    emitToShow(bounty.show_id, 'contribution:added', {
      bounty: updatedBounty,
      contribution,
    })
    emitToShow(bounty.show_id, 'bounty:updated', updatedBounty)

    return NextResponse.json({ data: { contribution, bounty: updatedBounty } }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

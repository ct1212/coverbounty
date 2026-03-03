import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bounty_id, amount, tip_amount, fan_email } = body

    if (!bounty_id || !amount || amount < 100) {
      return NextResponse.json(
        { error: 'bounty_id and amount (min 100 cents) are required' },
        { status: 400 },
      )
    }

    const bounty = await prisma.bounty.findUnique({
      where: { id: bounty_id },
      include: { song: true, show: { include: { band: true } } },
    })

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'open') {
      return NextResponse.json(
        { error: `Bounty is not accepting contributions (status: ${bounty.status})` },
        { status: 400 },
      )
    }

    const totalCharge = amount + (tip_amount ?? 0)
    const useMock =
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder'

    if (useMock) {
      // Return a mock client secret for development
      const mockId = `pi_mock_${Date.now()}`
      return NextResponse.json({
        data: {
          client_secret: `${mockId}_secret_mock`,
          payment_intent_id: mockId,
          mock: true,
        },
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCharge,
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        bounty_id,
        show_id: bounty.show_id,
        song_title: bounty.song.title,
        band_name: bounty.show.band.name,
      },
      ...(fan_email ? { receipt_email: fan_email } : {}),
    })

    return NextResponse.json({
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

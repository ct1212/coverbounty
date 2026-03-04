import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emitToShow } from '@/lib/socket'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, tip_amount, fan_email, payment_intent_id } = body

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

    // Resolve payment intent ID
    const stripePaymentIntentId =
      payment_intent_id ??
      `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // Idempotency: check if this PI was already recorded
    if (payment_intent_id) {
      const existing = await prisma.contribution.findFirst({
        where: { stripe_payment_intent_id: payment_intent_id },
      })
      if (existing) {
        const existingBounty = await prisma.bounty.findUnique({
          where: { id },
          include: { song: true },
        })
        return NextResponse.json(
          { data: { contribution: existing, bounty: existingBounty } },
          { status: 200 },
        )
      }
    }

    // Resolve fan: by session cookie token or email
    let resolvedFanId: string | null = null

    // Check fan session cookie
    const fanSessionToken = request.cookies.get('cb_fan_session')?.value
    if (fanSessionToken) {
      const fan = await prisma.fan.findUnique({
        where: { fan_session_token: fanSessionToken },
      })
      if (fan) resolvedFanId = fan.id
    }

    // Fallback: create fan from email
    if (!resolvedFanId && fan_email) {
      const fan = await prisma.fan.upsert({
        where: { fan_session_token: fan_email },
        update: {},
        create: { email: fan_email, fan_session_token: fan_email },
      })
      resolvedFanId = fan.id
    }

    // If still no fan, create anonymous
    if (!resolvedFanId) {
      const newToken = crypto.randomUUID()
      const fan = await prisma.fan.create({
        data: { fan_session_token: newToken },
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

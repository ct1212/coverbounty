import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const band = await prisma.band.findUnique({
      where: { id: session.user.id },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    // Return existing account if one exists
    if (band.stripe_connect_id) {
      return NextResponse.json({
        data: { account_id: band.stripe_connect_id },
      })
    }

    const useMock =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder'

    if (useMock) {
      const mockId = `acct_mock_${Date.now()}`
      await prisma.band.update({
        where: { id: band.id },
        data: { stripe_connect_id: mockId },
      })
      return NextResponse.json({ data: { account_id: mockId, mock: true } })
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: band.email,
      metadata: { band_id: band.id },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    await prisma.band.update({
      where: { id: band.id },
      data: { stripe_connect_id: account.id },
    })

    return NextResponse.json({
      data: { account_id: account.id },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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

    if (!band?.stripe_connect_id) {
      return NextResponse.json(
        { error: 'No Stripe Connect account. Create one first.' },
        { status: 400 },
      )
    }

    if (band.stripe_connect_id.startsWith('acct_mock_')) {
      return NextResponse.json({
        data: {
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/band?stripe_mock=true`,
          mock: true,
        },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const accountLink = await stripe.accountLinks.create({
      account: band.stripe_connect_id,
      refresh_url: `${baseUrl}/band?stripe_refresh=true`,
      return_url: `${baseUrl}/band?stripe_connected=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ data: { url: accountLink.url } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

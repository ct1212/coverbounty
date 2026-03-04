import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      // Mark contribution as refunded
      await prisma.contribution.updateMany({
        where: { stripe_payment_intent_id: pi.id },
        data: { status: 'refunded' },
      })
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await prisma.contribution.updateMany({
        where: { stripe_payment_intent_id: pi.id },
        data: { status: 'refunded' },
      })
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await prisma.contribution.updateMany({
        where: { stripe_payment_intent_id: pi.id },
        data: { status: 'captured' },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}

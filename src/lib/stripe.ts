import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2024-12-18.acacia' as any,
})

export const PLATFORM_FEE_PERCENT = 0.15

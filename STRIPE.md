# Stripe Connect Integration

## Band Onboarding Flow

1. Band signs up → creates Stripe Connect Express account
2. Stripe onboarding link sent to band
3. Band completes onboarding (bank account, tax info)
4. Band can now receive payouts

## Payment Flow

### Fan Contribution
1. Fan clicks "Back This" on a bounty
2. Create PaymentIntent with capture_method: 'manual' (authorization hold)
3. Fan pays via Apple Pay / Google Pay / card
4. PaymentIntent status: 'requires_capture'
5. Store payment_intent_id on contribution record

### Bounty Settlement

**If band plays the song:**
1. Band taps "Played" on dashboard
2. Bounty status → 'settling'
3. 2-hour fan confirmation window opens
4. If majority confirm (or no response) → capture all PaymentIntents
5. Bounty status → 'completed'
6. Create transfer to band's Connect account (85% of total)
7. Platform keeps 15%

**If band doesn't play:**
1. Show ends + 30 min grace period
2. Bounty status → 'settling'
3. 2-hour fan confirmation window
4. If majority say "No" → void all PaymentIntents (full refund)
5. Bounty status → 'refunded'

## API Keys Required

- STRIPE_PUBLISHABLE_KEY (client-side)
- STRIPE_SECRET_KEY (server-side)
- STRIPE_WEBHOOK_SECRET (for Connect webhooks)

## Webhook Events to Handle

- account.updated (band onboarding status)
- payment_intent.succeeded
- payment_intent.payment_failed
- transfer.failed

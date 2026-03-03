# CoverBounty

Real-time crowdfunding for live music setlists. Fans pool money to request songs. Bands see ranked bounties and get paid when they play them.

## Core Concept

1. Fan scans QR code at venue
2. Creates or backs a bounty for a specific song
3. Bounty climbs as other fans pile on
4. Band sees ranked bounty board
5. Band plays the song → taps "Played"
6. Payout triggers to band's account

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Socket.io (real-time updates)
- Stripe Connect (payments)
- PostgreSQL + Redis
- Vercel

## Project Structure

```
/src
  /app
    /band          # Band dashboard
    /show/[id]     # Fan-facing bounty board
    /api           # API routes
  /components
    /bounty        # Bounty board components
    /payment       # Stripe payment components
  /lib
    /db            # Database utilities
    /stripe        # Stripe configuration
```

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

See `.env.example`

---
*The Department of Quietly Getting Things Done*

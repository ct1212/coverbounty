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

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### 3. Set up services

**PostgreSQL:**
```bash
# Using Docker:
docker run -d --name coverbounty-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=coverbounty_dev \
  -p 5432:5432 postgres:16

# Or use Supabase / Neon for a hosted option
```

**Redis:**
```bash
# Using Docker:
docker run -d --name coverbounty-redis -p 6379:6379 redis:7

# Or use Upstash for a hosted option
```

**Stripe:**
```bash
# Install Stripe CLI:
brew install stripe/stripe-cli/stripe

# Login:
stripe login

# Forward webhooks to local server:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret (whsec_...) to .env.local
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

### First-time setup

1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Set environment variables in [Vercel Dashboard](https://vercel.com/dashboard) or via CLI:

```bash
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel env add SOCKET_IO_URL
vercel env add JWT_SECRET
```

### Deploy

```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy
```

### Database setup

After deploying, run migrations against your production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-db-url"

# Run migrations (when migration tooling is set up)
# npx prisma migrate deploy
# or
# npm run db:migrate
```

### Stripe webhook setup

1. In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add endpoint:
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `transfer.failed`
2. Copy the webhook signing secret to your Vercel env vars

### Socket.io

For real-time updates, Socket.io needs a persistent server connection. Options:

- **Vercel + separate Socket.io server** (recommended): Deploy a Node.js server on Railway/Fly.io, set `SOCKET_IO_URL` to that server's URL
- **Single server**: Run on a VPS where long-lived connections are supported

## Environment Variables

See [`.env.example`](.env.example) for a full list with documentation.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe public key (client-side) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the app |
| `SOCKET_IO_URL` | Yes | Socket.io server URL |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run deploy` | Deploy to Vercel production |
| `npm run deploy:preview` | Deploy preview to Vercel |

---
*The Department of Quietly Getting Things Done*

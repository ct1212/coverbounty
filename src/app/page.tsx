import { Music, QrCode, DollarSign, Zap, ArrowRight, Guitar } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { NearbyShows } from '@/components/NearbyShows'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      {/* Hero */}
      <section className="px-4 pb-8 pt-12 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            <Zap size={14} />
            Request songs. Fund the encore.
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Request songs at live shows.
            <br />
            <span className="text-emerald-400">Back them with real money.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-lg text-base text-zinc-400 sm:text-lg">
            CoverBounty lets fans crowdfund the setlist. Pool money behind the
            songs you want to hear. Bands see the ranked requests and get paid
            when they play them.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/shows"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 active:opacity-70 sm:w-auto"
            >
              Find Shows Near You
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/show/demo"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-6 py-3.5 text-base font-semibold text-zinc-300 transition-opacity hover:opacity-90 active:opacity-70 sm:w-auto"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby Shows */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Upcoming shows
          </h2>
          <NearbyShows layout="carousel" />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              icon={<QrCode size={24} className="text-emerald-400" />}
              title="Find a show"
              desc="Scan a QR code at the venue or browse shows nearby. Instantly open the live bounty board."
            />
            <Step
              icon={<DollarSign size={24} className="text-emerald-400" />}
              title="Back a song"
              desc="Pick a song and put money behind it. Watch the bounty climb as other fans pile on."
            />
            <Step
              icon={<Music size={24} className="text-emerald-400" />}
              title="Band plays, you win"
              desc="The band sees ranked requests. They play the song, tap Played, and collect the bounty."
            />
          </div>
        </div>
      </section>

      {/* For Bands */}
      <section className="border-t border-zinc-800 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
            <Guitar size={24} className="text-emerald-400" />
          </div>
          <h2 className="mb-3 text-xl font-bold text-white sm:text-2xl">
            Earn more from every gig
          </h2>
          <p className="mb-6 text-zinc-400">
            Fans tell you what they want to hear, and pay for it. Set up your
            band account in 2 minutes, create a show, and start collecting
            bounties.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-6 py-3 text-base font-semibold text-zinc-300 transition-opacity hover:opacity-90 active:opacity-70"
          >
            Create Band Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="text-xs text-zinc-600">
            CoverBounty &middot; The Department of Quietly Getting Things Done
          </span>
          <div className="flex gap-4 text-xs text-zinc-600">
            <Link href="/shows" className="hover:text-zinc-400">
              Find Shows
            </Link>
            <Link href="/login" className="hover:text-zinc-400">
              Sign In
            </Link>
            <Link href="/show/demo" className="hover:text-zinc-400">
              Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Step({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400">{desc}</p>
    </div>
  )
}

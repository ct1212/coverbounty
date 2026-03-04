import { Header } from '@/components/Header'
import { NearbyShows } from '@/components/NearbyShows'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Shows — CoverBounty',
  description:
    'Discover live shows near you. Request songs, back bounties, and help shape the setlist.',
}

export default function ShowsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
          Find Shows
        </h1>
        <p className="mb-8 text-sm text-zinc-400">
          Discover live and upcoming shows. Request songs and back bounties.
        </p>

        <NearbyShows layout="grid" />
      </main>
    </div>
  )
}

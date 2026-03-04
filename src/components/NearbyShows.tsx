'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Music, Users, DollarSign, Loader2, MapPinOff } from 'lucide-react'

interface NearbyShow {
  id: string
  bandName: string
  venueName: string
  venueAddress: string
  startTime: string
  endTime: string
  status: string
  distance: number
  bountyCount: number
  totalPool: number
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

function ShowCard({ show }: { show: NearbyShow }) {
  const isLive = show.status === 'live'

  return (
    <Link
      href={`/show/${show.id}`}
      className="block rounded-2xl bg-zinc-900 p-4 transition-colors hover:bg-zinc-800 active:bg-zinc-800"
    >
      <div className="mb-2 flex items-center justify-between">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live Now
          </span>
        ) : (
          <span className="text-xs font-semibold text-zinc-500">
            {formatDate(show.startTime)}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin size={11} />
          {show.distance < 1
            ? `${Math.round(show.distance * 1000)}m`
            : `${show.distance}km`}
        </span>
      </div>

      <h3 className="truncate text-base font-bold text-white">{show.bandName}</h3>
      <p className="mt-0.5 truncate text-sm text-zinc-400">{show.venueName}</p>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Music size={12} className="text-zinc-600" />
          {show.bountyCount} {show.bountyCount === 1 ? 'request' : 'requests'}
        </span>
        {show.totalPool > 0 && (
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <DollarSign size={12} />
            {formatDollars(show.totalPool)} pool
          </span>
        )}
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-zinc-900 p-4">
      <div className="mb-2 flex justify-between">
        <div className="h-3 w-16 rounded bg-zinc-800" />
        <div className="h-3 w-12 rounded bg-zinc-800" />
      </div>
      <div className="h-5 w-3/4 rounded bg-zinc-800" />
      <div className="mt-2 h-4 w-1/2 rounded bg-zinc-800" />
      <div className="mt-3 h-3 w-1/3 rounded bg-zinc-800" />
    </div>
  )
}

export function NearbyShows({ layout = 'carousel' }: { layout?: 'carousel' | 'grid' }) {
  const [shows, setShows] = useState<NearbyShow[]>([])
  const [allShows, setAllShows] = useState<NearbyShow[]>([])
  const [loading, setLoading] = useState(true)
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => {
    // Fetch all upcoming shows as fallback
    fetch('/api/shows?status=live')
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          const mapped = data.data.map((s: { id: string; band?: { name: string }; venue_name: string; venue_address: string; start_time: string; end_time: string; status: string; _count?: { bounties: number } }) => ({
            id: s.id,
            bandName: s.band?.name ?? 'Unknown',
            venueName: s.venue_name,
            venueAddress: s.venue_address,
            startTime: s.start_time,
            endTime: s.end_time,
            status: s.status,
            distance: 0,
            bountyCount: s._count?.bounties ?? 0,
            totalPool: 0,
          }))
          setAllShows(mapped)
        }
      })
      .catch(() => {})

    if (!navigator.geolocation) {
      setLocationDenied(true)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/shows/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=50`,
          )
          if (res.ok) {
            const data = await res.json()
            setShows(data.data ?? [])
          }
        } catch {
          // silent
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLocationDenied(true)
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }, [])

  const displayShows = shows.length > 0 ? shows : allShows

  if (loading) {
    return (
      <div className={layout === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'flex gap-3 overflow-x-auto pb-2'}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={layout === 'carousel' ? 'w-72 shrink-0' : ''}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    )
  }

  if (displayShows.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-900 px-6 py-10 text-center">
        <MapPinOff size={32} className="mx-auto mb-3 text-zinc-700" />
        <p className="font-medium text-zinc-400">
          {locationDenied ? 'Location access needed to find nearby shows' : 'No shows nearby right now'}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          <Link href="/show/demo" className="text-emerald-400 hover:underline">
            Try the demo
          </Link>{' '}
          to see how it works
        </p>
      </div>
    )
  }

  if (layout === 'grid') {
    return (
      <div className="space-y-4">
        {shows.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Near You
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </div>
        )}
        {allShows.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {shows.length > 0 ? 'All Upcoming Shows' : 'Upcoming Shows'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Carousel layout
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
      {displayShows.map((show) => (
        <div key={show.id} className="w-72 shrink-0">
          <ShowCard show={show} />
        </div>
      ))}
    </div>
  )
}

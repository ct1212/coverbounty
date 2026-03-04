import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus, MapPin, Calendar, DollarSign, Music } from 'lucide-react'
import { ImportShows } from '@/components/ImportShows'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

const STATUS_BADGE: Record<string, string> = {
  live: 'bg-emerald-500/20 text-emerald-400',
  created: 'bg-blue-500/20 text-blue-400',
  synced: 'bg-blue-500/20 text-blue-400',
  settling: 'bg-amber-500/20 text-amber-400',
  ended: 'bg-zinc-700/50 text-zinc-400',
}

export default async function BandDashboard() {
  const session = await auth()
  if (!session?.user) return null

  const bandId = session.user.id

  const [band, shows] = await Promise.all([
    prisma.band.findUnique({ where: { id: bandId } }),
    prisma.show.findMany({
      where: { band_id: bandId },
      include: { _count: { select: { bounties: true } } },
      orderBy: { start_time: 'desc' },
    }),
  ])

  if (!band) return null

  const liveShows = shows.filter((s) => s.status === 'live')
  const upcomingShows = shows.filter((s) =>
    ['created', 'synced'].includes(s.status),
  )
  const pastShows = shows.filter((s) =>
    ['settling', 'ended'].includes(s.status),
  )

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Earned
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {formatDollars(band.total_earned)}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Bounties Played
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {band.total_bounties_fulfilled}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Shows
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{shows.length}</p>
        </div>
      </div>

      {/* Create Show / Import */}
      <div className="space-y-3">
        <Link
          href="/band/show/new"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 py-4 text-sm font-semibold text-zinc-400 transition-colors hover:border-emerald-500 hover:text-emerald-400"
        >
          <Plus size={18} />
          Create New Show
        </Link>
        <ImportShows bandId={bandId} />
      </div>

      {/* Live Shows */}
      {liveShows.length > 0 && (
        <ShowSection title="Live Now" shows={liveShows} />
      )}

      {/* Upcoming Shows */}
      {upcomingShows.length > 0 && (
        <ShowSection title="Upcoming" shows={upcomingShows} />
      )}

      {/* Past Shows */}
      {pastShows.length > 0 && (
        <ShowSection title="Past" shows={pastShows} />
      )}

      {shows.length === 0 && (
        <div className="py-12 text-center">
          <Music size={40} className="mx-auto mb-3 text-zinc-700" />
          <p className="font-medium text-zinc-500">No shows yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            Create your first show to start collecting bounties
          </p>
        </div>
      )}
    </div>
  )
}

function ShowSection({
  title,
  shows,
}: {
  title: string
  shows: Array<{
    id: string
    venue_name: string
    venue_address: string
    start_time: Date
    status: string
    _count: { bounties: number }
  }>
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h2>
      <div className="space-y-2">
        {shows.map((show) => (
          <Link
            key={show.id}
            href={
              show.status === 'live'
                ? `/band/show/${show.id}/live`
                : `/band/show/${show.id}`
            }
            className="flex items-center gap-4 rounded-xl bg-zinc-900 p-4 transition-colors hover:bg-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-white">
                  {show.venue_name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${STATUS_BADGE[show.status] ?? STATUS_BADGE.ended}`}
                >
                  {show.status}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(show.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {show.venue_address.split(',')[0]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <DollarSign size={14} />
              {show._count.bounties} bounties
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

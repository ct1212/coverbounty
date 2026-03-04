import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, QrCode, Zap, ExternalLink, DollarSign } from 'lucide-react'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

export default async function ShowDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.bandId) redirect('/shows')

  const { id } = await params

  const show = await prisma.show.findUnique({
    where: { id, band_id: session.user.bandId },
    include: {
      bounties: {
        include: { song: true },
        orderBy: { total_amount: 'desc' },
      },
    },
  })

  if (!show) notFound()

  const totalEarnings = show.bounties
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{show.venue_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {show.venue_address}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(show.start_time)}
            </span>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
            show.status === 'live'
              ? 'bg-emerald-500/20 text-emerald-400'
              : show.status === 'settling'
                ? 'bg-amber-500/20 text-amber-400'
                : show.status === 'ended'
                  ? 'bg-zinc-700/50 text-zinc-400'
                  : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {show.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {['created', 'synced'].includes(show.status) && (
          <GoLiveButton showId={show.id} />
        )}
        {show.status === 'live' && (
          <Link
            href={`/band/show/${show.id}/live`}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Zap size={16} />
            Open Live Dashboard
          </Link>
        )}
        <Link
          href={`/band/show/${show.id}/qr`}
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700"
        >
          <QrCode size={16} />
          QR Code
        </Link>
        {show.share_url && (
          <Link
            href={`/show/${show.id}`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700"
          >
            <ExternalLink size={16} />
            Fan View
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Bounties
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {show.bounties.length}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Pool
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-400">
            {formatDollars(
              show.bounties.reduce((s, b) => s + b.total_amount, 0),
            )}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Earned
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-400">
            {formatDollars(totalEarnings)}
          </p>
        </div>
      </div>

      {/* Bounty list */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Song Requests
        </h2>
        {show.bounties.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">
            No song requests yet. Share the QR code to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {show.bounties.map((bounty) => (
              <div
                key={bounty.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-900 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {bounty.song.title}
                  </p>
                  <p className="truncate text-sm text-zinc-500">
                    {bounty.song.artist}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <DollarSign size={14} className="text-emerald-400" />
                  <span className="font-bold text-emerald-400">
                    {formatDollars(bounty.total_amount)}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    bounty.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : bounty.status === 'settling'
                        ? 'bg-amber-500/20 text-amber-400'
                        : bounty.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  {bounty.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GoLiveButton({ showId }: { showId: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { auth: getAuth } = await import('@/lib/auth')
        const session = await getAuth()
        if (!session?.user) return

        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/shows/${showId}/go-live`,
          { method: 'POST' },
        )

        const { redirect: rdr } = await import('next/navigation')
        rdr(`/band/show/${showId}/live`)
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
      >
        <Zap size={16} />
        Go Live
      </button>
    </form>
  )
}

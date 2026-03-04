import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { User, Music, DollarSign, ArrowRight, LogOut } from 'lucide-react'

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      band: { select: { id: true, name: true } },
      contributions: {
        include: {
          bounty: {
            include: {
              song: true,
              show: { select: { venue_name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      },
    },
  })

  if (!user) redirect('/login')

  const totalSpent = user.contributions.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Profile */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
            <User size={28} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Contributions
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {user.contributions.length}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Backed
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {formatDollars(totalSpent)}
            </p>
          </div>
        </div>

        {/* Band CTA */}
        {!user.band && (
          <Link
            href="/register?band=true"
            className="mb-8 flex items-center justify-between rounded-xl bg-zinc-900 p-4 transition-colors hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              <Music size={20} className="text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Are you in a band?</p>
                <p className="text-sm text-zinc-500">Create a band profile to start collecting bounties</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-500" />
          </Link>
        )}

        {user.band && (
          <Link
            href="/band"
            className="mb-8 flex items-center justify-between rounded-xl bg-zinc-900 p-4 transition-colors hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              <Music size={20} className="text-emerald-400" />
              <div>
                <p className="font-semibold text-white">{user.band.name}</p>
                <p className="text-sm text-zinc-500">Go to band dashboard</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-500" />
          </Link>
        )}

        {/* Contribution history */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Recent Contributions
          </h2>
          {user.contributions.length === 0 ? (
            <div className="rounded-xl bg-zinc-900 py-8 text-center">
              <DollarSign size={32} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-sm text-zinc-500">
                Back a song at a live show to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {user.contributions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-zinc-900 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {c.bounty.song.title}
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                      {c.bounty.song.artist} &middot; {c.bounty.show.venue_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">
                      {formatDollars(c.amount)}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {formatDate(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <form
          className="mt-8"
          action={async () => {
            'use server'
            const { signOut } = await import('@/lib/auth')
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </form>
      </main>
    </div>
  )
}

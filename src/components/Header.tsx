import Link from 'next/link'
import { Music, Search, User, LayoutDashboard } from 'lucide-react'
import { auth } from '@/lib/auth'

export async function Header() {
  const session = await auth()

  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
            <Music size={16} className="text-emerald-400" />
          </div>
          <span className="text-lg font-bold text-white">CoverBounty</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/shows"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <Search size={15} />
            <span>Find Shows</span>
          </Link>

          {session?.user ? (
            <>
              {session.user.bandId && (
                <Link
                  href="/band"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  <LayoutDashboard size={15} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
              <Link
                href="/account"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                <User size={15} />
                <span className="hidden sm:inline">{session.user.name ?? 'Account'}</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              <User size={15} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

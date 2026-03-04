import Link from 'next/link'
import { Music, Search, User } from 'lucide-react'

export function Header() {
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
          <Link
            href="/band/login"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <User size={15} />
            <span className="hidden sm:inline">Band Login</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

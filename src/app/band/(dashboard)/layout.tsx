import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Music, LayoutDashboard, LogOut } from 'lucide-react'

export default async function BandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!session.user.bandId) {
    redirect('/shows')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/band" className="flex items-center gap-2">
            <Music size={20} className="text-emerald-400" />
            <span className="font-bold">CoverBounty</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/band"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <span className="hidden text-sm text-zinc-500 sm:inline">{session.user.name}</span>
            <form
              action={async () => {
                'use server'
                const { signOut } = await import('@/lib/auth')
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button
                type="submit"
                className="flex items-center justify-center gap-1 p-2 text-sm text-zinc-500 hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}

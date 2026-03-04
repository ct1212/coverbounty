import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export default async function QRPage({
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
    include: { band: true },
  })

  if (!show) notFound()

  const shareUrl =
    show.share_url ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/show/${show.id}`

  return (
    <div className="flex flex-col items-center py-8">
      <Link
        href={`/band/show/${show.id}`}
        className="mb-6 flex items-center gap-1 self-start text-sm text-zinc-500 hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to show
      </Link>

      <h1 className="mb-2 text-xl font-bold text-white">Scan to Request Songs</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {show.band.name} @ {show.venue_name}
      </p>

      {/* QR Code */}
      <div className="rounded-2xl bg-white p-6">
        {show.qr_code_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={show.qr_code_url}
            alt="QR Code"
            className="h-64 w-64"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center text-zinc-400">
            QR code generating...
          </div>
        )}
      </div>

      <p className="mt-4 max-w-xs text-center text-sm text-zinc-500">
        Print this or display it at the venue. Fans scan to open the bounty board
        and request songs.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <a
          href={show.qr_code_url ?? '#'}
          download={`coverbounty-qr-${show.id}.png`}
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700"
        >
          <Download size={16} />
          Download QR
        </a>
      </div>

      <p className="mt-6 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
        Share link: <span className="text-emerald-400">{shareUrl}</span>
      </p>
    </div>
  )
}

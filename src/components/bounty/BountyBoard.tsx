'use client'

import { useState, useEffect, useCallback } from 'react'
import { Music, Users, Clock, Plus, BarChart2, Search, X } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

// Types
interface Bounty {
  id: string
  songTitle: string
  artist: string
  songId?: string
  totalAmount: number
  backerCount: number
  status: string
}

interface Show {
  id: string
  bandName: string
  venueName: string
  startTime: string
  endTime?: string
  status: 'synced' | 'created' | 'live' | 'settling' | 'ended'
  requestCutoff?: number
  requestsLockedAt?: string | null
}

interface BountyBoardProps {
  showId: string
  initialShow?: Show
  initialBounties?: Bounty[]
}

// Demo data
const DEMO_SHOW: Show = {
  id: 'demo',
  bandName: 'The Midnight',
  venueName: 'Fillmore West',
  startTime: new Date(Date.now() + 38 * 60 * 1000).toISOString(),
  status: 'live',
}

const DEMO_BOUNTIES: Bounty[] = [
  { id: '1', songTitle: 'Monsters', artist: 'The Midnight', totalAmount: 8500, backerCount: 12, status: 'open' },
  { id: '2', songTitle: 'Los Angeles', artist: 'The Midnight', totalAmount: 6200, backerCount: 8, status: 'open' },
  { id: '3', songTitle: 'Crystalline', artist: 'The Midnight', totalAmount: 4750, backerCount: 6, status: 'open' },
  { id: '4', songTitle: 'Endless Summer', artist: 'The Midnight', totalAmount: 3100, backerCount: 4, status: 'open' },
  { id: '5', songTitle: 'Sunset', artist: 'The Midnight', totalAmount: 1800, backerCount: 3, status: 'open' },
]

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

function calcCountdown(targetTime: string, status: Show['status']): string {
  if (status === 'live') return 'LIVE NOW'
  if (status === 'settling') return 'Settling'
  if (status === 'ended') return 'Show ended'

  const diff = new Date(targetTime).getTime() - Date.now()
  if (diff <= 0) return 'Starting now'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return h > 0 ? `${h}h ${m}m` : `${m}:${s.toString().padStart(2, '0')}`
}

function useCountdown(targetTime: string, status: Show['status']): string {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (status === 'live' || status === 'settling' || status === 'ended') return
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  return calcCountdown(targetTime, status)
}

// Check if requests are still allowed
function canRequest(show: Show): boolean {
  if (show.status !== 'live' && show.status !== 'created' && show.status !== 'synced') return false
  if (show.requestsLockedAt) return false
  if (show.requestCutoff && show.endTime) {
    const cutoffTime = new Date(show.endTime).getTime() - show.requestCutoff * 60 * 1000
    if (Date.now() > cutoffTime) return false
  }
  return true
}

const PRESET_AMOUNTS = [5, 10, 20, 50]

// ---------- BackModal ----------
function BackModal({
  bounty,
  showId,
  onClose,
  onContributed,
}: {
  bounty: Bounty
  showId: string
  onClose: () => void
  onContributed: () => void
}) {
  const [preset, setPreset] = useState<number>(10)
  const [custom, setCustom] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedAmount = custom ? parseFloat(custom) : preset

  const handleBack = async () => {
    if (!selectedAmount || selectedAmount < 1) return
    setSubmitting(true)
    setError('')

    try {
      // Step 1: Create payment intent
      const piRes = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bounty_id: bounty.id,
          amount: Math.round(selectedAmount * 100),
        }),
      })

      const piData = await piRes.json()
      if (!piRes.ok) {
        setError(piData.error || 'Payment failed')
        setSubmitting(false)
        return
      }

      // Step 2: Record contribution
      const contRes = await fetch(`/api/bounties/${bounty.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(selectedAmount * 100),
          payment_intent_id: piData.data.payment_intent_id,
        }),
      })

      if (!contRes.ok) {
        const contData = await contRes.json()
        setError(contData.error || 'Contribution failed')
        setSubmitting(false)
        return
      }

      onContributed()
      onClose()
    } catch {
      setError('Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-zinc-900 p-6 pb-10">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Back this bounty
        </div>
        <h2 className="mb-0.5 text-xl font-bold text-white">{bounty.songTitle}</h2>
        <p className="mb-6 text-sm text-zinc-400">{bounty.artist}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setPreset(a); setCustom('') }}
              className={`rounded-xl py-3 text-base font-semibold transition-colors ${
                !custom && preset === a
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              ${a}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="number"
            min="1"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleBack}
          disabled={submitting || !selectedAmount || selectedAmount < 1}
          className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-white transition-opacity disabled:opacity-50 active:opacity-80"
        >
          {submitting ? 'Processing...' : `Back for $${selectedAmount || '—'}`}
        </button>
      </div>
    </div>
  )
}

// ---------- RequestSongModal ----------
function RequestSongModal({
  showId,
  onClose,
  onRequested,
}: {
  showId: string
  onClose: () => void
  onRequested: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; title: string; artist: string }>>([])
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.data ?? [])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const submit = async (songId?: string, songTitle?: string, songArtist?: string) => {
    setLoading(true)
    setError('')

    try {
      const body: Record<string, string> = {}
      if (songId) {
        body.song_id = songId
      } else if (songTitle && songArtist) {
        body.song_title = songTitle
        body.song_artist = songArtist
      } else {
        if (!title.trim() || !artist.trim()) {
          setError('Song title and artist are required')
          setLoading(false)
          return
        }
        body.song_title = title
        body.song_artist = artist
      }

      const res = await fetch(`/api/shows/${showId}/bounties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        // 409 means bounty exists already, still success
        if (res.status === 409) {
          onRequested()
          onClose()
          return
        }
        setError(data.error || 'Failed to request song')
        setLoading(false)
        return
      }

      onRequested()
      onClose()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-zinc-900 p-6 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Request a Song</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Search existing songs */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search songs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 py-3 pl-10 pr-4 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {results.length > 0 && (
          <div className="mb-4 max-h-48 space-y-1 overflow-y-auto">
            {results.map((song) => (
              <button
                key={song.id}
                onClick={() => submit(song.id, song.title, song.artist)}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-zinc-800"
              >
                <Music size={14} className="shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">{song.title}</p>
                  <p className="text-xs text-zinc-500">{song.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Or add a new song
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => submit()}
              disabled={loading || !title.trim() || !artist.trim()}
              className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request Song'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- BountyCard ----------
function BountyCard({
  bounty,
  index,
  topAmount,
  onBack,
}: {
  bounty: Bounty
  index: number
  topAmount: number
  onBack: () => void
}) {
  const pct = Math.max(8, (bounty.totalAmount / topAmount) * 100)
  const isSettling = bounty.status === 'settling'
  const isDone = bounty.status === 'completed' || bounty.status === 'refunded'

  return (
    <li className="relative overflow-hidden rounded-2xl bg-zinc-900">
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ${
          isSettling
            ? 'bg-amber-500/10'
            : isDone
              ? 'bg-zinc-700/20'
              : 'bg-emerald-500/10'
        }`}
        style={{ width: `${pct}%` }}
      />

      <div className="relative flex items-center gap-3 p-4">
        <span className="w-5 shrink-0 text-center text-sm font-bold text-zinc-500">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${isDone ? 'text-zinc-500' : 'text-white'}`}>
            {bounty.songTitle}
          </p>
          <p className="flex items-center gap-1.5 truncate text-sm text-zinc-400">
            <Music size={11} />
            {bounty.artist}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span
            className={`text-lg font-bold ${
              isSettling
                ? 'text-amber-400'
                : isDone
                  ? 'text-zinc-500'
                  : 'text-emerald-400'
            }`}
          >
            {formatDollars(bounty.totalAmount)}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Users size={10} />
            {bounty.backerCount}
            {isSettling && (
              <span className="ml-1 text-amber-400">voting</span>
            )}
          </span>
        </div>

        {bounty.status === 'open' && (
          <button
            onClick={onBack}
            className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white active:opacity-70"
            aria-label={`Back ${bounty.songTitle}`}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </li>
  )
}

// ---------- Main BountyBoard ----------
export default function BountyBoard({
  showId,
  initialShow,
  initialBounties,
}: BountyBoardProps) {
  const isDemo = showId === 'demo'

  const [show, setShow] = useState<Show>(
    initialShow ?? { ...DEMO_SHOW, id: showId },
  )
  const [bounties, setBounties] = useState<Bounty[]>(
    initialBounties ?? (isDemo ? DEMO_BOUNTIES : []),
  )
  const [backTarget, setBackTarget] = useState<Bounty | null>(null)
  const [showRequest, setShowRequest] = useState(false)
  const [connected, setConnected] = useState(false)

  // Polling fallback + Socket.io
  const fetchBounties = useCallback(async () => {
    if (isDemo) return
    try {
      const res = await fetch(`/api/shows/${showId}/bounties`)
      if (res.ok) {
        const data = await res.json()
        const mapped = (data.data ?? []).map((b: { id: string; song: { title: string; artist: string; id: string }; total_amount: number; backer_count: number; status: string }) => ({
          id: b.id,
          songTitle: b.song.title,
          artist: b.song.artist,
          songId: b.song.id,
          totalAmount: b.total_amount,
          backerCount: b.backer_count,
          status: b.status,
        }))
        setBounties(mapped)
      }
    } catch {
      // silent
    }
  }, [showId, isDemo])

  useEffect(() => {
    if (isDemo) return

    // Try Socket.io first
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    let socket: Socket | null = null

    if (socketUrl) {
      socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnectionAttempts: 3,
      })

      socket.on('connect', () => {
        setConnected(true)
        socket?.emit('join:show', showId)
      })

      socket.on('bounty:updated', () => fetchBounties())
      socket.on('bounty:created', () => fetchBounties())
      socket.on('contribution:added', () => fetchBounties())
      socket.on('show:live', (data: { status: string }) => {
        setShow((prev) => ({ ...prev, status: data.status as Show['status'] }))
      })
      socket.on('show:ended', () => {
        setShow((prev) => ({ ...prev, status: 'settling' }))
      })

      socket.on('disconnect', () => setConnected(false))
      socket.on('connect_error', () => {
        // Fall through to polling
      })
    }

    // Polling fallback: 5s interval
    const interval = setInterval(fetchBounties, 5000)

    return () => {
      clearInterval(interval)
      socket?.disconnect()
    }
  }, [showId, isDemo, fetchBounties])

  const countdown = useCountdown(show.startTime, show.status)
  const isLive = show.status === 'live'
  const sortedBounties = [...bounties].sort((a, b) => b.totalAmount - a.totalAmount)
  const topAmount = sortedBounties[0]?.totalAmount ?? 1
  const requestsOpen = canRequest(show)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Sticky show header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-4 pt-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between pb-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {show.status}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
              <Clock size={14} className="text-zinc-500" />
              {countdown}
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-white">
            {show.bandName}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">{show.venueName}</p>
        </div>
      </div>

      {/* Bounty list */}
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 size={14} className="text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Song Requests
          </span>
          {connected && (
            <span className="ml-auto text-xs font-semibold text-emerald-500">
              ● Live
            </span>
          )}
        </div>

        <ul className="space-y-3">
          {sortedBounties.map((bounty, index) => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              index={index}
              topAmount={topAmount}
              onBack={() => setBackTarget(bounty)}
            />
          ))}
        </ul>

        {sortedBounties.length === 0 && (
          <div className="py-16 text-center text-zinc-600">
            <Music size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bounties yet.</p>
            <p className="mt-1 text-sm">Be the first to request a song!</p>
          </div>
        )}

        {/* Request Song FAB */}
        {requestsOpen && (
          <button
            onClick={() => setShowRequest(true)}
            className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 active:opacity-80"
            aria-label="Request a song"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Modals */}
      {backTarget && (
        <BackModal
          bounty={backTarget}
          showId={showId}
          onClose={() => setBackTarget(null)}
          onContributed={fetchBounties}
        />
      )}

      {showRequest && (
        <RequestSongModal
          showId={showId}
          onClose={() => setShowRequest(false)}
          onRequested={fetchBounties}
        />
      )}
    </div>
  )
}

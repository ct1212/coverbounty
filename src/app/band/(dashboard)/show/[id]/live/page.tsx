'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Music,
  CheckCircle,
  DollarSign,
  Users,
  Clock,
  StopCircle,
} from 'lucide-react'

interface Song {
  id: string
  title: string
  artist: string
}

interface Bounty {
  id: string
  song: Song
  status: string
  total_amount: number
  backer_count: number
}

interface Show {
  id: string
  venue_name: string
  status: string
  start_time: string
  end_time: string
  band: { id: string; name: string }
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

export default function LiveDashboard() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [show, setShow] = useState<Show | null>(null)
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [showRes, bountyRes] = await Promise.all([
        fetch(`/api/shows?band_id=_self&status=live`),
        fetch(`/api/shows/${id}/bounties`),
      ])

      if (showRes.ok) {
        const showData = await showRes.json()
        const found = showData.data?.find(
          (s: Show) => s.id === id,
        )
        if (found) setShow(found)
      }

      if (bountyRes.ok) {
        const bountyData = await bountyRes.json()
        setBounties(bountyData.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const markPlayed = async (bountyId: string) => {
    setMarking(bountyId)
    try {
      const res = await fetch(`/api/bounties/${bountyId}/played`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchData()
      }
    } finally {
      setMarking(null)
    }
  }

  const endShow = async () => {
    const res = await fetch(`/api/shows/${id}/end`, { method: 'POST' })
    if (res.ok) {
      router.push(`/band/show/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const openBounties = bounties
    .filter((b) => b.status === 'open')
    .sort((a, b) => b.total_amount - a.total_amount)
  const settlingBounties = bounties.filter((b) => b.status === 'settling')
  const completedBounties = bounties.filter(
    (b) => b.status === 'completed' || b.status === 'refunded',
  )
  const totalPool = openBounties.reduce((s, b) => s + b.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Live header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-sm font-bold uppercase tracking-widest text-emerald-400">
              Live
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-white">
            {show?.venue_name ?? 'Show'}
          </h1>
        </div>
        <button
          onClick={endShow}
          className="flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/30"
        >
          <StopCircle size={16} />
          End Show
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 p-3 text-center">
          <DollarSign size={16} className="mx-auto text-emerald-400" />
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {formatDollars(totalPool)}
          </p>
          <p className="text-xs text-zinc-500">Open Pool</p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-3 text-center">
          <Music size={16} className="mx-auto text-zinc-400" />
          <p className="mt-1 text-lg font-bold text-white">
            {openBounties.length}
          </p>
          <p className="text-xs text-zinc-500">Requests</p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-3 text-center">
          <CheckCircle size={16} className="mx-auto text-zinc-400" />
          <p className="mt-1 text-lg font-bold text-white">
            {completedBounties.length}
          </p>
          <p className="text-xs text-zinc-500">Played</p>
        </div>
      </div>

      {/* Open bounties - the action list */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Open Requests (ranked by bounty)
        </h2>
        {openBounties.length === 0 ? (
          <div className="rounded-xl bg-zinc-900 py-8 text-center">
            <Music size={32} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              Waiting for song requests...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {openBounties.map((bounty, i) => (
              <div
                key={bounty.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-900 p-4"
              >
                <span className="w-6 text-center text-sm font-bold text-zinc-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {bounty.song.title}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-zinc-500">
                    <span>{bounty.song.artist}</span>
                    <span className="flex items-center gap-0.5">
                      <Users size={11} />
                      {bounty.backer_count}
                    </span>
                  </p>
                </div>
                <span className="text-lg font-bold text-emerald-400">
                  {formatDollars(bounty.total_amount)}
                </span>
                <button
                  onClick={() => markPlayed(bounty.id)}
                  disabled={marking === bounty.id}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {marking === bounty.id ? '...' : 'Played'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settling */}
      {settlingBounties.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">
            Settling (awaiting fan votes)
          </h2>
          <div className="space-y-2">
            {settlingBounties.map((bounty) => (
              <div
                key={bounty.id}
                className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-zinc-900 p-4"
              >
                <Clock size={16} className="shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {bounty.song.title}
                  </p>
                  <p className="text-sm text-zinc-500">{bounty.song.artist}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  {formatDollars(bounty.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

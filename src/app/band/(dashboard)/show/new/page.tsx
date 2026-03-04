'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin } from 'lucide-react'

export default function NewShow() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!session?.user?.bandId) return

    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          band_id: session.user.bandId,
          venue_name: form.get('venue_name'),
          venue_address: form.get('venue_address'),
          start_time: form.get('start_time'),
          end_time: form.get('end_time'),
          request_cutoff: Number(form.get('request_cutoff')) || 0,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create show')
        setLoading(false)
        return
      }

      router.push(`/band/show/${data.data.id}`)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  // Default start: today + 3 hours, end: +6 hours
  const now = new Date()
  const start = new Date(now.getTime() + 3 * 3600000)
  const end = new Date(now.getTime() + 6 * 3600000)
  const toLocal = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - offset).toISOString().slice(0, 16)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-white">Create New Show</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-400">
            <MapPin size={14} />
            Venue Name
          </label>
          <input
            name="venue_name"
            required
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="The Fillmore"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-400">
            <MapPin size={14} />
            Venue Address
          </label>
          <input
            name="venue_address"
            required
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="1805 Geary Blvd, San Francisco, CA"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-400">
              <Calendar size={14} />
              Start Time
            </label>
            <input
              name="start_time"
              type="datetime-local"
              required
              defaultValue={toLocal(start)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-400">
              <Calendar size={14} />
              End Time
            </label>
            <input
              name="end_time"
              type="datetime-local"
              required
              defaultValue={toLocal(end)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 text-sm font-medium text-zinc-400">
            Request Cutoff (minutes before end, 0 = unlimited)
          </label>
          <input
            name="request_cutoff"
            type="number"
            min="0"
            defaultValue="0"
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Show'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Download, Search, CheckCircle, Loader2 } from 'lucide-react'

export function ImportShows({ bandId }: { bandId: string }) {
  const [open, setOpen] = useState(false)
  const [artistName, setArtistName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; total_found: number } | null>(null)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!artistName.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/shows/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ band_id: bandId, artist_name: artistName }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed')
      } else {
        setResult({ imported: data.imported, total_found: data.total_found })
        if (data.imported > 0) {
          // Reload to show new shows
          setTimeout(() => window.location.reload(), 1500)
        }
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 py-4 text-sm font-semibold text-zinc-400 transition-colors hover:border-blue-500 hover:text-blue-400"
      >
        <Download size={18} />
        Import Shows from Bandsintown
      </button>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">Import from Bandsintown</h3>
      <p className="mb-4 text-xs text-zinc-500">
        Enter your artist name as it appears on Bandsintown. We&apos;ll pull in all upcoming shows.
      </p>

      {error && (
        <div className="mb-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          <CheckCircle size={16} />
          Imported {result.imported} of {result.total_found} shows
          {result.imported === 0 && result.total_found > 0 && ' (all already imported)'}
          {result.total_found === 0 && ' — no upcoming shows found'}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Artist name on Bandsintown"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            className="w-full rounded-xl bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleImport}
          disabled={loading || !artistName.trim()}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {loading ? 'Importing...' : 'Import'}
        </button>
      </div>

      <button
        onClick={() => { setOpen(false); setResult(null); setError('') }}
        className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
      >
        Cancel
      </button>
    </div>
  )
}

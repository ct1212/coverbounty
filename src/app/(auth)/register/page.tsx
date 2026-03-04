'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Music } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bandName, setBandName] = useState('')
  const [isBand, setIsBand] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          bandName: isBand ? bandName : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but login failed. Please sign in manually.')
        setLoading(false)
      } else {
        router.push(isBand ? '/band' : '/shows')
      }
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Music size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="mt-1 text-sm text-zinc-500">Join CoverBounty as a fan or band</p>
        </div>

        {/* Toggle: Fan vs Band */}
        <div className="mb-6 flex rounded-xl bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setIsBand(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              !isBand ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Fan
          </button>
          <button
            type="button"
            onClick={() => setIsBand(true)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              isBand ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Band
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
            />
          </div>

          {isBand && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Band Name
              </label>
              <input
                type="text"
                required={isBand}
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="The Midnight Riders"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : isBand ? 'Create Band Account' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

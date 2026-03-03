import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emitToShow } from '@/lib/socket'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const show = await prisma.show.findUnique({ where: { id } })
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    const bounties = await prisma.bounty.findMany({
      where: { show_id: id },
      include: { song: true, _count: { select: { contributions: true } } },
      orderBy: { total_amount: 'desc' },
    })

    return NextResponse.json({ data: bounties })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { song_id, song_title, song_artist } = body

    const show = await prisma.show.findUnique({ where: { id } })
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    if (!['live', 'created', 'synced'].includes(show.status)) {
      return NextResponse.json(
        { error: 'Bounties can only be created for active shows' },
        { status: 400 },
      )
    }

    if (show.requests_locked_at) {
      return NextResponse.json({ error: 'Requests are locked for this show' }, { status: 400 })
    }

    let resolvedSongId = song_id

    // If no song_id provided, create or find song by title+artist
    if (!resolvedSongId) {
      if (!song_title || !song_artist) {
        return NextResponse.json(
          { error: 'song_id or song_title + song_artist are required' },
          { status: 400 },
        )
      }

      const existing = await prisma.song.findFirst({
        where: { title: song_title, artist: song_artist },
      })

      if (existing) {
        resolvedSongId = existing.id
      } else {
        const newSong = await prisma.song.create({
          data: { title: song_title, artist: song_artist, genre_tags: [] },
        })
        resolvedSongId = newSong.id
      }
    }

    // Prevent duplicate bounties for same song on same show
    const existing = await prisma.bounty.findFirst({
      where: { show_id: id, song_id: resolvedSongId, status: 'open' },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'An open bounty for this song already exists on this show', data: existing },
        { status: 409 },
      )
    }

    const bounty = await prisma.bounty.create({
      data: { show_id: id, song_id: resolvedSongId },
      include: { song: true },
    })

    emitToShow(id, 'bounty:created', bounty)

    return NextResponse.json({ data: bounty }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

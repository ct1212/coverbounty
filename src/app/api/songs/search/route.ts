import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const songs = await prisma.song.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { artist: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: { title: 'asc' },
  })

  return NextResponse.json({ data: songs })
}

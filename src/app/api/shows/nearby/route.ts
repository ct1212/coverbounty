import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface NearbyShowRow {
  id: string
  band_id: string
  band_name: string
  venue_name: string
  venue_address: string
  start_time: Date
  end_time: Date
  status: string
  distance_km: number
  bounty_count: bigint
  total_pool: bigint
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') ?? '')
    const lng = parseFloat(searchParams.get('lng') ?? '')
    const radius = parseFloat(searchParams.get('radius') ?? '50')

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'lat and lng query parameters are required' },
        { status: 400 },
      )
    }

    const shows = await prisma.$queryRaw<NearbyShowRow[]>`
      SELECT
        s.id,
        s.band_id,
        b.name AS band_name,
        s.venue_name,
        s.venue_address,
        s.start_time,
        s.end_time,
        s.status,
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${lat})) * cos(radians(s.venue_lat)) *
              cos(radians(s.venue_lng) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(s.venue_lat))
            ))
          )
        ) AS distance_km,
        COALESCE(bc.cnt, 0) AS bounty_count,
        COALESCE(bc.pool, 0) AS total_pool
      FROM "Show" s
      JOIN "Band" b ON s.band_id = b.id
      LEFT JOIN (
        SELECT show_id, COUNT(*) AS cnt, SUM(total_amount) AS pool
        FROM "Bounty"
        GROUP BY show_id
      ) bc ON bc.show_id = s.id
      WHERE s.venue_lat IS NOT NULL
        AND s.venue_lng IS NOT NULL
        AND s.status IN ('live', 'created', 'synced')
        AND s.start_time > NOW() - INTERVAL '6 hours'
        AND (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${lat})) * cos(radians(s.venue_lat)) *
              cos(radians(s.venue_lng) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(s.venue_lat))
            ))
          )
        ) < ${radius}
      ORDER BY
        CASE WHEN s.status = 'live' THEN 0 ELSE 1 END,
        distance_km ASC,
        s.start_time ASC
      LIMIT 20
    `

    const data = shows.map((s) => ({
      id: s.id,
      bandName: s.band_name,
      venueName: s.venue_name,
      venueAddress: s.venue_address,
      startTime: s.start_time.toISOString(),
      endTime: s.end_time.toISOString(),
      status: s.status,
      distance: Math.round(Number(s.distance_km) * 10) / 10,
      bountyCount: Number(s.bounty_count),
      totalPool: Number(s.total_pool),
    }))

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

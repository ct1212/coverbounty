import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import QRCode from 'qrcode'

const BIT_APP_ID = process.env.BANDSINTOWN_APP_ID ?? 'coverbounty'

interface BITEvent {
  id: string
  datetime: string
  venue: {
    name: string
    city: string
    region: string
    country: string
    latitude: string
    longitude: string
  }
  offers: Array<{ url: string }>
  lineup: string[]
  description: string
}

export async function POST(request: NextRequest) {
  try {
    const { band_id, artist_name } = await request.json()

    if (!band_id || !artist_name) {
      return NextResponse.json(
        { error: 'band_id and artist_name are required' },
        { status: 400 },
      )
    }

    const band = await prisma.band.findUnique({ where: { id: band_id } })
    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    // Fetch upcoming events from Bandsintown
    const encoded = encodeURIComponent(artist_name)
    const url = `https://rest.bandsintown.com/artists/${encoded}/events?app_id=${BIT_APP_ID}&date=upcoming`

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Bandsintown API returned ${res.status}` },
        { status: 502 },
      )
    }

    const events: BITEvent[] = await res.json()

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ data: [], imported: 0 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const imported = []

    for (const event of events) {
      // Skip if already imported
      const existing = await prisma.show.findFirst({
        where: {
          band_id,
          external_show_id: String(event.id),
          source: 'bandsintown',
        },
      })
      if (existing) continue

      const address = [event.venue.name, event.venue.city, event.venue.region, event.venue.country]
        .filter(Boolean)
        .join(', ')

      const startTime = new Date(event.datetime)
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000) // default 3hr show

      const show = await prisma.show.create({
        data: {
          band_id,
          venue_name: event.venue.name,
          venue_address: address,
          venue_lat: event.venue.latitude ? parseFloat(event.venue.latitude) : null,
          venue_lng: event.venue.longitude ? parseFloat(event.venue.longitude) : null,
          start_time: startTime,
          end_time: endTime,
          source: 'bandsintown',
          external_show_id: String(event.id),
          request_cutoff: band.default_request_cutoff,
        },
      })

      const shareUrl = `${baseUrl}/show/${show.id}`
      const qrCodeUrl = await QRCode.toDataURL(shareUrl)

      const updated = await prisma.show.update({
        where: { id: show.id },
        data: { share_url: shareUrl, qr_code_url: qrCodeUrl },
      })

      imported.push(updated)
    }

    // Update band's bandsintown_id if not set
    if (!band.bandsintown_id) {
      await prisma.band.update({
        where: { id: band_id },
        data: { bandsintown_id: artist_name },
      })
    }

    return NextResponse.json({
      data: imported,
      imported: imported.length,
      total_found: events.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const band_id = searchParams.get('band_id')
    const status = searchParams.get('status')

    const shows = await prisma.show.findMany({
      where: {
        ...(band_id ? { band_id } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        band: { select: { id: true, name: true } },
        _count: { select: { bounties: true } },
      },
      orderBy: { start_time: 'desc' },
    })

    return NextResponse.json({ data: shows })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      band_id,
      venue_name,
      venue_address,
      venue_lat,
      venue_lng,
      start_time,
      end_time,
      request_cutoff,
      source,
      external_show_id,
    } = body

    if (!band_id || !venue_name || !venue_address || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'band_id, venue_name, venue_address, start_time, and end_time are required' },
        { status: 400 },
      )
    }

    const band = await prisma.band.findUnique({ where: { id: band_id } })
    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    // Create show first to get the ID for share_url and QR code
    const show = await prisma.show.create({
      data: {
        band_id,
        venue_name,
        venue_address,
        venue_lat: venue_lat ?? null,
        venue_lng: venue_lng ?? null,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        request_cutoff: request_cutoff ?? band.default_request_cutoff,
        source: source ?? 'manual',
        external_show_id: external_show_id ?? null,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const shareUrl = `${baseUrl}/show/${show.id}`
    const qrCodeUrl = await QRCode.toDataURL(shareUrl)

    const updated = await prisma.show.update({
      where: { id: show.id },
      data: { share_url: shareUrl, qr_code_url: qrCodeUrl },
      include: { band: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: updated }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

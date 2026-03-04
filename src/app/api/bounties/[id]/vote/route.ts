import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { vote, contribution_id } = await request.json()

    if (!vote || !['yes', 'no', 'left_early'].includes(vote)) {
      return NextResponse.json(
        { error: 'vote must be yes, no, or left_early' },
        { status: 400 },
      )
    }

    const bounty = await prisma.bounty.findUnique({ where: { id } })
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'settling') {
      return NextResponse.json(
        { error: 'Voting is only available during settlement' },
        { status: 400 },
      )
    }

    // Find the contribution to vote on
    let contribution
    if (contribution_id) {
      contribution = await prisma.contribution.findUnique({
        where: { id: contribution_id },
      })
    } else {
      // Find by fan session cookie
      const fanToken = request.cookies.get('cb_fan_session')?.value
      if (fanToken) {
        const fan = await prisma.fan.findUnique({
          where: { fan_session_token: fanToken },
        })
        if (fan) {
          contribution = await prisma.contribution.findFirst({
            where: { bounty_id: id, fan_id: fan.id },
          })
        }
      }
    }

    if (!contribution) {
      return NextResponse.json(
        { error: 'Contribution not found. You can only vote on bounties you backed.' },
        { status: 404 },
      )
    }

    if (contribution.bounty_id !== id) {
      return NextResponse.json({ error: 'Contribution does not belong to this bounty' }, { status: 400 })
    }

    const updated = await prisma.contribution.update({
      where: { id: contribution.id },
      data: { fan_vote: vote },
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

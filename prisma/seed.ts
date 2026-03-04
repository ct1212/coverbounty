import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const demoPassword = await bcrypt.hash('demo1234', 10)

  // --- Songs ---
  const songs = await Promise.all([
    prisma.song.upsert({
      where: { id: 'song-bohemian-rhapsody' },
      update: {},
      create: {
        id: 'song-bohemian-rhapsody',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        genre_tags: ['rock', 'classic-rock'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-hotel-california' },
      update: {},
      create: {
        id: 'song-hotel-california',
        title: 'Hotel California',
        artist: 'Eagles',
        genre_tags: ['rock', 'classic-rock'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-stairway-to-heaven' },
      update: {},
      create: {
        id: 'song-stairway-to-heaven',
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        genre_tags: ['rock', 'classic-rock'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-sweet-child' },
      update: {},
      create: {
        id: 'song-sweet-child',
        title: "Sweet Child O' Mine",
        artist: "Guns N' Roses",
        genre_tags: ['rock', 'hard-rock'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-wonderwall' },
      update: {},
      create: {
        id: 'song-wonderwall',
        title: 'Wonderwall',
        artist: 'Oasis',
        genre_tags: ['indie', 'britpop'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-smells-like' },
      update: {},
      create: {
        id: 'song-smells-like',
        title: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        genre_tags: ['grunge', 'alternative'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-yellow' },
      update: {},
      create: {
        id: 'song-yellow',
        title: 'Yellow',
        artist: 'Coldplay',
        genre_tags: ['alternative', 'indie'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-dont-stop' },
      update: {},
      create: {
        id: 'song-dont-stop',
        title: "Don't Stop Believin'",
        artist: 'Journey',
        genre_tags: ['rock', 'classic-rock'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-africa' },
      update: {},
      create: {
        id: 'song-africa',
        title: 'Africa',
        artist: 'Toto',
        genre_tags: ['rock', 'pop-rock'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-mr-brightside' },
      update: {},
      create: {
        id: 'song-mr-brightside',
        title: 'Mr. Brightside',
        artist: 'The Killers',
        genre_tags: ['indie', 'alternative'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-come-as-you-are' },
      update: {},
      create: {
        id: 'song-come-as-you-are',
        title: 'Come As You Are',
        artist: 'Nirvana',
        genre_tags: ['grunge', 'alternative'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-under-the-bridge' },
      update: {},
      create: {
        id: 'song-under-the-bridge',
        title: 'Under the Bridge',
        artist: 'Red Hot Chili Peppers',
        genre_tags: ['rock', 'alternative'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-creep' },
      update: {},
      create: {
        id: 'song-creep',
        title: 'Creep',
        artist: 'Radiohead',
        genre_tags: ['alternative', 'indie'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-with-or-without-you' },
      update: {},
      create: {
        id: 'song-with-or-without-you',
        title: 'With or Without You',
        artist: 'U2',
        genre_tags: ['rock', 'alternative'],
      },
    }),
    prisma.song.upsert({
      where: { id: 'song-every-breath' },
      update: {},
      create: {
        id: 'song-every-breath',
        title: 'Every Breath You Take',
        artist: 'The Police',
        genre_tags: ['rock', 'new-wave'],
      },
    }),
  ])

  console.log(`Created ${songs.length} songs`)

  // --- Bands ---
  const band1 = await prisma.band.upsert({
    where: { id: 'band-midnight-riders' },
    update: {},
    create: {
      id: 'band-midnight-riders',
      name: 'The Midnight Riders',
      email: 'contact@midnightriders.com',
      password_hash: demoPassword,
      average_rating: 4.5,
      total_bounties_fulfilled: 12,
      total_earned: 145000,
      default_request_cutoff: 30,
    },
  })

  const band2 = await prisma.band.upsert({
    where: { id: 'band-electric-storm' },
    update: {},
    create: {
      id: 'band-electric-storm',
      name: 'Electric Storm',
      email: 'hello@electricstorm.band',
      password_hash: demoPassword,
      average_rating: 4.2,
      total_bounties_fulfilled: 8,
      total_earned: 89000,
      default_request_cutoff: 0,
    },
  })

  const band3 = await prisma.band.upsert({
    where: { id: 'band-velvet-echoes' },
    update: {},
    create: {
      id: 'band-velvet-echoes',
      name: 'The Velvet Echoes',
      email: 'info@velvetechoes.com',
      password_hash: demoPassword,
      average_rating: 4.8,
      total_bounties_fulfilled: 22,
      total_earned: 278000,
      default_request_cutoff: 60,
    },
  })

  console.log('Created 3 bands')

  // --- Shows ---
  const now = new Date()

  const show1 = await prisma.show.upsert({
    where: { id: 'show-fillmore-live' },
    update: {},
    create: {
      id: 'show-fillmore-live',
      band_id: band1.id,
      venue_name: 'The Fillmore',
      venue_address: '1805 Geary Blvd, San Francisco, CA 94115',
      venue_lat: 37.7841,
      venue_lng: -122.4332,
      start_time: new Date(now.getTime() - 60 * 60 * 1000), // started 1 hour ago
      end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000), // ends in 2 hours
      status: 'live',
      source: 'manual',
      share_url: 'http://localhost:3000/show/show-fillmore-live',
      qr_code_url: 'data:image/png;base64,mock_qr_code',
    },
  })

  const show2 = await prisma.show.upsert({
    where: { id: 'show-hob-settling' },
    update: {},
    create: {
      id: 'show-hob-settling',
      band_id: band2.id,
      venue_name: 'House of Blues',
      venue_address: '329 N Dearborn St, Chicago, IL 60654',
      venue_lat: 41.8881,
      venue_lng: -87.6298,
      start_time: new Date(now.getTime() - 5 * 60 * 60 * 1000), // started 5 hours ago
      end_time: new Date(now.getTime() - 2 * 60 * 60 * 1000), // ended 2 hours ago
      status: 'settling',
      settlement_deadline: new Date(now.getTime() + 30 * 60 * 1000), // 30 min left
      source: 'manual',
      share_url: 'http://localhost:3000/show/show-hob-settling',
      qr_code_url: 'data:image/png;base64,mock_qr_code',
    },
  })

  const show3 = await prisma.show.upsert({
    where: { id: 'show-troubadour-upcoming' },
    update: {},
    create: {
      id: 'show-troubadour-upcoming',
      band_id: band3.id,
      venue_name: 'The Troubadour',
      venue_address: '9081 Santa Monica Blvd, West Hollywood, CA 90069',
      venue_lat: 34.0805,
      venue_lng: -118.3886,
      start_time: new Date(now.getTime() + 3 * 60 * 60 * 1000), // starts in 3 hours
      end_time: new Date(now.getTime() + 6 * 60 * 60 * 1000), // ends in 6 hours
      status: 'created',
      source: 'manual',
      share_url: 'http://localhost:3000/show/show-troubadour-upcoming',
      qr_code_url: 'data:image/png;base64,mock_qr_code',
    },
  })

  const show4 = await prisma.show.upsert({
    where: { id: 'show-redrocks-ended' },
    update: {},
    create: {
      id: 'show-redrocks-ended',
      band_id: band1.id,
      venue_name: 'Red Rocks Amphitheatre',
      venue_address: '18300 W Alameda Pkwy, Morrison, CO 80465',
      venue_lat: 39.6654,
      venue_lng: -105.2057,
      start_time: new Date(now.getTime() - 26 * 60 * 60 * 1000), // yesterday
      end_time: new Date(now.getTime() - 22 * 60 * 60 * 1000),
      status: 'ended',
      source: 'manual',
      share_url: 'http://localhost:3000/show/show-redrocks-ended',
      qr_code_url: 'data:image/png;base64,mock_qr_code',
    },
  })

  console.log('Created 4 shows')

  // --- Fans ---
  const fan1 = await prisma.fan.upsert({
    where: { id: 'fan-alice' },
    update: {},
    create: { id: 'fan-alice', email: 'alice@example.com', phone: '+14155550001' },
  })
  const fan2 = await prisma.fan.upsert({
    where: { id: 'fan-bob' },
    update: {},
    create: { id: 'fan-bob', email: 'bob@example.com', phone: '+14155550002' },
  })
  const fan3 = await prisma.fan.upsert({
    where: { id: 'fan-charlie' },
    update: {},
    create: { id: 'fan-charlie', email: 'charlie@example.com' },
  })

  // --- Bounties for live show (show1 - The Fillmore) ---
  const bounty1 = await prisma.bounty.upsert({
    where: { id: 'bounty-fillmore-bohemian' },
    update: {},
    create: {
      id: 'bounty-fillmore-bohemian',
      show_id: show1.id,
      song_id: songs[0].id, // Bohemian Rhapsody
      status: 'open',
      total_amount: 4500,
      backer_count: 3,
    },
  })

  const bounty2 = await prisma.bounty.upsert({
    where: { id: 'bounty-fillmore-hotel' },
    update: {},
    create: {
      id: 'bounty-fillmore-hotel',
      show_id: show1.id,
      song_id: songs[1].id, // Hotel California
      status: 'open',
      total_amount: 3200,
      backer_count: 2,
    },
  })

  const bounty3 = await prisma.bounty.upsert({
    where: { id: 'bounty-fillmore-stairway' },
    update: {},
    create: {
      id: 'bounty-fillmore-stairway',
      show_id: show1.id,
      song_id: songs[2].id, // Stairway to Heaven
      status: 'open',
      total_amount: 2800,
      backer_count: 2,
    },
  })

  const bounty4 = await prisma.bounty.upsert({
    where: { id: 'bounty-fillmore-africa' },
    update: {},
    create: {
      id: 'bounty-fillmore-africa',
      show_id: show1.id,
      song_id: songs[8].id, // Africa
      status: 'open',
      total_amount: 1500,
      backer_count: 1,
    },
  })

  // --- Bounties for settling show (show2 - House of Blues) ---
  const bounty5 = await prisma.bounty.upsert({
    where: { id: 'bounty-hob-creep' },
    update: {},
    create: {
      id: 'bounty-hob-creep',
      show_id: show2.id,
      song_id: songs[12].id, // Creep
      status: 'settling',
      total_amount: 7500,
      backer_count: 5,
      settlement_deadline: new Date(now.getTime() + 30 * 60 * 1000),
    },
  })

  const bounty6 = await prisma.bounty.upsert({
    where: { id: 'bounty-hob-wonderwall' },
    update: {},
    create: {
      id: 'bounty-hob-wonderwall',
      show_id: show2.id,
      song_id: songs[4].id, // Wonderwall
      status: 'completed',
      total_amount: 5000,
      backer_count: 4,
      average_rating: 4.8,
    },
  })

  // --- Bounties for upcoming show (show3 - Troubadour) ---
  const bounty7 = await prisma.bounty.upsert({
    where: { id: 'bounty-troubadour-yellow' },
    update: {},
    create: {
      id: 'bounty-troubadour-yellow',
      show_id: show3.id,
      song_id: songs[6].id, // Yellow
      status: 'open',
      total_amount: 1000,
      backer_count: 1,
    },
  })

  const bounty8 = await prisma.bounty.upsert({
    where: { id: 'bounty-troubadour-mr-brightside' },
    update: {},
    create: {
      id: 'bounty-troubadour-mr-brightside',
      show_id: show3.id,
      song_id: songs[9].id, // Mr. Brightside
      status: 'open',
      total_amount: 2500,
      backer_count: 2,
    },
  })

  // --- Bounties for ended show (show4 - Red Rocks) ---
  const bounty9 = await prisma.bounty.upsert({
    where: { id: 'bounty-redrocks-sweet-child' },
    update: {},
    create: {
      id: 'bounty-redrocks-sweet-child',
      show_id: show4.id,
      song_id: songs[3].id, // Sweet Child O' Mine
      status: 'completed',
      total_amount: 12000,
      backer_count: 8,
      average_rating: 5.0,
    },
  })

  const bounty10 = await prisma.bounty.upsert({
    where: { id: 'bounty-redrocks-dont-stop' },
    update: {},
    create: {
      id: 'bounty-redrocks-dont-stop',
      show_id: show4.id,
      song_id: songs[7].id, // Don't Stop Believin'
      status: 'refunded',
      total_amount: 4000,
      backer_count: 3,
    },
  })

  console.log('Created 10 bounties')

  // --- Contributions ---
  await Promise.all([
    // Contributions to bounty1 (Bohemian Rhapsody - live show)
    prisma.contribution.upsert({
      where: { id: 'contrib-1' },
      update: {},
      create: {
        id: 'contrib-1',
        bounty_id: bounty1.id,
        fan_id: fan1.id,
        amount: 2000,
        tip_amount: 200,
        stripe_payment_intent_id: 'pi_mock_001',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-2' },
      update: {},
      create: {
        id: 'contrib-2',
        bounty_id: bounty1.id,
        fan_id: fan2.id,
        amount: 1500,
        stripe_payment_intent_id: 'pi_mock_002',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-3' },
      update: {},
      create: {
        id: 'contrib-3',
        bounty_id: bounty1.id,
        fan_id: fan3.id,
        amount: 1000,
        stripe_payment_intent_id: 'pi_mock_003',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    // Contributions to bounty2 (Hotel California - live show)
    prisma.contribution.upsert({
      where: { id: 'contrib-4' },
      update: {},
      create: {
        id: 'contrib-4',
        bounty_id: bounty2.id,
        fan_id: fan1.id,
        amount: 1500,
        stripe_payment_intent_id: 'pi_mock_004',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-5' },
      update: {},
      create: {
        id: 'contrib-5',
        bounty_id: bounty2.id,
        fan_id: fan3.id,
        amount: 1700,
        stripe_payment_intent_id: 'pi_mock_005',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    // Contributions to settling bounty (Creep - House of Blues)
    prisma.contribution.upsert({
      where: { id: 'contrib-6' },
      update: {},
      create: {
        id: 'contrib-6',
        bounty_id: bounty5.id,
        fan_id: fan1.id,
        amount: 2000,
        stripe_payment_intent_id: 'pi_mock_006',
        status: 'authorized',
        fan_vote: 'yes',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-7' },
      update: {},
      create: {
        id: 'contrib-7',
        bounty_id: bounty5.id,
        fan_id: fan2.id,
        amount: 1500,
        stripe_payment_intent_id: 'pi_mock_007',
        status: 'authorized',
        fan_vote: 'yes',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-8' },
      update: {},
      create: {
        id: 'contrib-8',
        bounty_id: bounty5.id,
        fan_id: fan3.id,
        amount: 1000,
        stripe_payment_intent_id: 'pi_mock_008',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    // Captured contributions for completed bounty (Wonderwall - House of Blues)
    prisma.contribution.upsert({
      where: { id: 'contrib-9' },
      update: {},
      create: {
        id: 'contrib-9',
        bounty_id: bounty6.id,
        fan_id: fan1.id,
        amount: 1500,
        rating: 5,
        stripe_payment_intent_id: 'pi_mock_009',
        status: 'captured',
        fan_vote: 'yes',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-10' },
      update: {},
      create: {
        id: 'contrib-10',
        bounty_id: bounty6.id,
        fan_id: fan2.id,
        amount: 2000,
        rating: 5,
        stripe_payment_intent_id: 'pi_mock_010',
        status: 'captured',
        fan_vote: 'yes',
      },
    }),
    // Completed Red Rocks bounty contributions
    prisma.contribution.upsert({
      where: { id: 'contrib-11' },
      update: {},
      create: {
        id: 'contrib-11',
        bounty_id: bounty9.id,
        fan_id: fan1.id,
        amount: 3000,
        rating: 5,
        stripe_payment_intent_id: 'pi_mock_011',
        status: 'captured',
        fan_vote: 'yes',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-12' },
      update: {},
      create: {
        id: 'contrib-12',
        bounty_id: bounty9.id,
        fan_id: fan2.id,
        amount: 2500,
        rating: 5,
        stripe_payment_intent_id: 'pi_mock_012',
        status: 'captured',
        fan_vote: 'yes',
      },
    }),
    // Refunded bounty contributions (Don't Stop Believin' - Red Rocks)
    prisma.contribution.upsert({
      where: { id: 'contrib-13' },
      update: {},
      create: {
        id: 'contrib-13',
        bounty_id: bounty10.id,
        fan_id: fan3.id,
        amount: 2000,
        stripe_payment_intent_id: 'pi_mock_013',
        status: 'refunded',
        fan_vote: 'no',
      },
    }),
    // Contributions to upcoming show bounties
    prisma.contribution.upsert({
      where: { id: 'contrib-14' },
      update: {},
      create: {
        id: 'contrib-14',
        bounty_id: bounty7.id,
        fan_id: fan1.id,
        amount: 1000,
        stripe_payment_intent_id: 'pi_mock_014',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-15' },
      update: {},
      create: {
        id: 'contrib-15',
        bounty_id: bounty8.id,
        fan_id: fan2.id,
        amount: 1500,
        stripe_payment_intent_id: 'pi_mock_015',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    // Additional contributions for stairway and africa bounties
    prisma.contribution.upsert({
      where: { id: 'contrib-16' },
      update: {},
      create: {
        id: 'contrib-16',
        bounty_id: bounty3.id,
        fan_id: fan2.id,
        amount: 1500,
        stripe_payment_intent_id: 'pi_mock_016',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
    prisma.contribution.upsert({
      where: { id: 'contrib-17' },
      update: {},
      create: {
        id: 'contrib-17',
        bounty_id: bounty4.id,
        fan_id: fan3.id,
        amount: 1500,
        stripe_payment_intent_id: 'pi_mock_017',
        status: 'authorized',
        fan_vote: 'no_response',
      },
    }),
  ])

  console.log('Created 17 contributions')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

# Database Schema

## Band
- id: UUID PRIMARY KEY
- name: VARCHAR(255)
- email: VARCHAR(255) UNIQUE
- stripe_connect_id: VARCHAR(255)
- bandsintown_id: VARCHAR(255) NULL
- songkick_id: VARCHAR(255) NULL
- average_rating: DECIMAL(2,1) DEFAULT 0
- total_bounties_fulfilled: INT DEFAULT 0
- total_earned: INT DEFAULT 0 (cents)
- default_request_cutoff: INT DEFAULT 0 (minutes before show, 0 = open through show)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

## Show
- id: UUID PRIMARY KEY
- band_id: UUID FOREIGN KEY
- venue_name: VARCHAR(255)
- venue_address: TEXT
- venue_lat: DECIMAL(10,8) NULL
- venue_lng: DECIMAL(11,8) NULL
- start_time: TIMESTAMP
- end_time: TIMESTAMP
- status: ENUM('synced', 'created', 'live', 'settling', 'ended')
- request_cutoff: INT NULL (minutes before show, inherits from band)
- requests_locked_at: TIMESTAMP NULL
- settlement_deadline: TIMESTAMP NULL
- source: ENUM('manual', 'bandsintown', 'songkick')
- external_show_id: VARCHAR(255) NULL
- qr_code_url: TEXT
- share_url: TEXT UNIQUE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

## Venue
- id: UUID PRIMARY KEY
- name: VARCHAR(255)
- address: TEXT
- lat: DECIMAL(10,8)
- lng: DECIMAL(11,8)
- slug: VARCHAR(255) UNIQUE
- created_at: TIMESTAMP

## Song
- id: UUID PRIMARY KEY
- title: VARCHAR(255)
- artist: VARCHAR(255)
- external_id: VARCHAR(255) NULL (Spotify/MusicBrainz)
- genre_tags: TEXT[]
- created_at: TIMESTAMP

## Bounty
- id: UUID PRIMARY KEY
- show_id: UUID FOREIGN KEY
- song_id: UUID FOREIGN KEY
- status: ENUM('open', 'settling', 'completed', 'refunded')
- total_amount: INT DEFAULT 0 (cents)
- backer_count: INT DEFAULT 0
- average_rating: DECIMAL(2,1) NULL
- settlement_deadline: TIMESTAMP NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

## Contribution
- id: UUID PRIMARY KEY
- bounty_id: UUID FOREIGN KEY
- fan_id: UUID NULL FOREIGN KEY (nullable for guest checkout)
- amount: INT (cents)
- tip_amount: INT DEFAULT 0 (cents)
- rating: INT NULL (1-5)
- fan_vote: ENUM('yes', 'no', 'left_early', 'no_response') DEFAULT 'no_response'
- stripe_payment_intent_id: VARCHAR(255)
- status: ENUM('authorized', 'captured', 'refunded')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

## BandRepertoire
- id: UUID PRIMARY KEY
- band_id: UUID FOREIGN KEY
- song_id: UUID FOREIGN KEY
- created_at: TIMESTAMP

## BandBlacklist
- id: UUID PRIMARY KEY
- band_id: UUID FOREIGN KEY
- song_id: UUID FOREIGN KEY
- created_at: TIMESTAMP

## Fan (optional account)
- id: UUID PRIMARY KEY
- phone: VARCHAR(20) NULL
- email: VARCHAR(255) NULL
- created_at: TIMESTAMP

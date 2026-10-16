export interface ArtworkRoleDefinition {
  id: string
  entityType: 'game' | 'tournament'
  slotKey: string
  name: string
  frontendPlacement: string
  description: string
  aspectRatio: string
  recommendedResolution: string
  acceptedFormats: string[]
  required?: boolean
}

export const GAME_ARTWORK_ROLES: ArtworkRoleDefinition[] = [
  {
    id: 'game.homepage_hero_floating',
    entityType: 'game',
    slotKey: 'homepage_hero_floating',
    name: 'Homepage Hero Floating Artwork',
    frontendPlacement: 'Homepage Hero Floating Panel',
    description: 'Floating angular artwork panel orbiting behind the central hero heading on the homepage.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: false,
  },
  {
    id: 'game.active_catalog_card',
    entityType: 'game',
    slotKey: 'catalog_card',
    name: 'Active Games Catalog Card',
    frontendPlacement: 'Active Games Catalog (/games) & Homepage Game Cards',
    description: 'Primary artwork displayed on the game card in the Active Games section and homepage active games.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: true,
  },
  {
    id: 'game.coming_soon_catalog_card',
    entityType: 'game',
    slotKey: 'coming_soon_catalog_card',
    name: 'Coming Soon Games Catalog Card',
    frontendPlacement: 'Coming Soon Games (/games)',
    description: 'Artwork displayed on locked worlds before official platform launch. Automatically transitions to active artwork upon release.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: false,
  },
  {
    id: 'game.detail_banner',
    entityType: 'game',
    slotKey: 'banner',
    name: 'Game Detail Header Banner',
    frontendPlacement: 'Game Detail Page Header (/games/:slug)',
    description: 'Wide panoramic banner displayed as the hero header on the individual game overview page.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: true,
  },
  {
    id: 'game.showcase_card',
    entityType: 'game',
    slotKey: 'showcase_card',
    name: 'Homepage Game Showcase Card',
    frontendPlacement: 'Homepage Game Showcase ("8 Games. One Arena.")',
    description: 'Vertical staggered card artwork for the homepage game showcase section.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: false,
  },
  {
    id: 'game.logo',
    entityType: 'game',
    slotKey: 'logo',
    name: 'Game Emblem / Icon',
    frontendPlacement: 'Tournament Game Badges, Selectors, Match Headers',
    description: 'Square game emblem or SVG vector icon used across tournament crests and game selectors.',
    aspectRatio: '1:1',
    recommendedResolution: '256 × 256 px or SVG',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP', 'SVG'],
    required: true,
  },
]

export const TOURNAMENT_ARTWORK_ROLES: ArtworkRoleDefinition[] = [
  {
    id: 'tournament.listing_card',
    entityType: 'tournament',
    slotKey: 'card',
    name: 'Tournament Listing Card',
    frontendPlacement: 'Tournament Listings (/tournaments)',
    description: 'Primary banner displayed on tournament listing cards across /tournaments.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: true,
  },
  {
    id: 'tournament.detail_hero',
    entityType: 'tournament',
    slotKey: 'hero',
    name: 'Tournament Detail Hero',
    frontendPlacement: 'Tournament Detail Page Header (/tournaments/:id)',
    description: 'Immersive panoramic hero background banner on the individual tournament detail page.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: true,
  },
  {
    id: 'tournament.homepage_featured',
    entityType: 'tournament',
    slotKey: 'featured_banner',
    name: 'Homepage Featured Tournament',
    frontendPlacement: 'Homepage Featured Tournament Spotlight',
    description: 'Centerpiece lead banner rendered on the homepage when this tournament is marked as featured.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: false,
  },
  {
    id: 'tournament.also_on_circuit',
    entityType: 'tournament',
    slotKey: 'also_on_circuit',
    name: 'Also on the Circuit Card',
    frontendPlacement: "Homepage 'Also on the Circuit' Secondary Listings",
    description: 'Secondary tournament card artwork on the homepage circuit list beside the featured tournament.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: false,
  },
  {
    id: 'tournament.upcoming_card',
    entityType: 'tournament',
    slotKey: 'upcoming_card',
    name: 'Upcoming Tournament Card',
    frontendPlacement: 'Homepage Upcoming Tournaments Slider Grid',
    description: 'Card banner displayed in the upcoming tournaments slider section on the homepage.',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    required: false,
  },
  {
    id: 'tournament.logo',
    entityType: 'tournament',
    slotKey: 'logo',
    name: 'Tournament Crest / Icon',
    frontendPlacement: 'Match Brackets & Tournament Headers',
    description: 'Square crest or logo used in brackets, match cards, and registration badges.',
    aspectRatio: '1:1',
    recommendedResolution: '256 × 256 px or SVG',
    acceptedFormats: ['PNG', 'JPEG', 'WEBP', 'SVG'],
    required: false,
  },
]

export const ALL_ARTWORK_ROLES = [...GAME_ARTWORK_ROLES, ...TOURNAMENT_ARTWORK_ROLES]

export function getArtworkRole(roleIdOrSlot: string): ArtworkRoleDefinition | undefined {
  return ALL_ARTWORK_ROLES.find(
    (r) => r.id === roleIdOrSlot || r.slotKey === roleIdOrSlot
  )
}

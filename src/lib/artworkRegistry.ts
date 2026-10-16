export interface SafeAreaGuide {
  topPercent: number
  bottomPercent: number
  description: string
}

export interface ArtworkRoleDefinition {
  id: string
  entityType: 'game' | 'tournament'
  slotKey: string
  name: string
  frontendPlacement: string
  description: string

  // Ratio Policy
  ratioPolicy: 'fixed' | 'flexible' | 'range'
  aspectRatio: string
  targetRatioValue?: number
  minRatio?: number
  maxRatio?: number

  // Dimensions
  recommendedResolution: string
  recommendedWidth: number
  recommendedHeight: number
  minWidth: number
  minHeight: number

  // Formats & Size
  acceptedFormats: string[]
  maxSizeBytes: number
  maxSizeLabel: string

  // Transparency & Fitting
  transparency: 'required' | 'supported' | 'not_recommended'
  transparencyNotice?: string
  defaultFitMode: 'cover' | 'contain' | 'ambient'
  allowedFitModes: ('cover' | 'contain' | 'ambient')[]
  allowCrop: boolean
  allowFocalPoint: boolean
  allowZoom: boolean

  // Preview & Safety
  previewType: 'hero_shard' | 'game_card' | 'tournament_card' | 'showcase_card' | 'banner' | 'square'
  safeAreaGuide?: SafeAreaGuide

  required?: boolean
}

export const GAME_ARTWORK_ROLES: ArtworkRoleDefinition[] = [
  {
    id: 'game.homepage_hero_floating',
    entityType: 'game',
    slotKey: 'homepage_hero_floating',
    name: 'Homepage Hero Floating Artwork',
    frontendPlacement: 'Homepage Hero Floating Panels (Desktop)',
    description:
      'Floating character or game artwork orbiting behind the central hero heading on the homepage. Transparent PNG or WebP supported to preserve full silhouette without boxy rectangular clipping.',
    ratioPolicy: 'flexible',
    aspectRatio: 'Flexible (1:1, 4:5, 3:4, 4:3)',
    targetRatioValue: 1.0,
    minRatio: 0.7,
    maxRatio: 1.55,
    recommendedResolution: '1000 × 1000 px (or 800–1200 px square/portrait)',
    recommendedWidth: 1000,
    recommendedHeight: 1000,
    minWidth: 400,
    minHeight: 400,
    acceptedFormats: ['PNG', 'WEBP', 'JPEG'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'supported',
    transparencyNotice:
      'Transparent PNG or WebP recommended. Transparent backgrounds preserve the full subject floating above the 3D hero without boxy clipping.',
    defaultFitMode: 'contain',
    allowedFitModes: ['contain', 'cover', 'ambient'],
    allowCrop: false,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'hero_shard',
    required: false,
  },
  {
    id: 'game.active_catalog_card',
    entityType: 'game',
    slotKey: 'catalog_card',
    name: 'Active Games Catalog Card',
    frontendPlacement: 'Active Games Catalog (/games) & Active Games Lists',
    description:
      'Primary 4:5 portrait card artwork for the Active Games catalog grid (/games) and active games lists. Subject is centered with safe areas for top HUD and bottom title.',
    ratioPolicy: 'fixed',
    aspectRatio: '4:5',
    targetRatioValue: 0.8,
    recommendedResolution: '960 × 1200 px (4:5 Portrait)',
    recommendedWidth: 960,
    recommendedHeight: 1200,
    minWidth: 600,
    minHeight: 750,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'game_card',
    safeAreaGuide: {
      topPercent: 15,
      bottomPercent: 25,
      description:
        'Keep focal subject clear of top genre badge and bottom title/platform HUD.',
    },
    required: true,
  },
  {
    id: 'game.coming_soon_catalog_card',
    entityType: 'game',
    slotKey: 'coming_soon_catalog_card',
    name: 'Coming Soon Games Catalog Card',
    frontendPlacement: 'Coming Soon Games (/games)',
    description:
      '4:5 portrait artwork for locked worlds before official platform launch. Automatically transitions to active artwork upon release.',
    ratioPolicy: 'fixed',
    aspectRatio: '4:5',
    targetRatioValue: 0.8,
    recommendedResolution: '960 × 1200 px (4:5 Portrait)',
    recommendedWidth: 960,
    recommendedHeight: 1200,
    minWidth: 600,
    minHeight: 750,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'game_card',
    safeAreaGuide: {
      topPercent: 15,
      bottomPercent: 25,
      description:
        'Keep focal subject clear of top status badge and bottom title text.',
    },
    required: false,
  },
  {
    id: 'game.detail_banner',
    entityType: 'game',
    slotKey: 'banner',
    name: 'Game Detail Header Banner',
    frontendPlacement: 'Game Detail Page Header (/games/:slug)',
    description:
      'High-resolution panoramic banner displayed as the hero header on the individual game overview page (/games/:slug). Ambient mode preserves full-bleed width with clear text legibility on left.',
    ratioPolicy: 'fixed',
    aspectRatio: '16:9 to 21:9 Widescreen',
    targetRatioValue: 16 / 9,
    minRatio: 1.6,
    maxRatio: 2.4,
    recommendedResolution: '2560 × 1440 px (16:9) or 2560 × 1080 px (21:9)',
    recommendedWidth: 2560,
    recommendedHeight: 1440,
    minWidth: 1600,
    minHeight: 900,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'ambient',
    allowedFitModes: ['ambient', 'cover', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'banner',
    safeAreaGuide: {
      topPercent: 15,
      bottomPercent: 30,
      description:
        'Key subject best positioned toward center-right (Focal X: 70–80%) to avoid game overview typography on the left.',
    },
    required: true,
  },
  {
    id: 'game.showcase_card',
    entityType: 'game',
    slotKey: 'showcase_card',
    name: 'Homepage Game Showcase Card',
    frontendPlacement: 'Homepage Game Showcase ("8 Games. One Arena.")',
    description:
      'Vertical 3:4 portrait card artwork for the Homepage Game Showcase section ("8 Games. One Arena."). Staggered 420px height cards with bottom title and "Enter world →" CTA.',
    ratioPolicy: 'fixed',
    aspectRatio: '3:4',
    targetRatioValue: 0.75,
    recommendedResolution: '900 × 1200 px (3:4 Portrait)',
    recommendedWidth: 900,
    recommendedHeight: 1200,
    minWidth: 600,
    minHeight: 800,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'showcase_card',
    safeAreaGuide: {
      topPercent: 10,
      bottomPercent: 35,
      description:
        'Bottom 35% contains game title, description, and "Enter world →" CTA button.',
    },
    required: false,
  },
  {
    id: 'game.logo',
    entityType: 'game',
    slotKey: 'logo',
    name: 'Game Emblem / Icon',
    frontendPlacement: 'Tournament Game Badges, Selectors, Match Headers',
    description:
      'Square game emblem or SVG vector icon used across tournament crests, bracket nodes, and game selectors.',
    ratioPolicy: 'fixed',
    aspectRatio: '1:1',
    targetRatioValue: 1.0,
    recommendedResolution: '256 × 256 px or SVG',
    recommendedWidth: 256,
    recommendedHeight: 256,
    minWidth: 64,
    minHeight: 64,
    acceptedFormats: ['PNG', 'WEBP', 'SVG', 'JPEG'],
    maxSizeBytes: 5 * 1024 * 1024,
    maxSizeLabel: '5 MB',
    transparency: 'supported',
    transparencyNotice:
      'Transparent PNG or SVG vector format recommended for clean scaling on dark panels.',
    defaultFitMode: 'contain',
    allowedFitModes: ['contain', 'cover'],
    allowCrop: false,
    allowFocalPoint: false,
    allowZoom: false,
    previewType: 'square',
    required: true,
  },
]

export const TOURNAMENT_ARTWORK_ROLES: ArtworkRoleDefinition[] = [
  {
    id: 'tournament.listing_card',
    entityType: 'tournament',
    slotKey: 'card',
    name: 'Tournament Listing Card',
    frontendPlacement: 'Tournament Listings (/tournaments) & Cards',
    description:
      'Primary landscape card banner displayed on tournament cards across /tournaments. 16:9 ratio with prize, entry fee, and registration status overlays.',
    ratioPolicy: 'fixed',
    aspectRatio: '16:9',
    targetRatioValue: 16 / 9,
    recommendedResolution: '1920 × 1080 px (16:9)',
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    minWidth: 960,
    minHeight: 540,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'tournament_card',
    safeAreaGuide: {
      topPercent: 18,
      bottomPercent: 20,
      description:
        'Top corners contain registration status badges and game tag. Keep key logo/action centered.',
    },
    required: true,
  },
  {
    id: 'tournament.detail_hero',
    entityType: 'tournament',
    slotKey: 'hero',
    name: 'Tournament Detail Hero',
    frontendPlacement: 'Tournament Detail Page Header (/tournaments/:id)',
    description:
      'Immersive panoramic hero background banner on the tournament detail page. High-density resolution ensures crisp visuals across large displays.',
    ratioPolicy: 'fixed',
    aspectRatio: '16:9 to 21:9 Widescreen',
    targetRatioValue: 16 / 9,
    minRatio: 1.6,
    maxRatio: 2.4,
    recommendedResolution: '2560 × 1440 px (16:9) or 2560 × 1080 px (21:9)',
    recommendedWidth: 2560,
    recommendedHeight: 1440,
    minWidth: 1600,
    minHeight: 900,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'banner',
    safeAreaGuide: {
      topPercent: 20,
      bottomPercent: 30,
      description:
        'Left and bottom areas contain tournament title, date, and prize details.',
    },
    required: true,
  },
  {
    id: 'tournament.homepage_featured',
    entityType: 'tournament',
    slotKey: 'featured_banner',
    name: 'Homepage Featured Tournament',
    frontendPlacement: 'Homepage Featured Tournament Spotlight',
    description:
      'Centerpiece lead banner rendered on the homepage when this tournament is marked as featured.',
    ratioPolicy: 'fixed',
    aspectRatio: '16:9',
    targetRatioValue: 16 / 9,
    recommendedResolution: '1920 × 1080 px (16:9)',
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    minWidth: 1280,
    minHeight: 720,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'ambient',
    allowedFitModes: ['ambient', 'cover', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'banner',
    required: false,
  },
  {
    id: 'tournament.also_on_circuit',
    entityType: 'tournament',
    slotKey: 'also_on_circuit',
    name: 'Also on the Circuit Card',
    frontendPlacement: "Homepage 'Also on the Circuit' Secondary Listings",
    description:
      'Secondary tournament card artwork on the homepage circuit list beside the featured tournament.',
    ratioPolicy: 'fixed',
    aspectRatio: '16:9',
    targetRatioValue: 16 / 9,
    recommendedResolution: '1280 × 720 px (16:9)',
    recommendedWidth: 1280,
    recommendedHeight: 720,
    minWidth: 640,
    minHeight: 360,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'tournament_card',
    required: false,
  },
  {
    id: 'tournament.upcoming_card',
    entityType: 'tournament',
    slotKey: 'upcoming_card',
    name: 'Upcoming Tournament Card',
    frontendPlacement: 'Homepage Upcoming Tournaments Slider Grid',
    description:
      'Card banner displayed in the upcoming tournaments slider section on the homepage.',
    ratioPolicy: 'fixed',
    aspectRatio: '16:9',
    targetRatioValue: 16 / 9,
    recommendedResolution: '1280 × 720 px (16:9)',
    recommendedWidth: 1280,
    recommendedHeight: 720,
    minWidth: 640,
    minHeight: 360,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    transparency: 'not_recommended',
    defaultFitMode: 'cover',
    allowedFitModes: ['cover', 'ambient', 'contain'],
    allowCrop: true,
    allowFocalPoint: true,
    allowZoom: true,
    previewType: 'tournament_card',
    required: false,
  },
  {
    id: 'tournament.logo',
    entityType: 'tournament',
    slotKey: 'logo',
    name: 'Tournament Crest / Icon',
    frontendPlacement: 'Match Brackets & Tournament Headers',
    description:
      'Square crest or logo used in brackets, match cards, and registration badges.',
    ratioPolicy: 'fixed',
    aspectRatio: '1:1',
    targetRatioValue: 1.0,
    recommendedResolution: '256 × 256 px or SVG',
    recommendedWidth: 256,
    recommendedHeight: 256,
    minWidth: 64,
    minHeight: 64,
    acceptedFormats: ['PNG', 'JPEG', 'WEBP', 'SVG'],
    maxSizeBytes: 5 * 1024 * 1024,
    maxSizeLabel: '5 MB',
    transparency: 'supported',
    transparencyNotice:
      'Transparent PNG or SVG vector format recommended for clean scaling on dark panels.',
    defaultFitMode: 'contain',
    allowedFitModes: ['contain', 'cover'],
    allowCrop: false,
    allowFocalPoint: false,
    allowZoom: false,
    previewType: 'square',
    required: false,
  },
]

export const ALL_ARTWORK_ROLES = [
  ...GAME_ARTWORK_ROLES,
  ...TOURNAMENT_ARTWORK_ROLES,
]

export function getArtworkRole(
  roleIdOrSlot: string
): ArtworkRoleDefinition | undefined {
  return ALL_ARTWORK_ROLES.find(
    (r) => r.id === roleIdOrSlot || r.slotKey === roleIdOrSlot
  )
}

export function getGameArtworkRole(
  slotKey: string
): ArtworkRoleDefinition | undefined {
  return GAME_ARTWORK_ROLES.find((r) => r.slotKey === slotKey || r.id === slotKey)
}

export function getTournamentArtworkRole(
  slotKey: string
): ArtworkRoleDefinition | undefined {
  return TOURNAMENT_ARTWORK_ROLES.find(
    (r) => r.slotKey === slotKey || r.id === slotKey
  )
}

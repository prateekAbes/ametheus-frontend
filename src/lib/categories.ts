import { Game as ApiGame, NormalizedGame, normalizeGame } from '../services/games'
import { CATALOG, CatalogGame, gameBy } from './data'

export interface GameCategory {
  name: string
  slug: string
  games: NormalizedGame[]
  images: string[]
  accent: string
  description?: string
}

const CATEGORY_NAMES: Record<string, string> = {
  'battle-royale': 'Battle Royale',
  'tactical-fps': 'Tactical FPS',
  fps: 'First-Person Shooter',
  moba: 'MOBA',
  strategy: 'Strategy',
  sports: 'Sports & Racing',
  'vehicle-sports': 'Vehicle Sports',
  'arena-brawler': 'Arena Brawler',
  '2d-shooter': '2D Shooter',
  'kart-battle': 'Kart Battle',
  pc: 'PC Esports',
  mobile: 'Mobile Esports',
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'battle-royale': 'High-stakes survival combat. Drop in, loot up, and fight to be the last squad standing.',
  'tactical-fps': 'Precision gunplay, agent utility, and strategic round-based defusal competition.',
  fps: 'Fast-paced, responsive arena and objective-based competitive shooters.',
  moba: 'Team strategy, lane control, and calculated objective skirmishes on dynamic maps.',
  strategy: 'Tactical positioning, resource management, and turn-based intellectual mastery.',
  sports: 'High-speed virtual athletics, vehicular competition, and precision timing.',
  'vehicle-sports': 'Rocket-powered physics, aerial mechanics, and dynamic vehicle competition.',
  'arena-brawler': 'Close-quarters combat, squad synergy, and chaotic arena skirmishes.',
}

export function slugifyCategory(category?: string): string {
  if (!category) return 'esports'
  const clean = category.toLowerCase().trim()
  return clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'esports'
}

export function formatCategoryName(category?: string): string {
  if (!category) return 'Competitive Esports'
  const slug = slugifyCategory(category)
  if (CATEGORY_NAMES[slug]) return CATEGORY_NAMES[slug]

  // Title case fallback
  return category
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function groupGamesByCategory(
  games: ApiGame[],
  catalogFallback: CatalogGame[] = CATALOG
): GameCategory[] {
  const categoryMap = new Map<string, GameCategory>()

  // Process live API games first
  const normalizedApiGames = games.map((g) => normalizeGame(g))

  // If no API games, convert active catalog games
  const pool: NormalizedGame[] =
    normalizedApiGames.length > 0
      ? normalizedApiGames
      : catalogFallback.map((cg) => {
          const fallback = gameBy(cg.slug)
          return {
            id: cg.slug,
            slug: cg.slug,
            name: cg.name,
            category: cg.genre,
            platform: cg.platform,
            tag: cg.short,
            isTeamGame: true,
            minTeamSize: 1,
            maxTeamSize: 5,
            maxSubstitutes: 1,
            entryFeeInr: 0,
            prizePoolInr: 0,
            bannerUrl: cg.photo || fallback.photo,
            logoUrl: '',
            description: '',
            serverRegion: 'India',
            antiCheat: 'Server Anti-Cheat',
            matchProtocol: 'Standard Competitive',
            accentColor: cg.accent,
            status: cg.status,
            heroMediaEnabled: false,
            gallery: [],
          }
        })

  for (const g of pool) {
    const rawCat = g.category || 'Competitive'
    const slug = slugifyCategory(rawCat)
    const name = formatCategoryName(rawCat)

    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        name,
        slug,
        games: [],
        images: [],
        accent: g.accentColor || '#3ef2ff',
        description: CATEGORY_DESCRIPTIONS[slug] || `Competitive ladders and verified tournaments for ${name} titles.`,
      })
    }

    const cat = categoryMap.get(slug)!
    cat.games.push(g)

    const imgUrl = g.bannerUrl || gameBy(g.slug).photo
    if (imgUrl && !cat.images.includes(imgUrl)) {
      cat.images.push(imgUrl)
    }
  }

  // Ensure every category has at least one image
  for (const cat of categoryMap.values()) {
    if (cat.images.length === 0) {
      cat.images.push('1542751371-adc38448a05e')
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.games.length - a.games.length)
}

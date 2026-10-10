export const img = (id?: string, w = 800) => {
  if (!id) return ''
  if (id.startsWith('http://') || id.startsWith('https://') || id.startsWith('/') || id.startsWith('data:')) return id
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=75&fit=crop&auto=format`
}

export type Game = { slug: string; short: string; name: string; genre: string; squad: string; size: number; platform: string; accent: string; photo?: string; line: string; desc: string; live: number }
export const GAMES: Game[] = [
  { slug: 'bgmi', short: 'BGMI', name: 'BGMI', genre: 'Battle Royale', squad: '4 Player Squad', size: 4, platform: 'Mobile', accent: '#ffb547', photo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop', line: 'Drop. Loot. Last squad standing.', desc: "India's most played battle royale. 64 squads, one shrinking zone, and a points system that rewards both placement and aggression.", live: 14 },
  { slug: 'valorant', short: 'VALORANT', name: 'Valorant', genre: 'Tactical FPS', squad: '5 Player Team', size: 5, platform: 'PC', accent: '#ff4655', photo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop', line: 'Precision is the only currency.', desc: 'Five-versus-five tactical shooter. Agents, abilities and first-to-13 rounds decided by aim, utility and nerve.', live: 9 },
  { slug: 'free-fire', short: 'FREE FIRE', name: 'Free Fire', genre: 'Battle Royale', squad: '4 Player Squad', size: 4, platform: 'Mobile', accent: '#ff7a1a', photo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop', line: 'Ten minutes. Fifty survivors. One flame.', desc: 'Fast, frantic ten-minute battle royale built for mobile. Short rounds, character skills, relentless pace.', live: 11 },
  { slug: 'codm', short: 'CODM', name: 'COD Mobile', genre: 'FPS', squad: '5 Player Team', size: 5, platform: 'Mobile', accent: '#2fe6b0', photo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop', line: 'Tactical. Relentless. In your pocket.', desc: 'Call of Duty on mobile. Hardpoint, Search & Destroy and Control in a best-of-five ranked format.', live: 7 },
]
export const COMING = ['CS2', 'Rocket League', 'Chess', 'Clash Royale', 'Brawl Stars', 'League of Legends', 'Smash Karts', 'Mini Militia']
export const gameBy = (key?: string) => {
  if (!key) return GAMES[0]
  const clean = key.toLowerCase().trim()
  return (
    GAMES.find(
      (g) =>
        g.slug.toLowerCase() === clean ||
        g.short.toLowerCase() === clean ||
        g.name.toLowerCase() === clean ||
        clean.includes(g.slug.toLowerCase()) ||
        clean.includes(g.name.toLowerCase())
    ) ?? GAMES[0]
  )
}

export type TStatus = 'open' | 'upcoming' | 'live' | 'completed' | 'cancelled'
export type Tournament = { id: string; game: string; name: string; prize: number; entry: number; status: TStatus; date: string; teams: number; max: number; region: string; format: string; isRegistered?: boolean; banner_url?: string; bannerUrl?: string; logo_url?: string; logoUrl?: string }
export const TOURNAMENTS: Tournament[] = [
  { id: 'bgmi-monsoon-cup', game: 'bgmi', name: 'Monsoon Cup S2', prize: 50000, entry: 100, status: 'open', date: '12 Oct 2026', teams: 48, max: 64, region: 'India', format: '6 Maps · TPP' },
  { id: 'val-ascent-series', game: 'valorant', name: 'Ascent Series', prize: 75000, entry: 250, status: 'open', date: '18 Oct 2026', teams: 22, max: 32, region: 'India / South Asia', format: 'Single Elim · BO3' },
  { id: 'ff-inferno-league', game: 'free-fire', name: 'Inferno League', prize: 30000, entry: 50, status: 'live', date: '04 Oct 2026', teams: 48, max: 48, region: 'India', format: 'League · 12 Rounds' },
  { id: 'codm-frontline', game: 'codm', name: 'Frontline Clash', prize: 40000, entry: 150, status: 'upcoming', date: '26 Oct 2026', teams: 9, max: 16, region: 'India', format: 'Double Elim · BO5' },
  { id: 'bgmi-erangel-open', game: 'bgmi', name: 'Erangel Open', prize: 10000, entry: 50, status: 'open', date: '15 Oct 2026', teams: 24, max: 25, region: 'North India', format: '4 Maps · TPP' },
  { id: 'val-night-ops', game: 'valorant', name: 'Night Ops Weekly #14', prize: 15000, entry: 0, status: 'upcoming', date: '09 Nov 2026', teams: 4, max: 16, region: 'India', format: 'Swiss · BO1' },
  { id: 'ff-campus-wars', game: 'free-fire', name: 'Campus Wars', prize: 25000, entry: 80, status: 'completed', date: '21 Sep 2026', teams: 48, max: 48, region: 'India', format: 'League · 8 Rounds' },
  { id: 'codm-blackout', game: 'codm', name: 'Blackout Invitational', prize: 60000, entry: 200, status: 'cancelled', date: '14 Sep 2026', teams: 6, max: 16, region: 'India', format: 'Single Elim · BO5' },
]
export const tourBy = (id: string) => TOURNAMENTS.find((t) => t.id === id) ?? TOURNAMENTS[0]

export type MStatus = 'upcoming' | 'live' | 'completed'
export type Match = { id: string; tour: string; game: string; no: number; round: string; a: string; b: string; date: string; time: string; status: MStatus; score?: [number, number]; format: string }
export const MATCHES: Match[] = [
  { id: 'm-1042', tour: 'ff-inferno-league', game: 'free-fire', no: 7, round: 'League Round 7', a: 'Team Alpha', b: 'Team Omega', date: 'Today', time: '19:00 IST', status: 'live', score: [1, 0], format: 'BO3' },
  { id: 'm-1043', tour: 'val-ascent-series', game: 'valorant', no: 12, round: 'Quarterfinal', a: 'Kraken Esports', b: 'Night Wolves', date: 'Today', time: '20:30 IST', status: 'live', score: [9, 7], format: 'BO3' },
  { id: 'm-1050', tour: 'bgmi-monsoon-cup', game: 'bgmi', no: 1, round: 'Qualifier A', a: 'Team Alpha', b: 'Vanguard 7', date: '12 Oct', time: '18:00 IST', status: 'upcoming', format: 'Map 1–3' },
  { id: 'm-1051', tour: 'codm-frontline', game: 'codm', no: 3, round: 'Upper Bracket R1', a: 'Ghost Protocol', b: 'Iron Saints', date: '26 Oct', time: '17:00 IST', status: 'upcoming', format: 'BO5' },
  { id: 'm-1052', tour: 'val-ascent-series', game: 'valorant', no: 13, round: 'Quarterfinal', a: 'Team Alpha', b: 'Raptor Gaming', date: '19 Oct', time: '21:00 IST', status: 'upcoming', format: 'BO3' },
  { id: 'm-0998', tour: 'ff-campus-wars', game: 'free-fire', no: 8, round: 'Grand Final', a: 'Saffron Storm', b: 'Team Alpha', date: '21 Sep', time: '20:00 IST', status: 'completed', score: [2, 1], format: 'BO3' },
  { id: 'm-0991', tour: 'ff-campus-wars', game: 'free-fire', no: 6, round: 'Semifinal', a: 'Team Alpha', b: 'Neon Riders', date: '20 Sep', time: '19:00 IST', status: 'completed', score: [2, 0], format: 'BO3' },
]
export const matchBy = (id: string) => MATCHES.find((m) => m.id === id) ?? MATCHES[0]

export const TEAMS = ['Team Alpha', 'Team Omega', 'Kraken Esports', 'Night Wolves', 'Vanguard 7', 'Ghost Protocol', 'Iron Saints', 'Raptor Gaming', 'Saffron Storm', 'Neon Riders', 'Hydra X', 'Velocity']

export const AVATARS = ['1610041321420-a596dd14ebc9', '1597938430467-c7a5f65c24f2', '1559969143-b2defc6419fd', '1570341395883-6a8e5a601d93', '1758410473603-616660032c2a']
export const ME = { username: 'VYRUS', name: 'Arjun Mehta', uid: '5123 8841 02', joined: 'Mar 2026', city: 'Bengaluru', avatar: AVATARS[0], balance: 2450 }
export const SQUAD = [
  { u: 'VYRUS', role: 'Captain · IGL', uid: '5123884102', av: AVATARS[0] },
  { u: 'KAALI.X', role: 'Fragger', uid: '5198203311', av: AVATARS[1] },
  { u: 'ZER0DAY', role: 'Support', uid: '5144092276', av: AVATARS[2] },
  { u: 'NEONRANI', role: 'Sniper', uid: '5170551840', av: AVATARS[3] },
  { u: 'BHAIJAAN', role: 'Substitute', uid: '5101276654', av: AVATARS[4] },
]

export type TxType = 'Wallet Deposit' | 'Tournament Entry' | 'Refund' | 'Winnings' | 'Withdrawal'
export type Tx = { id: string; date: string; type: TxType; amount: number; status: 'Success' | 'Pending' | 'Failed'; note: string }
export const TXS: Tx[] = [
  { id: 'TXN-88A21F', date: '01 Oct 2026', type: 'Tournament Entry', amount: -100, status: 'Success', note: 'BGMI · Monsoon Cup S2' },
  { id: 'TXN-88A1C9', date: '30 Sep 2026', type: 'Wallet Deposit', amount: 1000, status: 'Success', note: 'UPI · ****@okhdfc' },
  { id: 'TXN-8893E0', date: '24 Sep 2026', type: 'Winnings', amount: 2500, status: 'Success', note: 'Free Fire · Campus Wars — 2nd' },
  { id: 'TXN-8890B4', date: '22 Sep 2026', type: 'Withdrawal', amount: -1500, status: 'Pending', note: 'To bank ****4410' },
  { id: 'TXN-887F12', date: '15 Sep 2026', type: 'Refund', amount: 200, status: 'Success', note: 'CODM · Blackout Invitational (cancelled)' },
  { id: 'TXN-887A03', date: '12 Sep 2026', type: 'Tournament Entry', amount: -200, status: 'Success', note: 'CODM · Blackout Invitational' },
  { id: 'TXN-8869DD', date: '05 Sep 2026', type: 'Wallet Deposit', amount: 500, status: 'Failed', note: 'Card ****9012' },
]

export const inr = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN')

/* ---------- dynamic content collections ---------- */

/** Long-name case: layouts must hold for both "BGMI CUP" and this. */
TOURNAMENTS.push({ id: 'bgmi-national-series', game: 'bgmi', name: 'AMETHEUS India National BGMI Championship Series', prize: 200000, entry: 300, status: 'upcoming', date: '30 Nov 2026', teams: 112, max: 256, region: 'India', format: 'Multi-stage · TPP' })

/** IDs of tournaments the homepage features. Order = display order; any length works. */
export const FEATURED_IDS = ['val-ascent-series', 'bgmi-monsoon-cup', 'ff-inferno-league', 'bgmi-national-series']
export const featured = () => FEATURED_IDS.map((id) => TOURNAMENTS.find((t) => t.id === id)).filter(Boolean) as Tournament[]

/** Full game catalog — active worlds + locked ones. New games are appended here; every grid adapts. */
export type CatalogGame = { slug: string; short: string; name: string; genre: string; platform: string; accent: string; photo?: string; status: 'active' | 'soon'; tournaments: number }
const SOON_META: Record<string, [string, string, string]> = {
  CS2: ['Tactical FPS', 'PC', '#f5a524'],
  'Rocket League': ['Vehicle Sports', 'PC · Console', '#2f8cff'],
  Chess: ['Strategy', 'Web · Mobile', '#d9d9d9'],
  'Clash Royale': ['Strategy', 'Mobile', '#4fa3ff'],
  'Brawl Stars': ['Arena Brawler', 'Mobile', '#ffcc00'],
  'League of Legends': ['MOBA', 'PC', '#c8aa6e'],
  'Smash Karts': ['Kart Battle', 'Web', '#ff5ca8'],
  'Mini Militia': ['2D Shooter', 'Mobile', '#7bd94b'],
}
export const CATALOG: CatalogGame[] = [
  ...GAMES.map((g) => ({ slug: g.slug, short: g.short, name: g.name, genre: g.genre, platform: g.platform, accent: g.accent, photo: g.photo, status: 'active' as const, tournaments: TOURNAMENTS.filter((t) => t.game === g.slug).length })),
  ...COMING.map((n) => ({ slug: n.toLowerCase().replace(/\s+/g, '-'), short: n.toUpperCase(), name: n, genre: SOON_META[n]?.[0] ?? 'Esports', platform: SOON_META[n]?.[1] ?? 'Multi-platform', accent: SOON_META[n]?.[2] ?? '#8b5cff', status: 'soon' as const, tournaments: 0 })),
]

/** Hero campaigns. Each slide may carry an image, a looping video (with poster), and its own copy/CTAs. */
export type HeroSlide = { id: string; kicker: string; title: string; tagline: string; sub: string; photo?: string; video?: string; accent: string; cta: [string, string]; cta2?: [string, string]; games?: string[] }
export const HERO_SLIDES: HeroSlide[] = [
  { id: 'platform', kicker: 'System online · Welcome to Ametheus', title: 'AMETHEUS', tagline: "India's Gaming Battleground", sub: 'A premium esports platform where players discover games, build teams, enter tournaments, and compete.', photo: '', accent: '#8b5cff', cta: ['Explore Tournaments', '/tournaments'], cta2: ['Explore Games', '/games'], games: ['bgmi', 'valorant', 'free-fire', 'codm'] },
  { id: 'national', kicker: 'Campaign · Registrations open', title: 'NATIONALS', tagline: 'BGMI Championship Series', sub: '256 squads. ₹2,00,000 prize pool. The biggest BGMI event on Ametheus this season.', photo: '', accent: '#ffb547', cta: ['Register Your Squad', '/tournaments/bgmi-national-series'], cta2: ['View BGMI', '/games/bgmi'], games: ['bgmi'] },
  { id: 'ascent', kicker: 'Valorant · Single elimination', title: 'ASCENT', tagline: 'Ascent Series · ₹75,000', sub: 'Thirty-two teams, best-of-three, one champion. Five-stack required.', photo: '', accent: '#ff4655', cta: ['Enter Ascent', '/tournaments/val-ascent-series'], cta2: ['All tournaments', '/tournaments'], games: ['valorant'] },
]

export type Announcement = { id: string; tag: string; title: string; body: string; date: string; to: string; photo?: string }
export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', tag: 'Platform', title: 'Instant UPI withdrawals are live', body: 'Winnings now land in your bank in under two minutes.', date: '29 Sep', to: '/wallet' },
  { id: 'a2', tag: 'BGMI', title: 'Nationals qualifier format announced', body: 'Four online stages leading to a 16-squad grand final.', date: '27 Sep', to: '/tournaments/bgmi-national-series', photo: '' },
  { id: 'a3', tag: 'Coming soon', title: 'CS2 and Chess unlock in November', body: 'Pre-register your team to get first access to opening cups.', date: '22 Sep', to: '/games' },
]

/* ---------- tournament microsite content (all optional; page derives sensible defaults) ---------- */
export type Stage = { name: string; date: string; time?: string }
export type TourExtra = { tagline?: string; about?: string; split?: number[]; stages?: Stage[]; stream?: string; champion?: string }
export const TOUR_EXTRA: Record<string, TourExtra> = {
  'bgmi-national-series': { tagline: "India's next battleground", about: 'Four online stages, one LAN-grade grand final. The biggest BGMI event on AMETHEUS this season, open to every verified squad in the country.', split: [0.5, 0.25, 0.15, 0.1], stages: [{ name: 'Registration', date: '01 Oct', time: '10:00 IST' }, { name: 'Qualifiers', date: '08 Nov', time: '16:00 IST' }, { name: 'Semifinal', date: '22 Nov', time: '17:00 IST' }, { name: 'Grand Final', date: '30 Nov', time: '18:00 IST' }] },
  'bgmi-monsoon-cup': { tagline: 'Drop in. Rain down.', split: [0.5, 0.3, 0.2] },
  'val-ascent-series': { tagline: 'Precision is the only currency.', split: [0.6, 0.25, 0.15] },
  'ff-inferno-league': { tagline: 'Twelve rounds. One flame.', stream: 'https://www.youtube.com/@ametheus' },
  'ff-campus-wars': { tagline: 'Campus pride, on the line.', champion: 'Saffron Storm' },
}

/** Deterministic team names for any slot count. */
const PRE = ['Crimson', 'Shadow', 'Iron', 'Neon', 'Storm', 'Phantom', 'Cobalt', 'Venom', 'Solar', 'Rogue', 'Onyx', 'Titan']
const SUF = ['Hawks', 'Legion', 'Syndicate', 'Vipers', 'Order', 'Reapers', 'Collective', 'Spartans']
export const teamNames = (n: number) => Array.from({ length: n }, (_, i) => (i < TEAMS.length ? TEAMS[i] : `${PRE[(i * 5) % PRE.length]} ${SUF[(i * 3) % SUF.length]}${i >= PRE.length * 2 ? ' ' + (i + 1) : ''}`))

/* ---------- homepage hero spotlight ---------- */
/** Swap `HERO_SPOTLIGHT` to change what the hero features. The visual composition never changes. */
export type Spotlight = { kind: 'platform' } | { kind: 'tournament'; id: string } | { kind: 'game'; slug: string }
export const HERO_SPOTLIGHT: Spotlight = { kind: 'platform' }

/** Signed-in account snapshot for the header control center. `team` / `active` may be null. */
export type Account = { handle: string; role: string; team: { name: string; tag: string } | null; tournaments: number; unread: number; active: string | null }
export const ACCOUNT: Account = { handle: 'vyrus', role: 'Player', team: { name: 'Team Alpha', tag: 'TA' }, tournaments: 12, unread: 3, active: 'ff-inferno-league' }

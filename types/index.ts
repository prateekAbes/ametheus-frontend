export type GameCategory = "all" | "pc" | "mobile" | "crossplay" | "solo";

export interface Game {
  id: string;
  slug: string;
  name: string;
  category: GameCategory;
  platform: string;
  tag: string;
  isTeamGame: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  bannerUrl: string;
  logoUrl: string;
  activePool: string;
  activeTournaments: number;
  upcomingTournaments: number;
  description: string;
  serverRegion: string;
  antiCheat: string;
  matchProtocol: string;
  accentColor?: string;
  status?: string;
  expectedReleaseDate?: string;
  announcementText?: string;
  heroMediaUrl?: string;
  heroMediaType?: string;
  heroMediaEnabled?: boolean;
  gallery?: Array<{ id: string; url: string; caption?: string; order?: number }>;
}

export interface TeamMember {
  userId: string;
  username: string;
  role: "CAPTAIN" | "MEMBER";
  gameId: string;
  riotId?: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface Team {
  id: string;
  gameSlug: string;
  name: string;
  tag: string;
  logoUrl: string;
  inviteCode: string;
  captainUserId: string;
  captainUsername: string;
  members: TeamMember[];
  maxMembers: number;
  createdAt: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  teamA?: {
    name?: string;
    tag?: string;
    score?: number;
    seed?: number;
    isWinner?: boolean;
  };
  teamB?: {
    name?: string;
    tag?: string;
    score?: number;
    seed?: number;
    isWinner?: boolean;
  };
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | string;
  scheduledTime?: string;
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface Tournament {
  id: string;
  slug: string;
  title: string;
  gameSlug: string;
  gameName: string;
  prizePool: string;
  prizePoolNum: number;
  entryFee: string;
  entryFeeNum: number;
  status: "COMING_SOON" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "COMPLETED" | "CANCELLED" | string;
  statusLabel: string;
  startsAt: string;
  rosterLockTime: string;
  serverRegion: string;
  registeredTeams: number;
  maxTeams: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  expectedStartDate?: string;
  registrationOpenDate?: string;
  announcementText?: string;
  rankRequirement: string;
  format?: string;
  tournament_type?: string;
  match_format?: string;
  tournamentType?: string;
  matchFormat?: string;
  series_format?: string;
  seriesFormat?: string;
  has_live_matches?: boolean;
  hasLiveMatches?: boolean;
  live_matches_count?: number;
  liveMatchesCount?: number;
  live_matches?: any[];
  liveMatches?: any[];
  bannerUrl: string;
  badgeColor?: string;
  description: string;
  rules: string[];
  schedule: Array<{ stage: string; time: string; details: string }>;
  prizes: Array<{ rank: string; amount: string; share: string; badge: string }>;
  bracketRounds: BracketRound[];
  registeredRosters: Array<{
    name: string;
    tag: string;
    captain: string;
    members: string[];
    isVerified: boolean;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  tag: string;
  type: "team" | "player";
  gameSlug: string;
  gameName: string;
  captain: string;
  logoUrl: string;
  winRate: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  rating: number;
  earnings: number;
  form: Array<"W" | "L">;
  isVerified: boolean;
  category: "all" | "pc" | "mobile" | "solo";
}

export interface MatchLobbyInfo {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  gameSlug: string;
  gameName: string;
  stage: string;
  format: string;
  matchType?: string;
  match_type?: string;
  seriesFormat?: string;
  series_format?: string;
  youtubeLiveUrl?: string;
  youtube_live_url?: string;
  scheduledTime: string;
  status: "CHECK_IN_OPEN" | "SCHEDULED" | "LIVE" | "PENDING_VERIFICATION" | "DISPUTED" | "COMPLETED" | string;
  teamA: {
    id: string;
    name: string;
    tag: string;
    logoUrl: string;
    score?: number;
    isCheckedIn: boolean;
    roster: Array<{ username: string; gameId: string }>;
  };
  teamB: {
    id: string;
    name: string;
    tag: string;
    logoUrl: string;
    score?: number;
    isCheckedIn: boolean;
    roster: Array<{ username: string; gameId: string }>;
  };
  serverRegion: string;
  lobbyCode?: string;
  lobbyPassword?: string;
  joinInfoEnabled?: boolean;
  joinInfo?: Record<string, string>;
  matchMessage?: string;
  disputeNotes?: string;
  evidenceUrl?: string;
  scheduledAt?: string;
  liveLink?: string;
  order?: number;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: "SUPER_ADMIN" | "ORGANIZER" | "PLAYER";
  action: string;
  target: string;
  ipAddress: string;
}

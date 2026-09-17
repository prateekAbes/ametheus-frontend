/**
 * Game-Specific Squad & Roster Requirements
 * Defines athlete counts per game mode (1 for Chess/FIFA, 3 for Smash Karts, 4 for BGMI/Mini Militia/Free Fire, 5 for Valorant/CS2/CODM).
 */

export interface GameRosterRequirement {
  min: number;
  max: number;
  label: string;
  formatName: string;
  shortBadge: string;
  requiresTeam: boolean;
}

export const GAME_ROSTER_SPECS: Record<string, GameRosterRequirement> = {
  chess: {
    min: 1,
    max: 1,
    label: "1 Player (Solo 1v1 Blitz & Classical)",
    formatName: "Solo 1v1",
    shortBadge: "1P Solo",
    requiresTeam: false,
  },
  "ea-sports-fc": {
    min: 1,
    max: 1,
    label: "1 Player (Solo 1v1)",
    formatName: "Solo 1v1",
    shortBadge: "1P Solo",
    requiresTeam: false,
  },
  fifa: {
    min: 1,
    max: 1,
    label: "1 Player (Solo 1v1)",
    formatName: "Solo 1v1",
    shortBadge: "1P Solo",
    requiresTeam: false,
  },
  "smash-karts": {
    min: 3,
    max: 3,
    label: "3 Players (Trio Arena)",
    formatName: "Trio (3-Player Squad)",
    shortBadge: "3P Trio",
    requiresTeam: true,
  },
  bgmi: {
    min: 4,
    max: 4,
    label: "4 Players (Full Squad Battle Royale)",
    formatName: "Squad (4 Players)",
    shortBadge: "4P Squad",
    requiresTeam: true,
  },
  "mini-militia": {
    min: 4,
    max: 4,
    label: "4 Players (4v4 Combat Squad)",
    formatName: "Squad (4 Players)",
    shortBadge: "4P Squad",
    requiresTeam: true,
  },
  "free-fire-max": {
    min: 4,
    max: 4,
    label: "4 Players (Battle Royale Squad)",
    formatName: "Squad (4 Players)",
    shortBadge: "4P Squad",
    requiresTeam: true,
  },
  valorant: {
    min: 5,
    max: 5,
    label: "5 Players (Standard 5v5 Lineup)",
    formatName: "Full 5v5 Lineup",
    shortBadge: "5P Lineup",
    requiresTeam: true,
  },
  "counter-strike-2": {
    min: 5,
    max: 5,
    label: "5 Players (Competitive MR12 5v5)",
    formatName: "Full 5v5 Lineup",
    shortBadge: "5P Lineup",
    requiresTeam: true,
  },
  "call-of-duty-mobile": {
    min: 5,
    max: 5,
    label: "5 Players (5v5 Multiplayer)",
    formatName: "Full 5v5 Lineup",
    shortBadge: "5P Lineup",
    requiresTeam: true,
  },
};

export function getGameRosterRequirement(gameSlugOrTitle?: string): GameRosterRequirement {
  if (!gameSlugOrTitle) {
    return {
      min: 4,
      max: 5,
      label: "4-5 Players (Team)",
      formatName: "Squad",
      shortBadge: "Team",
      requiresTeam: true,
    };
  }

  const clean = gameSlugOrTitle.toLowerCase().trim();

  // Direct match
  if (GAME_ROSTER_SPECS[clean]) {
    return GAME_ROSTER_SPECS[clean];
  }

  // Keyword searches
  if (clean.includes("chess")) {
    return GAME_ROSTER_SPECS["chess"];
  }
  if (clean.includes("fc") || clean.includes("fifa")) {
    return GAME_ROSTER_SPECS["ea-sports-fc"];
  }
  if (clean.includes("smash-karts") || clean.includes("smashkarts")) {
    return GAME_ROSTER_SPECS["smash-karts"];
  }
  if (clean.includes("bgmi") || clean.includes("battlegrounds")) {
    return GAME_ROSTER_SPECS["bgmi"];
  }
  if (clean.includes("militia")) {
    return GAME_ROSTER_SPECS["mini-militia"];
  }
  if (clean.includes("free-fire") || clean.includes("freefire")) {
    return GAME_ROSTER_SPECS["free-fire-max"];
  }
  if (clean.includes("valorant") || clean.includes("valo")) {
    return GAME_ROSTER_SPECS["valorant"];
  }
  if (clean.includes("cs2") || clean.includes("counter-strike") || clean.includes("cs-2")) {
    return GAME_ROSTER_SPECS["counter-strike-2"];
  }
  if (clean.includes("cod") || clean.includes("call-of-duty")) {
    return GAME_ROSTER_SPECS["call-of-duty-mobile"];
  }

  // Default fallback
  return {
    min: 4,
    max: 5,
    label: "4-5 Players (Competitive Squad)",
    formatName: "Squad",
    shortBadge: "Squad",
    requiresTeam: true,
  };
}

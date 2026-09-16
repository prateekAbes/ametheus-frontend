"use client";

import { useState, useEffect } from "react";
import { Team, TeamMember } from "@/types";

const STORAGE_KEY = "ametheus_user_teams";

// Initial seed team for demo purposes
const INITIAL_TEAMS: Team[] = [
  {
    id: "team_vortex_alpha",
    gameSlug: "valorant",
    name: "Vortex Alpha",
    tag: "VTX",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeg153AQRoWxf_C4tvPxgy_F_YdO12nXK5KTCbYUnWKjveVie8pJQjlkS-8zuRuVhogG2TnA_LGFPtFUW9fN56GgNg8gDKa9NXkuez2KYYovOAKih13Kndl-CwXzATSiZaVMOTR-MQ-lqfCBRjQm1mC6tSGObC3b5pJOI38baTrU_V5Te3avoZNetINTZ9m3JQoD3PsswXw01PQrW3q99oq48iT8lINbKMm4w1ItY_fU5uLaligoZm",
    inviteCode: "SR7X4K",
    captainUserId: "usr_vortex_lead",
    captainUsername: "vortex_lead",
    maxMembers: 5,
    createdAt: new Date().toISOString(),
    members: [
      {
        userId: "usr_vortex_lead",
        username: "vortex_lead",
        role: "CAPTAIN",
        gameId: "vortex#IND",
        riotId: "vortex#IND",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "usr_phantom_99",
        username: "phantom_99",
        role: "MEMBER",
        gameId: "phantom#777",
        riotId: "phantom#777",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "usr_blaze_aim",
        username: "blaze_aim",
        role: "MEMBER",
        gameId: "blaze#444",
        riotId: "blaze#444",
        joinedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "team_velocity_strike",
    gameSlug: "valorant",
    name: "Velocity Strike Elite",
    tag: "VSE",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMqeoWzypZXBOE408dH6-sGin25_u7-r3rWCFiaGYldik6x6-QTbOWhelg5NETwWHiD64-JcAtmcBbnuzejJVqUxs5SSKNRLPbPG7eIs4MjUnLNYf1X45laCHgVOIQqn_Xc9-XB9gokhk_Bk-zpsU9zX9Zq16CkXaP9lNseNfduwdFflVfr_l8ex2g0RrWXgnRS7N-Rj2vRUWm8YMlP44n-BPIY3KLvEgyYr95nkjcbWCPxqW8ZHxv",
    inviteCode: "VL882K",
    captainUserId: "usr_velocity_cap",
    captainUsername: "velocity_cap",
    maxMembers: 5,
    createdAt: new Date().toISOString(),
    members: [
      {
        userId: "usr_velocity_cap",
        username: "velocity_cap",
        role: "CAPTAIN",
        gameId: "velocap#IN",
        riotId: "velocap#IN",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "usr_spectre_x",
        username: "spectre_x",
        role: "MEMBER",
        gameId: "spectre#01",
        riotId: "spectre#01",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "usr_omen_cloud",
        username: "omen_cloud",
        role: "MEMBER",
        gameId: "omen#888",
        riotId: "omen#888",
        joinedAt: new Date().toISOString(),
      },
    ],
  },
];

// Generates an atomic 6-character random uppercase alphanumeric code
export function generateUniqueTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useTeamStore(gameSlug?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTeams(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEAMS));
        setTeams(INITIAL_TEAMS);
      }
    } catch {
      setTeams(INITIAL_TEAMS);
    }
    setIsLoaded(true);
  }, []);

  const saveTeams = (newTeams: Team[]) => {
    setTeams(newTeams);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTeams));
    } catch (e) {
      console.error("Failed to persist teams", e);
    }
  };

  const createTeam = (data: {
    gameSlug: string;
    name: string;
    tag: string;
    logoUrl?: string;
    captainGameId: string;
  }): { success: boolean; team?: Team; error?: string } => {
    const existingCode = teams.some((t) => t.name.toLowerCase() === data.name.toLowerCase());
    if (existingCode) {
      return { success: false, error: "A team with this name already exists." };
    }

    let code = generateUniqueTeamCode();
    while (teams.some((t) => t.inviteCode === code)) {
      code = generateUniqueTeamCode();
    }

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      gameSlug: data.gameSlug,
      name: data.name,
      tag: data.tag.toUpperCase(),
      logoUrl: data.logoUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAeg153AQRoWxf_C4tvPxgy_F_YdO12nXK5KTCbYUnWKjveVie8pJQjlkS-8zuRuVhogG2TnA_LGFPtFUW9fN56GgNg8gDKa9NXkuez2KYYovOAKih13Kndl-CwXzATSiZaVMOTR-MQ-lqfCBRjQm1mC6tSGObC3b5pJOI38baTrU_V5Te3avoZNetINTZ9m3JQoD3PsswXw01PQrW3q99oq48iT8lINbKMm4w1ItY_fU5uLaligoZm",
      inviteCode: code,
      captainUserId: "usr_vortex_lead",
      captainUsername: "vortex_lead",
      maxMembers: data.gameSlug === "chess" ? 1 : 5,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: "usr_vortex_lead",
          username: "vortex_lead",
          role: "CAPTAIN",
          gameId: data.captainGameId,
          riotId: data.captainGameId,
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    const updated = [newTeam, ...teams];
    saveTeams(updated);
    return { success: true, team: newTeam };
  };

  const findTeamByCode = (code: string): Team | undefined => {
    const clean = code.trim().toUpperCase();
    return teams.find((t) => t.inviteCode === clean);
  };

  const joinTeam = (
    code: string,
    playerData: { username: string; gameId: string }
  ): { success: boolean; team?: Team; error?: string } => {
    const team = findTeamByCode(code);
    if (!team) {
      return { success: false, error: "Invalid 6-character team invite code." };
    }

    if (team.members.length >= team.maxMembers) {
      return { success: false, error: "This squad is already full." };
    }

    const alreadyJoined = team.members.some(
      (m) => m.username.toLowerCase() === playerData.username.toLowerCase()
    );
    if (alreadyJoined) {
      return { success: false, error: "You are already a member of this team." };
    }

    const newMember: TeamMember = {
      userId: `usr_${Date.now()}`,
      username: playerData.username,
      role: "MEMBER",
      gameId: playerData.gameId,
      riotId: playerData.gameId,
      joinedAt: new Date().toISOString(),
    };

    const updatedTeams = teams.map((t) => {
      if (t.id === team.id) {
        return {
          ...t,
          members: [...t.members, newMember],
        };
      }
      return t;
    });

    saveTeams(updatedTeams);
    return {
      success: true,
      team: updatedTeams.find((t) => t.id === team.id),
    };
  };

  const filteredTeams = gameSlug ? teams.filter((t) => t.gameSlug === gameSlug) : teams;

  return {
    teams: filteredTeams,
    allTeams: teams,
    isLoaded,
    createTeam,
    joinTeam,
    findTeamByCode,
  };
}

"use client";

import { useState, useEffect } from "react";
import { Team, TeamMember } from "@/types";

// Storage key is intentionally non-user-scoped here since this hook is used
// in contexts where userId may not be available. The dashboard scopes its own
// reads/writes by user.id directly.
const STORAGE_KEY = "ametheus_user_teams";

// No hardcoded seed teams — real teams come from the API (dashboard loadData)
// or from user-scoped localStorage keyed by user.id.
const INITIAL_TEAMS: Team[] = [];

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
        setTimeout(() => setTeams(JSON.parse(stored)), 0);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEAMS));
        setTimeout(() => setTeams(INITIAL_TEAMS), 0);
      }
    } catch {
      setTimeout(() => setTeams(INITIAL_TEAMS), 0);
    }
    setTimeout(() => setIsLoaded(true), 0);
  }, []);

  const saveTeams = (newTeams: Team[]) => {
    setTeams(newTeams);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTeams));
    } catch (e) {
      console.error("Failed to persist teams", e);
    }
  };

  const addExistingTeam = (team: Team): { success: boolean; team: Team } => {
    const inviteCode = team.inviteCode || (team as any).invite_code || generateUniqueTeamCode();
    const normalizedTeam: Team = {
      ...team,
      inviteCode,
      ...({ invite_code: inviteCode } as any),
    };

    const existsIndex = teams.findIndex(
      (t) => t.id === normalizedTeam.id || (t.name.toLowerCase() === normalizedTeam.name.toLowerCase() && t.gameSlug === normalizedTeam.gameSlug)
    );

    let updated: Team[];
    if (existsIndex >= 0) {
      updated = [...teams];
      updated[existsIndex] = normalizedTeam;
    } else {
      updated = [normalizedTeam, ...teams];
    }

    saveTeams(updated);
    return { success: true, team: normalizedTeam };
  };

  const createTeam = (data: {
    gameSlug: string;
    name: string;
    tag: string;
    logoUrl?: string;
    captainGameId: string;
    captainUserId?: string;
    captainUsername?: string;
    maxMembers?: number;
    inviteCode?: string;
  }): { success: boolean; team?: Team; error?: string } => {
    if (data.gameSlug === "chess") {
      return { success: false, error: "Chess is a solo 1v1 discipline. Team rosters are not permitted." };
    }

    const existingCode = teams.some((t) => t.name.toLowerCase() === data.name.toLowerCase());
    if (existingCode) {
      return { success: false, error: "A team with this name already exists." };
    }

    let code = data.inviteCode || generateUniqueTeamCode();
    if (!data.inviteCode) {
      while (teams.some((t) => t.inviteCode === code)) {
        code = generateUniqueTeamCode();
      }
    }

    const capUserId = data.captainUserId || `usr_${Date.now()}`;
    const capUsername = data.captainUsername || "Captain";
    const dynamicMaxMembers = data.maxMembers || (data.gameSlug === "smash-karts" ? 3 : data.gameSlug === "bgmi" ? 4 : 5);

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      gameSlug: data.gameSlug,
      name: data.name,
      tag: data.tag.toUpperCase(),
      logoUrl: data.logoUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop",
      inviteCode: code,
      ...({ invite_code: code } as any),
      captainUserId: capUserId,
      captainUsername: capUsername,
      maxMembers: dynamicMaxMembers,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: capUserId,
          username: capUsername,
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
    return teams.find((t) => (t.inviteCode && t.inviteCode.toUpperCase() === clean) || ((t as any).invite_code && (t as any).invite_code.toUpperCase() === clean));
  };

  const joinTeam = (
    code: string,
    playerData: { username: string; gameId: string }
  ): { success: boolean; team?: Team; error?: string } => {
    const team = findTeamByCode(code);
    if (!team) {
      return { success: false, error: "Invalid 6-character team invite code." };
    }

    if (team.gameSlug === "chess" || team.maxMembers <= 1) {
      return { success: false, error: "Chess is a solo 1v1 discipline. Squad joins are not permitted." };
    }

    if (team.members.length >= team.maxMembers) {
      return { success: false, error: `This squad is already full (${team.members.length}/${team.maxMembers}).` };
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
    addExistingTeam,
    joinTeam,
    findTeamByCode,
  };
}

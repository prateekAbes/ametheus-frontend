/**
 * AMETHEUS Gaming Identity Generator
 * Provides randomized gaming handles, clan tags, and esports avatars.
 * Supports auto-assignment on first launch.
 */

const GAMING_PREFIXES = [
  "Shadow", "Nova", "Vortex", "Phantom", "Cyber", "Apex", "Ghost", "Frost",
  "Titan", "Neon", "Viper", "Rogue", "Blaze", "Pulse", "Storm", "Iron",
  "Astral", "Echo", "Zero", "Venom", "Spectre", "Hyper", "Havoc", "Glitch",
  "Atomic", "Zenith", "Omega", "Krypton", "Solar", "Valor",
];

const GAMING_NOUNS = [
  "Viper", "Striker", "Reaper", "Ronin", "Sniper", "Slayer", "Sentry", "Hunter",
  "Knight", "Spectre", "Warlord", "Gunner", "Blade", "Wraith", "Havoc", "Fury",
  "Ace", "Sentinel", "Tactician", "Marksman", "Ninja", "Crusader", "Phoenix",
  "Titan", "Overlord", "Samurai", "Pilot", "Brawler", "Ranger", "Commander",
];

const GAMING_SUFFIXES = [
  "99", "07", "42", "77", "X", "Pro", "GG", "777", "Prime", "Elite",
  "360", "FPS", "Aim", "OP", "V2", "Apex", "Live", "KR", "HQ", "Z",
];

// Curated high-res esports avatar presets from Stitch design and official game art
export const GAMING_AVATAR_PRESETS = [
  {
    id: "stitch-pro-vortex",
    name: "Pro Vortex Cyber",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "stitch-smash-neon",
    name: "Neon Striker",
    url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "stitch-cyber-samurai",
    name: "Cyber Samurai",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "stitch-tactical-operator",
    name: "Tactical Operator",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "bottts-cyber-reaper",
    name: "Cyber Reaper",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberReaper&backgroundColor=0f172a&colors=amber,orange,red",
  },
  {
    id: "bottts-nova-strike",
    name: "Nova Strike",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=NovaStrike&backgroundColor=1e293b&colors=blue,cyan,sky",
  },
  {
    id: "bottts-phantom-ace",
    name: "Phantom Ace",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=PhantomAce&backgroundColor=0f172a&colors=purple,violet,indigo",
  },
  {
    id: "bottts-apex-ghost",
    name: "Apex Ghost",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ApexGhost&backgroundColor=1e1b4b&colors=emerald,teal,green",
  },
];

export function generateRandomGamingTag(): string {
  const prefix = GAMING_PREFIXES[Math.floor(Math.random() * GAMING_PREFIXES.length)];
  const noun = GAMING_NOUNS[Math.floor(Math.random() * GAMING_NOUNS.length)];
  const useSuffix = Math.random() > 0.3;
  if (useSuffix) {
    const suffix = GAMING_SUFFIXES[Math.floor(Math.random() * GAMING_SUFFIXES.length)];
    const separator = Math.random() > 0.5 ? "_" : "";
    return `${prefix}${noun}${separator}${suffix}`;
  }
  return `${prefix}${noun}`;
}

export function generateRandomGamingAvatar(seed?: string): string {
  // If no seed provided or 50% chance, pick from our high-res presets
  const presets = GAMING_AVATAR_PRESETS;
  const picked = presets[Math.floor(Math.random() * presets.length)];
  if (picked?.url) return picked.url;

  const randomSeed = seed || `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const bgColors = ["0f172a", "1e293b", "1e1b4b", "172554", "18181b"];
  const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=${randomBg}`;
}

export function generateRandomGamingIdentity() {
  const gamerTag = generateRandomGamingTag();
  const avatarUrl = generateRandomGamingAvatar(gamerTag);
  const clanTags = ["SLX", "VNX", "APX", "NOVA", "PHX", "TITN", "CYBR", "SHDW", "GHOST", "VTX"];
  const clanTag = clanTags[Math.floor(Math.random() * clanTags.length)];

  return {
    gamerTag,
    avatarUrl,
    clanTag,
  };
}

/**
 * Checks if the user is on their first launch or has no avatar/tag set,
 * and automatically assigns a gaming persona.
 */
export function initFirstLaunchPersona(currentDisplayName?: string, currentAvatar?: string) {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("ametheus_gamer_identity");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // If user already has both a custom name and avatar, don't overwrite
  if (currentDisplayName && currentAvatar && !currentDisplayName.includes("@")) {
    return {
      gamerTag: currentDisplayName,
      avatarUrl: currentAvatar,
      clanTag: "AMX",
      isNew: false,
    };
  }

  // Generate new identity for first launch
  const newIdentity = {
    ...generateRandomGamingIdentity(),
    isNew: true,
  };

  try {
    localStorage.setItem("ametheus_gamer_identity", JSON.stringify(newIdentity));
  } catch {
    // ignore
  }

  return newIdentity;
}

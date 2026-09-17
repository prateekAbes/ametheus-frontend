/**
 * AMETHEUS Gaming Identity Generator
 * Provides randomized gaming handles, clan tags, and esports avatars.
 */

const GAMING_PREFIXES = [
  "Shadow",
  "Nova",
  "Vortex",
  "Phantom",
  "Cyber",
  "Apex",
  "Ghost",
  "Frost",
  "Titan",
  "Neon",
  "Viper",
  "Rogue",
  "Blaze",
  "Pulse",
  "Storm",
  "Iron",
  "Astral",
  "Echo",
  "Zero",
  "Venom",
  "Spectre",
  "Hyper",
  "Havoc",
  "Glitch",
  "Atomic",
  "Zenith",
];

const GAMING_NOUNS = [
  "Viper",
  "Striker",
  "Reaper",
  "Ronin",
  "Sniper",
  "Slayer",
  "Sentry",
  "Hunter",
  "Knight",
  "Spectre",
  "Warlord",
  "Gunner",
  "Blade",
  "Wraith",
  "Havoc",
  "Fury",
  "Ace",
  "Sentinel",
  "Tactician",
  "Marksman",
  "Ninja",
  "Crusader",
  "Phoenix",
  "Titan",
  "Overlord",
];

const GAMING_SUFFIXES = [
  "99",
  "07",
  "42",
  "77",
  "X",
  "Pro",
  "GG",
  "777",
  "Prime",
  "Elite",
  "360",
  "FPS",
  "Aim",
  "OP",
  "V2",
];

export const GAMING_AVATAR_PRESETS = [
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
  {
    id: "bottts-vortex-titan",
    name: "Vortex Titan",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=VortexTitan&backgroundColor=172554&colors=orange,amber,yellow",
  },
  {
    id: "bottts-iron-wraith",
    name: "Iron Wraith",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=IronWraith&backgroundColor=18181b&colors=red,rose,pink",
  },
  {
    id: "bottts-shadow-ronin",
    name: "Shadow Ronin",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ShadowRonin&backgroundColor=030712&colors=sky,blue,indigo",
  },
  {
    id: "bottts-hyper-sniper",
    name: "Hyper Sniper",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=HyperSniper&backgroundColor=0f172a&colors=amber,emerald,cyan",
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
  const randomSeed = seed || `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const bgColors = ["0f172a", "1e293b", "1e1b4b", "172554", "18181b"];
  const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=${randomBg}`;
}

export function generateRandomGamingIdentity() {
  const gamerTag = generateRandomGamingTag();
  const avatarUrl = generateRandomGamingAvatar(gamerTag);
  const clanTags = ["SLX", "VNX", "APX", "NOVA", "PHX", "TITN", "CYBR", "SHDW", "GHOST"];
  const clanTag = clanTags[Math.floor(Math.random() * clanTags.length)];

  return {
    gamerTag,
    avatarUrl,
    clanTag,
  };
}


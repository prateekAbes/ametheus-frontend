/**
 * Standard fallback email constants for Ametheus.
 * For live identities configured on the backend server environment,
 * components use the `useEmailSettings()` hook.
 */
export const SUPPORT_EMAIL = "support@ametheus.games";
export const OFFICIAL_EMAIL = "official@ametheus.games";
export const AUTOMATED_EMAIL = "noreply@ametheus.games";
export const NOREPLY_EMAIL = "noreply@ametheus.games";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/official.ametheus",
  youtube: "https://www.youtube.com/@official.ametheus.goodgame",
  discord: "https://discord.gg/VzkfuK7We",
  website: "https://ametheus.gg",
  email: "official@ametheus.games",
};

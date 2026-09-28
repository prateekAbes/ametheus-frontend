/**
 * Standard fallback email constants for Ametheus.
 * For live identities configured on the backend server environment,
 * components use the `useEmailSettings()` hook.
 */
export const SUPPORT_EMAIL = "support.ametheus@gmail.com";
export const OFFICIAL_EMAIL = "official.ametheus@gmail.com";
export const AUTOMATED_EMAIL = "noreply.ametheus@gmail.com";
export const NOREPLY_EMAIL = "noreply.ametheus@gmail.com";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/ametheus.gg/",
  youtube: "https://www.youtube.com/@ametheus.goodgame",
  discord: "https://discord.gg/U59y39QnF",
  website: "https://ametheus.gg",
  email: "official.ametheus@gmail.com",
};

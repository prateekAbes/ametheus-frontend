/**
 * Default fallback email constants.
 * For live, dynamically-configured email identities managed by the Super Admin,
 * components use the `useEmailSettings()` hook.
 */
export const SUPPORT_EMAIL = "ametheus.support@gmail.com";
export const OFFICIAL_EMAIL = "ametheus@gmail.com";
export const AUTOMATED_EMAIL = "ametheus.noreply@gmail.com";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/ametheus.gg/",
  youtube: "https://www.youtube.com/@ametheus.goodgame",
  discord: "https://discord.gg/U59y39QnF",
  website: "https://ametheus.gg",
  email: "ametheus@gmail.com",
};

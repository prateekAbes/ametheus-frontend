"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { setAuthTokenGetter } from "@/lib/api/client";
import { syncUser, getCurrentUserProfile, UserProfile } from "@/lib/api/auth";

// ---------------------------------------------------------------------------
// AuthContext — single authoritative source of truth for the current user's
// AMETHEUS profile.  All consumers use this instead of reading localStorage
// directly, eliminating cross-account identity bleed-through.
// ---------------------------------------------------------------------------

interface AuthContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

// ---------------------------------------------------------------------------
// Inner component — must live inside ClerkProvider (already wrapped by layout)
// ---------------------------------------------------------------------------

function AuthSync({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inject token getter into the centralized API client
  useEffect(() => {
    setAuthTokenGetter(async (options?: { skipCache?: boolean }) => {
      if (!isSignedIn) return null;
      try {
        return await getToken(options);
      } catch {
        return null;
      }
    });
  }, [isSignedIn, getToken]);

  // ---------------------------------------------------------------------------
  // Core profile load + sync
  // ---------------------------------------------------------------------------
  const loadProfile = useCallback(async () => {
    if (!isAuthLoaded) return;

    if (!isSignedIn || !user) {
      // Signed out — wipe in-memory profile immediately; never read stale cache
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // User-scoped localStorage keys
    const storageKey = `ametheus_user_profile_${user.id}`;
    const identityKey = `ametheus_gamer_identity_${user.id}`;

    // 1. Sync with backend (upsert user record)
    const email =
      user.primaryEmailAddress?.emailAddress || `${user.id}@ametheus.gg`;
    const username =
      user.username || user.firstName?.toLowerCase() || user.id.slice(0, 10);
    const displayName = user.fullName || username;
    const avatarUrl = user.imageUrl;

    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const synced = await syncUser({
        clerk_user_id: user.id,
        email,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
      });

      if (synced) {
        setProfile(synced);
        try {
          localStorage.setItem(storageKey, JSON.stringify(synced));
          localStorage.setItem(
            identityKey,
            JSON.stringify({
              gamerTag: synced.display_name || displayName,
              avatarUrl: synced.avatar_url || avatarUrl,
              clanTag: "AMX",
              isNew: false,
            })
          );
          window.dispatchEvent(
            new CustomEvent("ametheus:profile_updated", { detail: synced })
          );
        } catch {}
        setIsLoading(false);
        return;
      }
    } catch {
      // Silent fallback: profile will be restored from cache or subsequent refresh
    }

    // 3. Fallback: fetch existing profile directly
    try {
      const fetched = await getCurrentUserProfile();
      if (fetched) {
        setProfile(fetched);
        try {
          localStorage.setItem(storageKey, JSON.stringify(fetched));
        } catch {}
      }
    } catch {}

    setIsLoading(false);
  }, [isAuthLoaded, isSignedIn, user, getToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Listen for profile updates dispatched from Dashboard, avatar upload, etc.
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const storageKey = `ametheus_user_profile_${user.id}`;

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<UserProfile>).detail;
      if (detail) {
        setProfile(detail);
        try {
          localStorage.setItem(storageKey, JSON.stringify(detail));
        } catch {}
      }
    };

    window.addEventListener("ametheus:profile_updated", handleUpdate);
    return () =>
      window.removeEventListener("ametheus:profile_updated", handleUpdate);
  }, [isSignedIn, user]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Public provider — wraps the rest of the app
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthSync>{children}</AuthSync>;
}

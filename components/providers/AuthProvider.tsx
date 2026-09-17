"use client";

import React, { useEffect } from "react";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { setAuthTokenGetter } from "@/lib/api/client";
import { syncUser } from "@/lib/api/auth";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function TokenAndProfileSync() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // 1. Inject token getter into centralized API client
    setAuthTokenGetter(async () => {
      if (!isSignedIn) return null;
      try {
        return await getToken();
      } catch {
        return null;
      }
    });

    // 2. Sync profile to AMETHEUS backend upon sign-in
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || `${user.id}@ametheus.gg`;
      const username = user.username || user.firstName?.toLowerCase() || user.id.slice(0, 10);
      const displayName = user.fullName || username;
      const avatarUrl = user.imageUrl;

      syncUser({
        clerk_user_id: user.id,
        email,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
      }).catch((err) => {
        console.warn("[AMETHEUS] Background user sync notice:", err);
      });
    }
  }, [isSignedIn, user, getToken]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TokenAndProfileSync />
      {children}
    </>
  );
}

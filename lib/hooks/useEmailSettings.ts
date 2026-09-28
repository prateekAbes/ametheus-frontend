"use client";

import { useState, useEffect, useCallback } from "react";
import { getEmailSettingsPublic, EmailSettings } from "@/lib/api/email_settings";

const DEFAULT_SETTINGS: EmailSettings = {
  official_email: "official.ametheus@gmail.com",
  support_email: "support.ametheus@gmail.com",
  automated_email: "noreply.ametheus@gmail.com",
};

let cachedSettings: EmailSettings = DEFAULT_SETTINGS;
let listeners: Array<(s: EmailSettings) => void> = [];

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>(cachedSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getEmailSettingsPublic();
      if (data && data.official_email) {
        cachedSettings = data;
        setSettings(data);
        listeners.forEach((l) => l(data));
      }
    } catch {
      // Silently keep cached fallback
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getEmailSettingsPublic()
      .then((data) => {
        if (isMounted && data && data.official_email) {
          cachedSettings = data;
          setSettings(data);
          listeners.forEach((l) => l(data));
        }
      })
      .catch(() => {
        // Fallback remains active
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const listener = (newSettings: EmailSettings) => {
      if (isMounted) setSettings(newSettings);
    };
    listeners.push(listener);

    return () => {
      isMounted = false;
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    official_email: settings.official_email || DEFAULT_SETTINGS.official_email,
    support_email: settings.support_email || DEFAULT_SETTINGS.support_email,
    automated_email: settings.automated_email || DEFAULT_SETTINGS.automated_email,
    updated_at: settings.updated_at,
    loading,
    refresh,
  };
}

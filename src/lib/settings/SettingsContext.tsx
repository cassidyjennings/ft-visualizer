"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { Settings } from "./types";
import { defaultSettings } from "./defaults";

const STORAGE_KEY = "ftv_settings_v1";

type SettingsContextValue = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadInitialSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings());

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota/private mode
    }
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      reset: () => setSettings(defaultSettings),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

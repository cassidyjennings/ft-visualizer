"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Settings } from "./types";
import { defaultSettings } from "./defaults";
import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";

const STORAGE_KEY = "ftv_settings_v1";

type SettingsContextValue = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {}
  return defaultSettings;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Read from localStorage synchronously so effectiveColoring is correct on first render,
  // preventing the flash that occurs when the storage load useEffect fires late.
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const effectiveColoring = useEffectiveColoring(settings.coloring);

  useEffect(() => {
    const el = document.documentElement;
    // Disable all transitions for the duration of the theme swap so every element
    // (including buttons with Tailwind's `transition` class) switches at once.
    el.classList.add("no-transition");
    el.classList.toggle("dark", effectiveColoring === "dark");
    // Force a synchronous reflow so the browser processes no-transition before the
    // dark class change, then remove it so future hover transitions still work.
    void el.getBoundingClientRect();
    el.classList.remove("no-transition");
  }, [effectiveColoring]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const reset = useCallback(() => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, reset }),
    [settings, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

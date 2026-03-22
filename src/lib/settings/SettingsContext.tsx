// "use client";

// import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
// import type { Settings } from "./types";
// import { defaultSettings } from "./defaults";
// import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";

// const STORAGE_KEY = "ftv_settings_v1";

// type SettingsContextValue = {
//   settings: Settings;
//   setSettings: React.Dispatch<React.SetStateAction<Settings>>;
//   reset: () => void;
// };

// const SettingsContext = createContext<SettingsContextValue | null>(null);

// function loadInitialSettings(): Settings {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (!raw) return defaultSettings;
//     const parsed = JSON.parse(raw) as Partial<Settings>;
//     return { ...defaultSettings, ...parsed };
//   } catch {
//     return defaultSettings;
//   }
// }

// export function SettingsProvider({ children }: { children: React.ReactNode }) {
//   const [settings, setSettings] = useState<Settings>(() => loadInitialSettings());
//   const effectiveColoring = useEffectiveColoring(settings.coloring); // "light" | "dark"

//   // 1) Apply theme class from ONE place
//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", effectiveColoring === "dark");
//   }, [effectiveColoring]);

//   // 2) Persist settings to the SAME key you load from
//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
//   }, [settings]);

//   const value = useMemo(
//     () => ({
//       settings,
//       setSettings,
//       reset: () => {
//         setSettings(defaultSettings);
//         localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
//       },
//     }),
//     [settings],
//   );

//   return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
// }

// export function useSettings(): SettingsContextValue {
//   const ctx = useContext(SettingsContext);
//   if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
//   return ctx;
// }

"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import type { Settings } from "./types";
import { defaultSettings } from "./defaults";
import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";

const STORAGE_KEY = "ftv_settings_v1";

type SettingsContextValue = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  reset: () => void;
  hydrated: boolean; // helpful for gating UI if needed
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // ✅ Deterministic on server + first client render
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  // Load saved settings AFTER mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      // ignore, keep defaults
    } finally {
      setHydrated(true);
    }
  }, []);

  const effectiveColoring = useEffectiveColoring(settings.coloring);

  // Apply theme class (this can stay)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", effectiveColoring === "dark");
  }, [effectiveColoring]);

  // Persist settings, but DON'T clobber storage before we hydrate
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings, hydrated]);

  const reset = () => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch {}
  };

  const value = useMemo(
    () => ({ settings, setSettings, reset, hydrated }),
    [settings, hydrated],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

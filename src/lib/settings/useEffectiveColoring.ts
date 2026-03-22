// import { useEffect, useMemo, useState } from "react";
// import type { DisplayColoring } from "./types";

// export function useEffectiveColoring(themeMode: DisplayColoring) {
//   const [systemDark, setSystemDark] = useState(false);

//   useEffect(() => {
//     const mql = window.matchMedia("(prefers-color-scheme: dark)");
//     const onChange = () => setSystemDark(mql.matches);

//     onChange(); // initialize
//     mql.addEventListener?.("change", onChange);
//     return () => mql.removeEventListener?.("change", onChange);
//   }, []);

//   return useMemo(() => {
//     if (themeMode === "dark") return "dark";
//     if (themeMode === "light") return "light";
//     return systemDark ? "dark" : "light";
//   }, [themeMode, systemDark]);
// }

import { useEffect, useMemo, useState } from "react";
import type { DisplayColoring } from "./types";

function getPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function getHtmlDarkClass() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function useEffectiveColoring(themeMode: DisplayColoring) {
  // IMPORTANT: initialize from client reality (not always false)
  const [systemDark, setSystemDark] = useState(getPrefersDark);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mql.matches);

    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return useMemo(() => {
    if (themeMode === "dark") return "dark";
    if (themeMode === "light") return "light";

    // If you keep the layout script, this is the most stable “system” truth:
    // it matches what the user actually has applied pre-hydration.
    return getHtmlDarkClass() ? "dark" : "light";
  }, [themeMode, systemDark]);
}

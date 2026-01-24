import { useEffect, useMemo, useState } from "react";
import type { DisplayColoring } from "./types";

export function useEffectiveColoring(themeMode: DisplayColoring) {
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mql.matches);

    onChange(); // initialize
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return useMemo(() => {
    if (themeMode === "dark") return "dark";
    if (themeMode === "light") return "light";
    return systemDark ? "dark" : "light";
  }, [themeMode, systemDark]);
}

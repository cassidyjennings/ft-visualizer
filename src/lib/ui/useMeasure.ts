"use client";

import { useEffect, useState } from "react";

export function useMeasure<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!node) return;

    const update = () => {
      const r = node.getBoundingClientRect();
      setRect({ width: r.width, height: r.height });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(node);

    return () => ro.disconnect();
  }, [node]);

  return { ref: setNode, rect };
}

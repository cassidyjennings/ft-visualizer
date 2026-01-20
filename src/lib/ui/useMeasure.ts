// "use client";

// import { useEffect, useState } from "react";

// type MeasuredRect = {
//   width: number;
//   height: number;
//   top: number;
//   left: number;
//   right: number;
//   bottom: number;
// };

// export function useMeasure<T extends HTMLElement>() {
//   const [node, setNode] = useState<T | null>(null);
//   const [rect, setRect] = useState<MeasuredRect>({
//     width: 0,
//     height: 0,
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   });

//   useEffect(() => {
//     if (!node) return;

//     const update = () => {
//       const r = node.getBoundingClientRect();
//       setRect({
//         width: r.width,
//         height: r.height,
//         top: r.top,
//         left: r.left,
//         right: r.right,
//         bottom: r.bottom,
//       });
//     };

//     update();

//     const ro = new ResizeObserver(update);
//     ro.observe(node);

//     // Keep top/left in sync on scroll + window resize (ResizeObserver won't fire for scroll)
//     window.addEventListener("scroll", update, { passive: true });
//     window.addEventListener("resize", update);

//     return () => {
//       ro.disconnect();
//       window.removeEventListener("scroll", update);
//       window.removeEventListener("resize", update);
//     };
//   }, [node]);

//   return { ref: setNode, rect };
// }

"use client";

import { useEffect, useState } from "react";

type MeasuredRect = {
  width: number;
  height: number;

  // Viewport-relative (changes on scroll)
  top: number;
  left: number;
  right: number;
  bottom: number;

  // Document-relative (stable on scroll)
  pageTop: number;
  pageLeft: number;
};

export function useMeasure<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [rect, setRect] = useState<MeasuredRect>({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pageTop: 0,
    pageLeft: 0,
  });

  useEffect(() => {
    if (!node) return;

    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = node.getBoundingClientRect();

        // Document-relative position (stable on scroll)
        const pageTop = r.top + window.scrollY;
        const pageLeft = r.left + window.scrollX;

        setRect({
          width: r.width,
          height: r.height,
          top: r.top,
          left: r.left,
          right: r.right,
          bottom: r.bottom,
          pageTop,
          pageLeft,
        });
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(node);

    // ResizeObserver won’t fire on window resize if layout changes without node resize
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [node]);

  return { ref: setNode, rect };
}

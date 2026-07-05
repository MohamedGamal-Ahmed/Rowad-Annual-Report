import React, { useEffect, useRef, useState } from "react";
import { REPORT_CANVAS_WIDTH, REPORT_CANVAS_HEIGHT } from "../../theme/tokens";

/**
 * Fixed 16:9 report-canvas wrapper (1280x720 design surface).
 * - Never rearranges/stacks children responsively — instead the whole
 *   canvas is scaled (CSS transform) to fit the available viewport,
 *   exactly like a presentation slide / printable report page.
 * - Print CSS (see index.css .report-canvas) forces one page per canvas,
 *   full-bleed, no shadow, no page-break inside.
 */
export function ReportCanvas({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function recompute() {
      const outer = outerRef.current;
      if (!outer) return;
      const availableWidth = outer.clientWidth;
      const availableHeight = outer.clientHeight;
      const s = Math.min(availableWidth / REPORT_CANVAS_WIDTH, availableHeight / REPORT_CANVAS_HEIGHT, 1);
      setScale(s);
    }
    recompute();
    const observer = new ResizeObserver(recompute);
    if (outerRef.current) observer.observe(outerRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

  return (
    <div ref={outerRef} className="canvas-outer w-full h-full flex items-center justify-center overflow-auto bg-bg">
      <div
        className="report-canvas relative bg-bg shadow-card flex overflow-hidden"
        style={{
          width: REPORT_CANVAS_WIDTH,
          height: REPORT_CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

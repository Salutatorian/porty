import { useEffect, useRef, useState, useMemo } from "react";

function parseHex(s) {
  if (!s || typeof s !== "string" || !s.startsWith("#")) return [160, 150, 140];
  const h = s.slice(1);
  if (h.length === 3) {
    return h.split("").map((c) => parseInt(c + c, 16));
  }
  if (h.length >= 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  return [160, 150, 140];
}

export default function PixelCard({
  variant: _variant,
  gap = 6,
  speed = 35,
  colors = "#888,#aaa,#bbb",
  className = "",
  children,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  activeRef.current = active;

  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const colorList = useMemo(() => {
    const parts = colors.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
    return parts.length ? parts : ["#888888"];
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hash = (n) => {
      const x = Math.sin(n * 127.1) * 43758.5453123;
      return x - Math.floor(x);
    };

    let rafId = 0;

    function drawFrame(isActive, animate) {
      const rect = root.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cell = Math.max(4, gap);
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const spd = speed / 35;
      const t = performance.now() * 0.001 * spd;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cell;
          const y = row * cell;
          const idx = col + row * cols;
          const rgb = parseHex(colorList[idx % colorList.length]);
          let alpha;
          if (reducedMotion) {
            alpha = 0.06 + 0.12 * hash(idx + 2);
          } else if (isActive && animate) {
            const flicker =
              0.55 +
              0.45 *
                Math.sin(t * 4 + hash(idx * 9.1) * 6.2831853) *
                Math.sin(t * 2.3 + hash(idx * 3.7) * 6.2831853);
            alpha = 0.07 + 0.38 * flicker * flicker;
          } else {
            alpha = 0.04 + 0.09 * hash(idx + col * 0.37);
          }
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
          const cw = Math.min(cell, w - x);
          const ch = Math.min(cell, h - y);
          if (cw > 0 && ch > 0) ctx.fillRect(x, y, cw, ch);
        }
      }
    }

    function loop() {
      const isActive = activeRef.current;
      drawFrame(isActive, isActive);
      if (isActive && !reducedMotion) {
        rafId = requestAnimationFrame(loop);
      }
    }

    function kick() {
      cancelAnimationFrame(rafId);
      const isActive = activeRef.current;
      drawFrame(isActive, isActive);
      if (isActive && !reducedMotion) {
        rafId = requestAnimationFrame(loop);
      }
    }

    kick();

    const ro = new ResizeObserver(() => kick());
    ro.observe(root);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [gap, speed, colorList, reducedMotion, active]);

  function handleBlur(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
  }

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative" }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={handleBlur}
    >
      <canvas
        ref={canvasRef}
        className="pixel-canvas"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

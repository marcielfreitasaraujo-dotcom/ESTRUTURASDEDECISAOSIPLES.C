import { useEffect, useRef } from "react";

export default function HeroField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = [];
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      nodes.length = 0;
      const count = window.innerWidth < 760 ? 28 : 46;
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.00018,
          vy: (Math.random() - 0.5) * 0.00018,
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (!reduce) {
        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > 1) n.vx *= -1;
          if (n.y < 0 || n.y > 1) n.vy *= -1;
        });
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx * w, dy * h);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(61, 190, 180, ${0.12 * (1 - dist / 140)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.fillStyle = "rgba(61, 190, 180, 0.55)";
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      frame += 1;
      if (!reduce || frame < 2) {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    seed();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

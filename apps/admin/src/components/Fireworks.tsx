"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};
type Rocket = { x: number; y: number; vy: number; targetY: number; color: string };

const COLORS = ["#ff4757", "#ffa502", "#ffdd59", "#32ff7e", "#18dcff", "#7d5fff", "#ff6b81", "#ff9ff3"];

export function Fireworks({
  message,
  durationMs = 7000,
  onDone,
}: {
  message: string;
  durationMs?: number;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g: CanvasRenderingContext2D = ctx;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    const start = performance.now();
    let lastLaunch = 0;
    let raf = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)] as string;

    function launch() {
      rockets.push({
        x: rand(w * 0.12, w * 0.88),
        y: h,
        vy: rand(-13, -10),
        targetY: rand(h * 0.12, h * 0.45),
        color: pick(),
      });
    }
    function explode(x: number, y: number, color: string) {
      const count = 70 + Math.floor(Math.random() * 50);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.08, 0.08);
        const speed = rand(2, 7.5);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: rand(50, 95),
          color,
          size: rand(1.5, 3),
        });
      }
    }

    function frame(now: number) {
      const elapsed = now - start;
      // dark translucent fill = night sky + fading trails
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "rgba(8,8,22,0.20)";
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "lighter";

      if (elapsed < durationMs - 1500 && now - lastLaunch > 260) {
        launch();
        if (Math.random() < 0.6) launch();
        lastLaunch = now;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]!;
        r.y += r.vy;
        r.vy += 0.12;
        g.fillStyle = r.color;
        g.beginPath();
        g.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        g.fill();
        if (r.vy >= 0 || r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.985;
        p.vy *= 0.985;
        g.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        g.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
      g.globalAlpha = 1;

      if (elapsed < durationMs || particles.length > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        onDoneRef.current();
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [durationMs]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="relative animate-bounce rounded-2xl bg-white/90 px-10 py-7 text-center shadow-2xl backdrop-blur">
        <div className="flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-amber-400" aria-hidden="true"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-14 w-14 text-yellow-400" aria-hidden="true"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-amber-400" aria-hidden="true"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
        </div>
        <div className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900">{message}</div>
      </div>
    </div>
  );
}

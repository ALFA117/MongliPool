import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fondo ambiental (receta 4 de /diseno: túnel warp de anillos), adaptado a
 * MongliPool como un "túnel mezclador": hexágonos verdes y azules vienen hacia
 * la cámara girando, y por el centro viajan depósitos (puntos) que, al cruzar
 * la mitad del túnel, se dispersan y se desvanecen — entran por una puerta y
 * nadie puede seguirlos hasta la otra. El centro del túnel sigue al puntero
 * en escritorio y el scroll lo desplaza. Completo en la portada, tranquilo en
 * las pantallas de trabajo (Depositar, Retirar…). Menos anillos en celular,
 * DPR ≤ 2, pausa con la pestaña oculta y una sola escena quieta con
 * prefers-reduced-motion. Los colores salen de los tokens CSS.
 */
export default function AnimatedBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useLocation().pathname === "/";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = mobile ? 14 : 24;
    const SPACING = 80;
    const rings = Array.from({ length: N }, (_, i) => ({ z: (i + 1) * SPACING, rot: i * 0.3 }));
    type Dot = { a: number; r: number; z: number; spread: number };
    const dots: Dot[] = [];
    let w = 0, h = 0, raf = 0, last = 0, spawnT = 0;
    let px = 0, py = 0, tx = 0, ty = 0, scroll = 0;
    let green = "", blue = "", light = false;

    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      green = `rgb(${css.getPropertyValue("--pool-green").trim().replace(/ +/g, ",")})`;
      blue = `rgb(${css.getPropertyValue("--pool-violet-light").trim().replace(/ +/g, ",")})`;
      light = document.documentElement.dataset.theme === "light";
    };
    readColors();
    const obs = new MutationObserver(() => { readColors(); if (reduce) draw(0); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const resize = () => {
      w = el.clientWidth; h = el.clientHeight;
      el.width = w * dpr; el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0);
    };

    function hexagon(cx: number, cy: number, r: number, rot: number) {
      ctx!.beginPath();
      for (let k = 0; k <= 6; k++) {
        const a = rot + (k / 6) * Math.PI * 2;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (k) ctx!.lineTo(x, y); else ctx!.moveTo(x, y);
      }
      ctx!.stroke();
    }

    function draw(dt: number) {
      ctx!.clearRect(0, 0, w, h);
      const strength = (full ? 1 : 0.45) * (light ? 0.55 : 1);
      const speed = full ? 1.4 : 0.7;
      const cx = w / 2 + px * 80;
      const cy = h * 0.45 + py * 60 - Math.min(scroll * 0.15, h * 0.25);
      const base = Math.min(w, h) * (mobile ? 0.55 : 0.42);

      // Anillos, del fondo hacia la cámara
      const sorted = [...rings].sort((a, b) => b.z - a.z);
      for (const r of sorted) {
        if (dt) {
          r.z -= speed * dt * 60;
          if (r.z < 1) r.z += N * SPACING;
        }
        const k = 500 / r.z;
        const i = rings.indexOf(r);
        ctx!.strokeStyle = i % 2 ? blue : green;
        ctx!.lineWidth = Math.min(3, 0.6 + k * 0.8);
        ctx!.globalAlpha = Math.min(1, k * 0.7) * 0.5 * strength;
        hexagon(cx, cy, base * k * 0.6, r.rot + (dt ? performance.now() / 5000 : 0));
      }

      // Depósitos que entran por el centro y se pierden al cruzar
      if (dt && !reduce) {
        spawnT += dt;
        if (spawnT > (full ? 0.18 : 0.5) && dots.length < (mobile ? 30 : 60)) {
          spawnT = 0;
          dots.push({ a: Math.random() * Math.PI * 2, r: 0.04 + Math.random() * 0.1, z: N * SPACING, spread: 0 });
        }
      }
      for (let d = dots.length - 1; d >= 0; d--) {
        const p = dots[d];
        if (dt) {
          p.z -= speed * 1.6 * dt * 60;
          if (p.z < N * SPACING * 0.45) p.spread += dt * 1.8; // a mitad del túnel: se dispersa
          if (p.z < 20 || p.spread > 1) { dots.splice(d, 1); continue; }
        }
        const k = 500 / p.z;
        const ang = p.a + p.spread * 2.4;
        const rad = base * k * (p.r + p.spread * 0.5);
        const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
        ctx!.globalAlpha = Math.min(1, k) * (1 - p.spread) * 0.9 * strength;
        ctx!.fillStyle = p.spread > 0 ? blue : green;
        ctx!.beginPath();
        ctx!.arc(x, y, Math.min(4, 1 + k * 1.2), 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => { scroll = window.scrollY; };
    if (fine && !reduce) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    if (reduce) {
      draw(0);
    } else {
      const loop = (t: number) => {
        const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
        last = t;
        px += (tx - px) * 0.05;
        py += (ty - py) * 0.05;
        draw(dt);
        raf = requestAnimationFrame(loop);
      };
      const onVis = () => {
        cancelAnimationFrame(raf);
        last = 0;
        if (!document.hidden) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      document.addEventListener("visibilitychange", onVis);
      return () => {
        cancelAnimationFrame(raf);
        obs.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVis);
      };
    }
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [full]);

  return (
    <div className="pool-amb" aria-hidden="true">
      <div className="pool-amb-aurora" />
      <canvas ref={ref} className="pool-amb-canvas" />
      <div className="pool-amb-vignette" />
    </div>
  );
}

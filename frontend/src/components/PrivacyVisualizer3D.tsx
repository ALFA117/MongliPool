import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Static fallback shown on mobile or when prefers-reduced-motion is set.
// Conveys the same concept — transaction hidden inside a cryptographic sphere —
// without requiring WebGL or animation.
function StaticFallback() {
  return (
    <div
      className="relative w-full h-64 rounded-2xl overflow-hidden bg-pool-bg border border-pool-violet/20 flex items-center justify-center"
      role="img"
      aria-label="Tu transacción oculta criptográficamente"
    >
      {/* Concentric rings */}
      <div className="absolute w-52 h-52 rounded-full border border-pool-violet/10" />
      <div className="absolute w-36 h-36 rounded-full border border-pool-violet/20" />
      <div className="absolute w-20 h-20 rounded-full border border-pool-violet/40 shadow-violet" />
      {/* Outer glow */}
      <div className="absolute w-52 h-52 rounded-full bg-pool-violet/5" />
      {/* Central orb */}
      <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-pool-violet to-pool-violet-dim shadow-violet flex items-center justify-center">
        <svg className="w-7 h-7 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      {/* Orbiting particle dots */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const rx = 90, ry = 60;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-pool-green opacity-70"
            style={{
              left: `calc(50% + ${Math.cos(angle) * rx}px - 4px)`,
              top: `calc(50% + ${Math.sin(angle) * ry}px - 4px)`,
            }}
          />
        );
      })}
      <p className="absolute bottom-3 text-center text-pool-text-dim text-xs w-full">
        Tu transacción, oculta criptográficamente
      </p>
    </div>
  );
}

interface Props {
  className?: string;
}

export default function PrivacyVisualizer3D({ className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Detect mobile on first render; no SSR in this app so window is always available
  const [isMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    if (isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);

    // ── Lighting ──────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0x0d0d2a, 2);
    scene.add(ambient);
    const violetPt = new THREE.PointLight(0x7c3aed, 6, 14);
    violetPt.position.set(3, 3, 3);
    scene.add(violetPt);
    const greenPt = new THREE.PointLight(0x10b981, 3, 10);
    greenPt.position.set(-3, -2, -4);
    scene.add(greenPt);

    // ── Central sphere (commitment) ───────────────────────────────────────────
    const sphereGeo = new THREE.SphereGeometry(1.5, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x3b1078,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.3,
      shininess: 140,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // ── Orbiting violet ring (ZK proof shield) ────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(2.2, 0.055, 16, 100);
    const ringMat = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.6,
      shininess: 80,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // ── Second thin green ring (ASP approval) ─────────────────────────────────
    const ring2Geo = new THREE.TorusGeometry(2.6, 0.03, 12, 100);
    const ring2Mat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);

    // ── Particles (incoming transactions spiraling into commitment) ───────────
    const PARTICLE_COUNT = 200;
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3); // small tangential wobble

    const resetParticle = (i: number) => {
      const r = 4 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      resetParticle(i);
      // Stagger radii so they don't all converge at once
      const scale = 0.5 + Math.random() * 0.5;
      pos[i * 3 + 0] *= scale;
      pos[i * 3 + 1] *= scale;
      pos[i * 3 + 2] *= scale;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.065,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ────────────────────────────────────────────────────────
    let frameId: number;
    let t = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.016;

      // Sphere slow rotation + emissive pulse (mimics "hidden commitment" heartbeat)
      sphere.rotation.y += 0.004;
      sphere.rotation.x += 0.0008;
      sphereMat.emissiveIntensity = 0.18 + Math.sin(t * 0.9) * 0.14;

      // Shield ring orbits
      ring.rotation.y += 0.007;
      ring2.rotation.x += 0.005;
      ring2Mat.emissiveIntensity = 0.3 + Math.sin(t * 1.3 + 1) * 0.15;

      // Particles spiral inward toward commitment sphere
      const pa = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = ix + 1, iz = ix + 2;
        const x = pa[ix], y = pa[iy], z = pa[iz];
        const r = Math.sqrt(x * x + y * y + z * z);

        if (r < 1.55) {
          // Absorbed into commitment — reset to outer shell
          resetParticle(i);
        } else {
          // Drift inward (radial) + tangential wobble
          const inv = 1 / r;
          pa[ix] -= x * inv * 0.013 - vel[ix];
          pa[iy] -= y * inv * 0.013 - vel[iy];
          pa[iz] -= z * inv * 0.013 - vel[iz];
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isMobile]);

  if (isMobile) return <StaticFallback />;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-64 rounded-2xl overflow-hidden ${className}`}
      role="img"
      aria-label="Visualización 3D: tu transacción desaparece dentro de una esfera criptográfica"
    >
      {/* Label overlaid on WebGL canvas */}
      <p className="absolute bottom-2 left-0 right-0 text-center text-pool-text-dim/70 text-xs pointer-events-none z-10 select-none">
        Tu transacción, oculta criptográficamente
      </p>
    </div>
  );
}
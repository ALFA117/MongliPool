import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

function StaticFallback({ fullscreen }: { fullscreen?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${
        fullscreen ? "absolute inset-0" : "w-full h-full rounded-2xl"
      }`}
      style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, #080816 70%)" }}
      role="img"
      aria-label="Privacy visualization"
    >
      <div className="absolute w-52 h-52 rounded-full border border-pool-violet/10 animate-pulse" />
      <div className="absolute w-36 h-36 rounded-full border border-pool-violet/20" />
      <div className="absolute w-20 h-20 rounded-full border border-pool-violet/40 shadow-violet" />
      <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-pool-violet to-pool-violet-dim shadow-violet flex items-center justify-center">
        <svg className="w-7 h-7 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-pool-green/60"
            style={{ left: `calc(50% + ${Math.cos(angle)*90}px)`, top: `calc(50% + ${Math.sin(angle)*60}px)` }} />
        );
      })}
    </div>
  );
}

interface Props { className?: string; fullscreen?: boolean; }

export default function PrivacyVisualizer3D({ className = "", fullscreen = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    if (isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, fullscreen ? 10 : 7.5);

    // Lighting — multi-source for depth
    scene.add(new THREE.AmbientLight(0x0a0a2e, 1.5));
    const violetKey = new THREE.PointLight(0x7c3aed, 15, 25);
    violetKey.position.set(4, 4, 4);
    scene.add(violetKey);
    const greenFill = new THREE.PointLight(0x10b981, 8, 20);
    greenFill.position.set(-4, -3, -5);
    scene.add(greenFill);
    const blueRim = new THREE.PointLight(0x3b82f6, 6, 15);
    blueRim.position.set(-2, 5, -3);
    scene.add(blueRim);

    // Central sphere — MeshPhysicalMaterial for realism
    const sphereR = fullscreen ? 2.2 : 1.6;
    const sphereGeo = new THREE.SphereGeometry(sphereR, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x2d1065,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 0.5,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Inner glow sphere
    const glowGeo = new THREE.SphereGeometry(sphereR * 1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // ZK shield ring
    const ring1R = fullscreen ? 3.2 : 2.4;
    const ringGeo = new THREE.TorusGeometry(ring1R, 0.04, 20, 120);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0x8b5cf6,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // ASP ring
    const ring2R = fullscreen ? 3.8 : 2.8;
    const ring2Geo = new THREE.TorusGeometry(ring2R, 0.025, 16, 120);
    const ring2Mat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.2,
      roughness: 0.3,
      metalness: 0.7,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);

    // Third decorative ring
    const ring3Geo = new THREE.TorusGeometry(ring1R * 0.85, 0.015, 12, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.4 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = -Math.PI / 4;
    ring3.rotation.y = Math.PI / 6;
    scene.add(ring3);

    // Particles
    const PC = fullscreen ? 500 : 280;
    const pos = new Float32Array(PC * 3);
    const vel = new Float32Array(PC * 3);
    const colors = new Float32Array(PC * 3);

    const resetParticle = (i: number) => {
      const r = (fullscreen ? 5.5 : 4.2) + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      vel[i*3] = (Math.random() - 0.5) * 0.006;
      vel[i*3+1] = (Math.random() - 0.5) * 0.006;
      vel[i*3+2] = (Math.random() - 0.5) * 0.006;
      // Color: mix of green and violet
      const t = Math.random();
      colors[i*3] = 0.06 + t * 0.42;    // R
      colors[i*3+1] = 0.72 - t * 0.45;  // G
      colors[i*3+2] = 0.5 + t * 0.43;   // B
    };

    for (let i = 0; i < PC; i++) {
      resetParticle(i);
      const s = 0.3 + Math.random() * 0.7;
      pos[i*3] *= s; pos[i*3+1] *= s; pos[i*3+2] *= s;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: fullscreen ? 0.07 : 0.055,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // Post-processing: bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(W, H),
      fullscreen ? 1.8 : 1.4,  // strength — very aggressive
      0.6,                       // radius — wide glow
      0.2                        // threshold — catch more emissive surfaces
    );
    composer.addPass(bloom);

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Scroll reactivity (fullscreen hero only)
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    if (fullscreen) window.addEventListener("scroll", onScroll, { passive: true });

    // Animation
    let frameId: number;
    let t = 0;
    let camAngle = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.016;

      // Camera orbit + scroll parallax
      camAngle += 0.001;
      const scrollFactor = fullscreen ? scrollY * 0.002 : 0;
      camera.position.x = Math.sin(camAngle) * (fullscreen ? 2 : 1);
      camera.position.y = Math.cos(camAngle * 0.7) * 0.8 - scrollFactor;
      camera.position.z = (fullscreen ? 10 : 7.5) + scrollFactor * 0.5;
      camera.lookAt(0, 0, 0);

      // Sphere pulse + breathing scale
      sphere.rotation.y += 0.003;
      sphere.rotation.x += 0.0006;
      const breathe = 1 + Math.sin(t * 0.6) * 0.03;
      sphere.scale.setScalar(breathe);
      sphereMat.emissiveIntensity = 0.5 + Math.sin(t * 0.8) * 0.3;

      // Rings orbit
      ring.rotation.y += 0.006;
      ring2.rotation.x += 0.004;
      ring3.rotation.y -= 0.003;
      ring3.rotation.z += 0.002;

      // Particles spiral inward
      const pa = pGeo.attributes.position.array as Float32Array;
      const absorbR = sphereR + 0.1;
      for (let i = 0; i < PC; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;
        const r = Math.sqrt(pa[ix]**2 + pa[iy]**2 + pa[iz]**2);
        if (r < absorbR) {
          resetParticle(i);
        } else {
          const inv = 1 / r;
          const speed = 0.012 + (1 / (r + 1)) * 0.005;
          pa[ix] -= pa[ix] * inv * speed - vel[ix];
          pa[iy] -= pa[iy] * inv * speed - vel[iy];
          pa[iz] -= pa[iz] * inv * speed - vel[iz];
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      if (fullscreen) window.removeEventListener("scroll", onScroll);
      sphereGeo.dispose(); sphereMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      ring2Geo.dispose(); ring2Mat.dispose();
      ring3Geo.dispose(); ring3Mat.dispose();
      pGeo.dispose(); pMat.dispose();
      bloom.dispose(); composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [isMobile, fullscreen]);

  if (isMobile) return <StaticFallback fullscreen={fullscreen} />;

  return (
    <div
      ref={containerRef}
      className={`${fullscreen ? "absolute inset-0" : "relative w-full h-full rounded-2xl"} overflow-hidden ${className}`}
      role="img"
      aria-label="Privacy visualization: transactions disappear into a cryptographic sphere"
    />
  );
}
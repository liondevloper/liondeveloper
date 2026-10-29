import { useEffect, useRef, type ReactNode } from 'react';
import { MOTION_ENABLED } from './effects';
import { useDepthCards } from './depth';
import ScrollWorld from './scroll-world';
import './theme.css';
// Light theme + 3D card depth. Loaded last so it wins over every older stylesheet.
import './light.css';

/* Real-time 3D backdrop drawn on one full-screen canvas behind the whole site:
   - a star field the visitor flies through; scrolling fast turns it into warp streaks
   - a rotating particle globe behind the hero that leans toward the mouse and ripples
   - particles scatter away from the cursor or finger
   Plain canvas maths (no extra library) with a capped pixel ratio so phones stay smooth. */

// Deeper tones so the particles read clearly on the light ivory background.
const PALETTE = ['239,106,40', '214,140,30', '10,150,182', '107,77,255'] as const;
const DEPTH = 1800;
const FOV = 560;
const SPREAD_X = 2600;
const SPREAD_Y = 1700;
const REPEL_RADIUS = 140;
const OFF_SCREEN = -9999;
const GLOBE_CAMERA = 2.8;

type Star = { x: number; y: number; z: number; size: number; color: string };
type GlobePoint = { x: number; y: number; z: number; color: string };

const paletteColor = (index: number): string => PALETTE[index % PALETTE.length] ?? PALETTE[0];

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * SPREAD_X,
    y: (Math.random() - 0.5) * SPREAD_Y,
    z: 1 + Math.random() * DEPTH,
    size: 0.5 + Math.random() * 1.5,
    // Mostly warm embers, with a few cool cyan and violet sparks.
    color: paletteColor(Math.random() < 0.7 ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2)),
  }));
}

// Evenly spread points over a sphere (Fibonacci lattice), warm on top and cool underneath.
function makeGlobe(count: number): GlobePoint[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = golden * index;
    const band = index % 11 === 0 ? 3 : y > 0.2 ? 0 : y > -0.25 ? 1 : 2;
    return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring, color: paletteColor(band) };
  });
}

function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const small = window.matchMedia('(max-width: 680px)').matches;
    const stars = makeStars(small ? 260 : 680);
    const globe = makeGlobe(small ? 320 : 660);
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, screenX: OFF_SCREEN, screenY: OFF_SCREEN };
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();
    let time = 0;
    let lastScroll = window.scrollY;
    let warp = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawStars = (dt: number) => {
      const speed = 1.2 + warp;
      const centerX = width / 2 - pointer.x * 120;
      const centerY = height / 2 - pointer.y * 90;
      for (const star of stars) {
        star.z -= speed * dt;
        if (star.z < 1) star.z += DEPTH;
        const scale = FOV / star.z;
        let sx = centerX + star.x * scale;
        let sy = centerY + star.y * scale;
        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

        const dx = sx - pointer.screenX;
        const dy = sy - pointer.screenY;
        const distance = Math.hypot(dx, dy);
        if (distance < REPEL_RADIUS && distance > 0.5) {
          const push = (1 - distance / REPEL_RADIUS) * 28;
          sx += (dx / distance) * push;
          sy += (dy / distance) * push;
        }

        const alpha = Math.min((1 - star.z / DEPTH) * 1.3, 1);
        const radius = Math.max(0.35, Math.min(star.size * scale * 0.8, 2.6));
        if (warp > 1.2) {
          const tail = FOV / (star.z + speed * 7);
          ctx.strokeStyle = `rgba(${star.color},${alpha})`;
          ctx.lineWidth = radius;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(centerX + star.x * tail, centerY + star.y * tail);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${star.color},${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawGlobe = () => {
      const anchor = document.querySelector<HTMLElement>('.hero-visual');
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      if (rect.width === 0 || rect.bottom < 0 || rect.top > height) return;

      const radius = Math.min(rect.width, rect.height) * (small ? 0.5 : 0.58);
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const turn = time * 0.005 + pointer.x * 1.3;
      const tilt = -0.4 + pointer.y * 0.8;
      const cosTurn = Math.cos(turn);
      const sinTurn = Math.sin(turn);
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.3);
      glow.addColorStop(0, 'rgba(255,122,61,0.12)');
      glow.addColorStop(0.6, 'rgba(139,108,255,0.05)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(centerX - radius * 1.3, centerY - radius * 1.3, radius * 2.6, radius * 2.6);

      for (const point of globe) {
        const ripple = 1 + Math.sin(time * 0.045 + point.y * 7) * 0.04;
        const x = point.x * ripple;
        const y = point.y * ripple;
        const z = point.z * ripple;
        const x1 = x * cosTurn - z * sinTurn;
        const z1 = x * sinTurn + z * cosTurn;
        const y2 = y * cosTilt - z1 * sinTilt;
        const z2 = y * sinTilt + z1 * cosTilt;
        const depth = GLOBE_CAMERA / (GLOBE_CAMERA + z2);
        // 1 on the side facing the visitor, 0 on the far side.
        const front = (1 - z2) / 2;
        ctx.fillStyle = `rgba(${point.color},${0.1 + front * 0.8})`;
        ctx.beginPath();
        ctx.arc(centerX + x1 * radius * depth, centerY + y2 * radius * depth, (0.5 + front * 1.5) * depth, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;
      time += dt;

      // Fast scrolling speeds the flight up into warp streaks, then it eases back.
      const scroll = window.scrollY;
      warp += (Math.min(Math.abs(scroll - lastScroll) * 0.35, 14) - warp) * Math.min(0.08 * dt, 1);
      lastScroll = scroll;
      pointer.x += (pointer.targetX - pointer.x) * Math.min(0.05 * dt, 1);
      pointer.y += (pointer.targetY - pointer.y) * Math.min(0.05 * dt, 1);

      // Normal blending: additive "lighter" blending turns every particle white on a light background.
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      drawStars(dt);
      drawGlobe();

      if (MOTION_ENABLED) frame = window.requestAnimationFrame(render);
    };

    const onResize = () => {
      resize();
      if (!MOTION_ENABLED) render(performance.now());
    };
    const onMove = (event: PointerEvent) => {
      pointer.targetX = event.clientX / width - 0.5;
      pointer.targetY = event.clientY / height - 0.5;
      pointer.screenX = event.clientX;
      pointer.screenY = event.clientY;
    };
    const onLeave = () => {
      pointer.screenX = OFF_SCREEN;
      pointer.screenY = OFF_SCREEN;
    };

    resize();
    frame = window.requestAnimationFrame(render);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas className="scene-3d" ref={canvasRef} aria-hidden="true" />;
}

// Puts the live 3D backdrop behind the public site (the admin panel stays plain).
// The scroll layer goes first so the particles draw on top of its colour washes and floor grid.
export function WithScene({ children }: { children: ReactNode }) {
  useDepthCards();
  return (
    <>
      <ScrollWorld />
      <Scene3D />
      {children}
    </>
  );
}

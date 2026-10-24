import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import './motion.css';

// Visitors who ask their OS for reduced motion get the plain, fully visible site.
export const MOTION_ENABLED =
  typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const finePointer = () => window.matchMedia('(pointer: fine)').matches;

// Stagger index read by the CSS transition delay of [data-reveal] elements.
export const stagger = (index: number) => ({ '--i': index }) as CSSProperties;

const SPOTLIGHT_TARGETS = '.service-card, .why-card, .price-card, .project-card';
const HOVER_TARGETS = 'a, button, .project-card, input, select, textarea, label';

// Reveals [data-reveal] elements as they scroll in. A data attribute is used instead of a class
// because React rewrites className on re-render, which would hide already revealed elements.
function useScrollReveal() {
  useEffect(() => {
    if (!MOTION_ENABLED) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-shown', '');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    const scan = () => document.querySelectorAll('[data-reveal]:not([data-shown])').forEach((el) => observer.observe(el));
    scan();
    // Content saved in the admin panel arrives after first paint, so newly mounted cards need observing too.
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);
}

// Card spotlight that follows the mouse, plus the 3D tilt and parallax on the hero mock browser.
function usePointerEffects() {
  useEffect(() => {
    if (!MOTION_ENABLED || !finePointer()) return;
    const onMove = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>(SPOTLIGHT_TARGETS);
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }

      const visual = document.querySelector<HTMLElement>('.hero-visual');
      if (!visual) return;
      const rect = visual.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      const px = inside ? (event.clientX - rect.left) / rect.width - 0.5 : 0;
      const py = inside ? (event.clientY - rect.top) / rect.height - 0.5 : 0;
      visual.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
      visual.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
      visual.style.setProperty('--px', px.toFixed(3));
      visual.style.setProperty('--py', py.toFixed(3));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}

export function useMotionEffects() {
  // Set before the first paint so hidden-until-revealed content never flashes, and only while the
  // public site is mounted so the admin panel is never affected.
  useLayoutEffect(() => {
    if (!MOTION_ENABLED) return;
    const root = document.documentElement;
    root.classList.add('motion-ready');
    return () => root.classList.remove('motion-ready', 'is-loaded');
  }, []);
  useScrollReveal();
  usePointerEffects();
}

// Branded intro: the lion fades in, a gold line fills, then the curtain lifts and the hero plays.
export function Preloader({ logo }: { logo: string }) {
  const [phase, setPhase] = useState<'show' | 'leave' | 'done'>(MOTION_ENABLED ? 'show' : 'done');

  useEffect(() => {
    const root = document.documentElement;
    if (!MOTION_ENABLED) {
      root.classList.add('is-loaded');
      return;
    }
    const leave = window.setTimeout(() => {
      setPhase('leave');
      root.classList.add('is-loaded');
    }, 1300);
    const done = window.setTimeout(() => setPhase('done'), 2150);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === 'done') return null;
  return (
    <div className={`preloader ${phase === 'leave' ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="preloader-inner">
        <img src={logo} alt="" width={454} height={480} />
        <span className="preloader-word">LION DEVELOPER</span>
        <div className="preloader-bar"><i /></div>
      </div>
    </div>
  );
}

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      barRef.current?.style.setProperty('transform', `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div className="scroll-progress" ref={barRef} aria-hidden="true" />;
}

// A gold dot with a trailing ring that grows over anything clickable. Desktop mice only.
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!MOTION_ENABLED || !finePointer() || !dot || !ring) return;

    const root = document.documentElement;
    let x = 0;
    let y = 0;
    let ringX = 0;
    let ringY = 0;
    let started = false;
    let frame = 0;

    const loop = () => {
      ringX += (x - ringX) * 0.18;
      ringY += (y - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frame = window.requestAnimationFrame(loop);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      x = event.clientX;
      y = event.clientY;
      if (!started) {
        started = true;
        ringX = x;
        ringY = y;
      }
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      root.classList.add('has-cursor');
      const target = event.target instanceof Element ? event.target : null;
      ring.classList.toggle('is-hover', Boolean(target?.closest(HOVER_TARGETS)));
    };
    const onLeave = () => root.classList.remove('has-cursor');

    window.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('mouseleave', onLeave);
    frame = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('mouseleave', onLeave);
      root.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true"><span /></div>
    </>
  );
}

// Endless ticker of what Lion Developer builds. The list is doubled so the loop has no visible seam.
export function Marquee({ items, variant = 'outline' }: { items: string[]; variant?: 'outline' | 'band' }) {
  const loop = [...items, ...items];
  return (
    <div className={`marquee marquee-${variant}`} aria-hidden="true">
      <div className="marquee-track">
        {loop.map((item, index) => (
          <span className="marquee-item" key={index}>
            {item}
            <i />
          </span>
        ))}
      </div>
    </div>
  );
}

// Counts the leading number of a stat ("50+", "100%", "24/7") up from zero once it scrolls into view.
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(() => (MOTION_ENABLED ? value.replace(/\d+/, '0') : value));

  useEffect(() => {
    const el = ref.current;
    const match = /^(\D*)(\d+)(.*)$/.exec(value);
    if (!MOTION_ENABLED || !el || !match) {
      setDisplay(value);
      return;
    }
    const [, prefix, digits, suffix] = match;
    const target = Number(digits);
    let frame = 0;
    setDisplay(`${prefix}0${suffix}`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 1600, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(`${prefix}${Math.round(target * eased)}${suffix}`);
          if (progress < 1) frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return <strong ref={ref}>{display}</strong>;
}

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
// Visible share of an element before it animates in.
const REVEAL_RATIO = 0.1;

// Reveals [data-reveal] elements as they scroll in, and hides them again once they are fully off screen,
// so every animation replays whether the visitor scrolls down or back up. A data attribute is used
// instead of a class because React rewrites className on re-render, which would reset the state.
function useScrollReveal() {
  useEffect(() => {
    if (!MOTION_ENABLED) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= REVEAL_RATIO) entry.target.setAttribute('data-shown', '');
          else if (!entry.isIntersecting) entry.target.removeAttribute('data-shown');
        });
      },
      { threshold: [0, REVEAL_RATIO] },
    );
    const watched = new WeakSet<Element>();
    const scan = () =>
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        observer.observe(el);
      });
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

// Countdown timing. Keep COUNT_STEP in sync with the .56s ld-count / ld-ring durations in motion.css.
const COUNT_FROM = 3;
const COUNT_STEP = 560;
const REVEAL_AT = COUNT_FROM * COUNT_STEP;
const LEAVE_AT = REVEAL_AT + 650;
const DONE_AT = LEAVE_AT + 850;

type PreloaderPhase = 'count' | 'reveal' | 'leave' | 'done';

// Branded intro: a frosted glass card counts 3-2-1 while a gold ring fills, the lion lands,
// then the curtain lifts and the hero plays.
export function Preloader({ logo }: { logo: string }) {
  const [phase, setPhase] = useState<PreloaderPhase>(MOTION_ENABLED ? 'count' : 'done');
  const [count, setCount] = useState(COUNT_FROM);

  useEffect(() => {
    const root = document.documentElement;
    if (!MOTION_ENABLED) {
      root.classList.add('is-loaded');
      return;
    }
    const ticks = Array.from({ length: COUNT_FROM - 1 }, (_, step) =>
      window.setTimeout(() => setCount(COUNT_FROM - 1 - step), COUNT_STEP * (step + 1)),
    );
    const timers = [
      ...ticks,
      window.setTimeout(() => setPhase('reveal'), REVEAL_AT),
      window.setTimeout(() => {
        setPhase('leave');
        root.classList.add('is-loaded');
      }, LEAVE_AT),
      window.setTimeout(() => setPhase('done'), DONE_AT),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  if (phase === 'done') return null;
  const counting = phase === 'count';
  return (
    <div className={`preloader is-${phase}`} aria-hidden="true">
      <div className="preloader-orb orb-a" />
      <div className="preloader-orb orb-b" />
      <div className="preloader-inner">
        <div className="preloader-glass">
          <svg className="preloader-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="56" />
            {/* Re-keyed every number so the ring refills from empty on each beat. */}
            <circle key={counting ? count : 'full'} className="ring-fill" cx="60" cy="60" r="56" pathLength={1} />
          </svg>
          {counting ? (
            <span className="preloader-count" key={count}>{count}</span>
          ) : (
            <img className="preloader-logo" src={logo} alt="" width={454} height={480} />
          )}
        </div>
        <span className="preloader-word" key={counting ? 'count' : 'brand'}>
          {counting ? 'GET READY' : 'LION DIGITAL SOLUTION'}
        </span>
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

// Endless ticker of what Lion Digital Solution builds. The list is doubled so the loop has no visible seam.
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

// Counts the leading number of a stat ("50+", "100%", "24/7") up from zero every time it scrolls into view.
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
        if (!entry) return;
        window.cancelAnimationFrame(frame);
        // Off screen: reset to zero so it counts up again next time.
        if (!entry.isIntersecting) {
          setDisplay(`${prefix}0${suffix}`);
          return;
        }
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

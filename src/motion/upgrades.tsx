import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { MOTION_ENABLED } from './effects';
import { Deck } from './showcase';
import './upgrades.css';
import './premium.css';
// Loaded after premium.css so its hero entrance timing wins.
import './intro.css';
import './splash.css';

// The menu button is now a 3D cube that opens a full-screen 3D menu (see menu3d.tsx).
export { default as DotsMenuButton } from './menu3d';

// "What I do" and "How it works" both auto-swipe on this beat, and keep going after a manual swipe.
export const AUTO_SWIPE_MS = 3000;

/* ------------------------------------------------------------- preloader */

// Three .9s dot beats plus a .6s brand reveal; splash.css uses the same 3.3s total.
const DOTS_FROM = 3;
const DOT_STEP = 900;
const BRAND_MS = 600;
const SPLASH_MS = DOTS_FROM * DOT_STEP + BRAND_MS;
const PROGRESS_START = 0;
const PROGRESS_MS = SPLASH_MS;
// The 3D blinds intro (intro.css) opens in about 2.3s.
const INTRO_MS = 2300;
const DONE_AT = SPLASH_MS + INTRO_MS;

const SPARKS = 16;
const BRAND = 'LION DIGITAL SOLUTION';
const ACCENT_LETTERS = 4;
// Panels open left to right, each a little after the one before, following the light beam.
const SLAT_START = 0.62;
const SLAT_STEP = 0.075;

type PreloaderPhase = 'splash' | 'leave' | 'done';
type VarStyle = CSSProperties & Record<`--${string}`, string>;

// Repeatable pseudo-random numbers keep spark positions stable.
const rand = (index: number, seed: number) => {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const slatStyle = (index: number, count: number): VarStyle => ({
  '--n': String(count),
  '--bx': `${count > 1 ? (index / (count - 1)) * 100 : 0}%`,
  '--d': `${(SLAT_START + index * SLAT_STEP).toFixed(3)}s`,
});

const sparkStyle = (index: number): VarStyle => ({
  '--a': `${((360 / SPARKS) * index + rand(index, 1) * 14).toFixed(1)}deg`,
  '--r': `${(22 + rand(index, 2) * 26).toFixed(1)}vmin`,
  '--d': `${(0.42 + rand(index, 3) * 0.12).toFixed(2)}s`,
});

const indexStyle = (index: number): VarStyle => ({ '--i': String(index) });

// The percent updates without rerendering the animated splash every frame.
function useSplashPercent() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const start = performance.now() + PROGRESS_START;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const progress = Math.min(Math.max((now - start) / PROGRESS_MS, 0), 1);
      if (ref.current) ref.current.textContent = `${Math.round(ease(progress) * 100)}%`;
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return ref;
}

// 3-2-1 glossy 3D dots flying through a square prism tunnel. No ring or circle surrounds the dots.
function Splash3D({ count }: { count: number }) {
  const percentRef = useSplashPercent();
  return (
    <div className="splash3d" aria-hidden="true">
      <div className="splash-tunnel">
        {Array.from({ length: 5 }, (_, index) => <i className="splash-frame" key={index} style={indexStyle(index)} />)}
      </div>
      <div className="splash-floor"><i /></div>
      <div className="splash-scene">
        {/* Re-keyed every beat so the flip-in animation replays for each number. */}
        <span className="splash-dots" key={count}>
          {Array.from({ length: count }, (_, index) => (
            <i className="splash-dot" key={index} style={indexStyle(index)}>
              <b />
              <span className="splash-dot-shadow" />
            </i>
          ))}
        </span>
        <span className="splash-ready">
          {Array.from('GET READY').map((letter, index) => letter === ' '
            ? <i className="splash-gap" key={index} />
            : <b key={index} style={indexStyle(index)}>{letter}</b>)}
        </span>
        <span className="splash-progress">
          <span className="splash-bar"><i /></span>
          <span className="splash-percent" ref={percentRef}>0%</span>
        </span>
        <span className="splash-brand">
          {Array.from(BRAND).map((letter, index) => letter === ' '
            ? <i className="splash-gap" key={index} />
            : <b className={index < ACCENT_LETTERS ? 'is-accent' : undefined} key={index} style={indexStyle(index)}>{letter}</b>)}
        </span>
      </div>
    </div>
  );
}

// After the splash: the lion spins inside two 3D gyroscope rings and bursts into sparks,
// a beam of light sweeps across, and the screen turns open in tall 3D panels to reveal the site.
function BlindsIntro({ logo, showLogo = true }: { logo: string; showLogo?: boolean }) {
  const [slats] = useState(() => (window.innerWidth < 680 ? 6 : 10));
  return (
    <div className="intro-blinds" aria-hidden="true">
      <div className="intro-slats" style={{ gridTemplateColumns: `repeat(${slats}, 1fr)` }}>
        {Array.from({ length: slats }, (_, index) => (
          <i className="intro-slat" key={index} style={slatStyle(index, slats)}>
            <span className="intro-slat-shade" />
            <span className="intro-slat-edge" />
          </i>
        ))}
      </div>
      <span className="intro-beam" />
      {showLogo && (
        <div className="intro-stage">
          <span className="intro-halo" />
          <span className="intro-orbit" />
          <span className="intro-orbit intro-orbit-2" />
          {Array.from({ length: SPARKS }, (_, index) => <i className="intro-spark" key={index} style={sparkStyle(index)} />)}
          <img className="intro-mark" src={logo} alt="" width={320} height={227} />
        </div>
      )}
    </div>
  );
}

// The installed app already shows the phone's own launch screen with the logo, so it skips ours.
const isInstalledApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// The splash plays only when a visitor first enters the website. Coming back to the home page
// during the same visit (from the blog, a service page or the Home link) skips it.
const SPLASH_SEEN_KEY = 'ld-splash-seen';

const splashAlreadySeen = () => {
  try {
    return window.sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markSplashSeen = () => {
  try {
    window.sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
  } catch {
    // Storage can be blocked (private mode); the splash then simply plays as before.
  }
};

export function DotPreloader({ logo }: { logo: string }) {
  const [isInstalled] = useState(isInstalledApp);
  const [skip] = useState(() => !MOTION_ENABLED || splashAlreadySeen());
  const [phase, setPhase] = useState<PreloaderPhase>(() => (skip ? 'done' : isInstalled ? 'leave' : 'splash'));
  const [count, setCount] = useState(DOTS_FROM);

  useEffect(() => {
    const root = document.documentElement;
    if (skip) {
      root.classList.add('is-loaded');
      return;
    }
    markSplashSeen();
    if (isInstalled) {
      root.classList.add('is-loaded');
      const timer = window.setTimeout(() => setPhase('done'), INTRO_MS);
      return () => window.clearTimeout(timer);
    }
    const ticks = Array.from({ length: DOTS_FROM - 1 }, (_, step) =>
      window.setTimeout(() => setCount(DOTS_FROM - 1 - step), DOT_STEP * (step + 1)),
    );
    const timers = [
      ...ticks,
      window.setTimeout(() => {
        setPhase('leave');
        root.classList.add('is-loaded');
      }, SPLASH_MS),
      window.setTimeout(() => setPhase('done'), DONE_AT),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [isInstalled, skip]);

  if (phase === 'done') return null;
  if (phase === 'leave') return <BlindsIntro logo={logo} showLogo={!isInstalled} />;
  return <Splash3D count={count} />;
}

/* ---------------------------------------------------------------- header */

// The header stays pinned; once the page moves it switches to its solid "scrolled" colour.
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return scrolled;
}

// Header height once it has shrunk into its scrolled state (see .is-scrolled .navbar in fixes.css).
const scrolledHeaderHeight = () => (window.matchMedia('(max-width: 680px)').matches ? 68 : 72);

// Every in-page link (#contact, #services...) lands with the section top just below the pinned header.
// The browser's own jump ignores the fixed header and lands mid-section, so the scroll is done here.
export function useAnchorScroll() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Swipe decks cancel clicks on back cards; those must not scroll the page.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      const hash = link?.getAttribute('href') ?? '';
      const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
      if (!target) return;
      event.preventDefault();
      const top = hash === '#home' ? 0 : target.getBoundingClientRect().top + window.scrollY - scrolledHeaderHeight();
      window.scrollTo({ top: Math.max(top, 0), behavior: MOTION_ENABLED ? 'smooth' : 'auto' });
      window.history.replaceState(null, '', hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

/* -------------------------------------------------------------- whatsapp */

// The official WhatsApp glyph (Simple Icons). lucide-react ships no brand logos.
export function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// Round WhatsApp-green button with just the logo and a soft pulse ring, fixed to the corner.
export function FloatingWhatsApp({ href }: { href: string }) {
  const external = href !== '#contact';
  return (
    <a
      className="floating-whatsapp"
      href={href}
      target={external ? '_blank' : undefined}
      rel="noreferrer"
      aria-label="Chat with Lion Digital Solution on WhatsApp"
      title="Chat on WhatsApp"
    >
      <span className="wa-ring" aria-hidden="true" />
      <WhatsAppIcon size={30} />
    </a>
  );
}

/* -------------------------------------------------------------- services */

type ServiceItem = { title: string; description: string; icon: string };

function ServiceDeckCard({ service, Icon }: { service: ServiceItem; Icon: LucideIcon }) {
  return (
    <article className="process-card service-deck-card">
      <div className="process-card-top">
        <span className="process-card-icon"><Icon size={24} /></span>
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <a className="service-deck-link" href="#contact">Start this project <ArrowUpRight size={15} /></a>
    </article>
  );
}

// The 8 services live in one 3D stack. It flips to the next card every 3 seconds; swiping up/down works too.
export function ServiceDeck({ services, resolveIcon }: { services: ServiceItem[]; resolveIcon: (name: string) => LucideIcon }) {
  return (
    <Deck
      key={services.length}
      items={services}
      axis="y"
      label="What I do"
      interval={AUTO_SWIPE_MS}
      persistent
      className="service-deck"
      renderCard={(service) => <ServiceDeckCard service={service} Icon={resolveIcon(service.icon)} />}
      aside={(current, go) => (
        <ol className="process-list service-list">
          {services.map((service, index) => (
            <li key={index}>
              <button type="button" className={index === current ? 'is-active' : index < current ? 'is-done' : ''} onClick={() => go(index)}>
                <b>{service.title}</b>
              </button>
            </li>
          ))}
        </ol>
      )}
    />
  );
}

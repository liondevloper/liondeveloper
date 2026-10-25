import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { MOTION_ENABLED } from './effects';
import { Deck } from './showcase';
import './upgrades.css';
import './premium.css';
// Loaded after premium.css so its hero entrance timing wins.
import './intro.css';
import './splash.css';

// "What I do" and "How it works" both auto-swipe on this beat, and keep going after a manual swipe.
export const AUTO_SWIPE_MS = 3000;

/* ------------------------------------------------------------- preloader */

// Premium 3D splash (splash.css): a metallic lion medallion spins in 3D while the brand name flips up
// and the progress bar fills. Keep SPLASH_MS in sync with the 3.15s exit fades in splash.css.
const SPLASH_MS = 3600;
const PROGRESS_START = 400;
const PROGRESS_MS = 2900;
// The 3D blinds intro (intro.css): logo spins + sparks, a light beam sweeps, panels turn open (~2.2s).
const DONE_AT = SPLASH_MS + 2300;

const SPARKS = 16;
const DUST = 18;
const COIN_LAYERS = 9;
const BRAND = 'LION DEVELOPER';
const ACCENT_LETTERS = 4;
// Panels open left to right, each a little after the one before, following the light beam.
const SLAT_START = 0.62;
const SLAT_STEP = 0.075;

type PreloaderPhase = 'splash' | 'leave' | 'done';
type VarStyle = CSSProperties & Record<`--${string}`, string>;

// Repeatable pseudo-random numbers so the sparks and dust always look the same.
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

const dustStyle = (index: number): VarStyle => ({
  '--x': `${(4 + rand(index, 5) * 92).toFixed(1)}%`,
  '--s': `${(3 + rand(index, 6) * 5).toFixed(1)}px`,
  '--t': `${(2.4 + rand(index, 7) * 2).toFixed(2)}s`,
  '--d': `${(rand(index, 8) * 2.4).toFixed(2)}s`,
});

// Stacked discs give the medallion a real metal edge while it spins.
const layerStyle = (index: number): VarStyle => ({ '--z': String(index - (COIN_LAYERS - 1) / 2) });
const letterStyle = (index: number): VarStyle => ({ '--i': String(index) });

// Counts the percent next to the bar in step with its fill. Writes straight to the DOM so React does not re-render every frame.
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

function Splash3D({ logo }: { logo: string }) {
  const percentRef = useSplashPercent();
  return (
    <div className="splash3d" aria-hidden="true">
      <div className="splash-floor"><i /></div>
      <span className="splash-glow" />
      {Array.from({ length: DUST }, (_, index) => <i className="splash-dust" key={index} style={dustStyle(index)} />)}
      <div className="splash-scene">
        <div className="splash-core">
          <span className="splash-ring" />
          <span className="splash-ring splash-ring-2" />
          <span className="splash-shadow" />
          <div className="splash-coin-wrap">
            <div className="splash-coin">
              {Array.from({ length: COIN_LAYERS }, (_, index) => <i className="splash-layer" key={index} style={layerStyle(index)} />)}
              <span className="splash-face">
                <img src={logo} alt="" width={454} height={480} />
                <i className="splash-shine" />
              </span>
              <span className="splash-face splash-face-back">
                <img src={logo} alt="" width={454} height={480} />
              </span>
            </div>
          </div>
        </div>
        <div className="splash-meta">
          <span className="splash-brand">
            {Array.from(BRAND).map((letter, index) =>
              letter === ' ' ? (
                <span className="splash-gap" key={index} />
              ) : (
                <span className={index < ACCENT_LETTERS ? 'is-accent' : undefined} key={index} style={letterStyle(index)}>{letter}</span>
              ),
            )}
          </span>
          <span className="splash-tag">WEBSITES THAT ROAR</span>
          <span className="splash-progress">
            <span className="splash-bar"><i /></span>
            <span className="splash-percent" ref={percentRef}>0%</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// After the splash: the lion spins inside two 3D gyroscope rings and bursts into sparks,
// a beam of light sweeps across, and the screen turns open in tall 3D panels to reveal the site.
function BlindsIntro({ logo }: { logo: string }) {
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
      <div className="intro-stage">
        <span className="intro-halo" />
        <span className="intro-orbit" />
        <span className="intro-orbit intro-orbit-2" />
        {Array.from({ length: SPARKS }, (_, index) => <i className="intro-spark" key={index} style={sparkStyle(index)} />)}
        <img className="intro-mark" src={logo} alt="" width={454} height={480} />
      </div>
    </div>
  );
}

export function DotPreloader({ logo }: { logo: string }) {
  const [phase, setPhase] = useState<PreloaderPhase>(MOTION_ENABLED ? 'splash' : 'done');

  useEffect(() => {
    const root = document.documentElement;
    if (!MOTION_ENABLED) {
      root.classList.add('is-loaded');
      return;
    }
    const timers = [
      window.setTimeout(() => {
        setPhase('leave');
        root.classList.add('is-loaded');
      }, SPLASH_MS),
      window.setTimeout(() => setPhase('done'), DONE_AT),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  if (phase === 'done') return null;
  if (phase === 'leave') return <BlindsIntro logo={logo} />;
  return <Splash3D logo={logo} />;
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

// Header height once it has shrunk into its scrolled state (see .is-scrolled .navbar in upgrades.css).
const scrolledHeaderHeight = () => (window.matchMedia('(max-width: 680px)').matches ? 74 : 82);

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

// Four coloured dots in a square (two on top, two below) instead of the usual three lines.
export function DotsMenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`menu-toggle dots-toggle ${open ? 'is-open' : ''}`}
      aria-label={open ? 'Close navigation' : 'Open navigation'}
      aria-expanded={open}
      onClick={onToggle}
    >
      <span className="dots-grid" aria-hidden="true"><i /><i /><i /><i /></span>
    </button>
  );
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
      aria-label="Chat with Lion Developer on WhatsApp"
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

import { useEffect, useState } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { MOTION_ENABLED } from './effects';
import { Deck } from './showcase';
import './upgrades.css';

/* ------------------------------------------------------------- preloader */

// Slower intro: each beat lasts a full second and shows dots (3, 2, 1) instead of numbers.
// Keep DOT_STEP in sync with the 1s .preloader-dots / ring-fill durations in upgrades.css.
const DOTS_FROM = 3;
const DOT_STEP = 1000;
const REVEAL_AT = DOTS_FROM * DOT_STEP;
const LEAVE_AT = REVEAL_AT + 1100;
const DONE_AT = LEAVE_AT + 1000;

type PreloaderPhase = 'count' | 'reveal' | 'leave' | 'done';

export function DotPreloader({ logo }: { logo: string }) {
  const [phase, setPhase] = useState<PreloaderPhase>(MOTION_ENABLED ? 'count' : 'done');
  const [count, setCount] = useState(DOTS_FROM);

  useEffect(() => {
    const root = document.documentElement;
    if (!MOTION_ENABLED) {
      root.classList.add('is-loaded');
      return;
    }
    const ticks = Array.from({ length: DOTS_FROM - 1 }, (_, step) =>
      window.setTimeout(() => setCount(DOTS_FROM - 1 - step), DOT_STEP * (step + 1)),
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
    <div className={`preloader preloader-slow is-${phase}`} aria-hidden="true">
      <div className="preloader-orb orb-a" />
      <div className="preloader-orb orb-b" />
      <div className="preloader-inner">
        <div className="preloader-glass">
          <svg className="preloader-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="56" />
            <circle key={counting ? count : 'full'} className="ring-fill" cx="60" cy="60" r="56" pathLength={1} />
          </svg>
          {counting ? (
            <span className="preloader-dots" key={count}>
              {Array.from({ length: count }, (_, index) => <i key={index} />)}
            </span>
          ) : (
            <img className="preloader-logo" src={logo} alt="" width={454} height={480} />
          )}
        </div>
        <span className="preloader-word" key={counting ? 'count' : 'brand'}>
          {counting ? 'GET READY' : 'LION DEVELOPER'}
        </span>
      </div>
    </div>
  );
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

function ServiceDeckCard({ service, index, total, Icon }: { service: ServiceItem; index: number; total: number; Icon: LucideIcon }) {
  const number = String(index + 1).padStart(2, '0');
  return (
    <article className="process-card service-deck-card">
      <div className="process-card-top">
        <span className="process-card-icon"><Icon size={24} /></span>
        <span className="process-card-count">{number} / {String(total).padStart(2, '0')}</span>
      </div>
      <span className="process-card-number" aria-hidden="true">{number}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <a className="service-deck-link" href="#contact">Start this project <ArrowUpRight size={15} /></a>
    </article>
  );
}

// The 8 services live in one 3D stack. Swiping up/down flips through the cards without moving the page.
export function ServiceDeck({ services, resolveIcon }: { services: ServiceItem[]; resolveIcon: (name: string) => LucideIcon }) {
  return (
    <Deck
      key={services.length}
      items={services}
      axis="y"
      label="What I do"
      interval={3400}
      className="service-deck"
      renderCard={(service, index) => (
        <ServiceDeckCard service={service} index={index} total={services.length} Icon={resolveIcon(service.icon)} />
      )}
      aside={(current, go) => (
        <ol className="process-list service-list">
          {services.map((service, index) => (
            <li key={index}>
              <button type="button" className={index === current ? 'is-active' : index < current ? 'is-done' : ''} onClick={() => go(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b>{service.title}</b>
              </button>
            </li>
          ))}
        </ol>
      )}
    />
  );
}

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

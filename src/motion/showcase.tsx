import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Monitor, Smartphone, X } from 'lucide-react';
import type { Template } from '@/data/site';
import { MOTION_ENABLED, stagger } from './effects';

/* ---------------------------------------------------------- screenshots */

// mShots (WordPress) renders the homepage of any public URL. The first request starts the capture and
// returns a blank frame, so a couple of retries are what actually land the finished screenshot.
const shotUrl = (url: string, attempt: number) =>
  `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200&h=945&retry=${attempt}`;

// Loads the screenshot off-screen and only swaps it in once it has decoded, so a card never flashes empty.
export function useSiteShot(url: string | undefined) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const target = (url ?? '').trim();
    setSrc(null);
    if (!/^https?:\/\//i.test(target)) return;

    let active = true;
    const load = (attempt: number) => {
      const image = new Image();
      image.onload = () => active && setSrc(image.src);
      image.src = shotUrl(target, attempt);
    };

    load(0);
    const timers = [window.setTimeout(() => load(1), 4000), window.setTimeout(() => load(2), 11000)];
    return () => {
      active = false;
      timers.forEach(window.clearTimeout);
    };
  }, [url]);

  return src;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/* ---------------------------------------------------------------- tilt */

// Any element with data-tilt leans toward the mouse in 3D. The value is the max angle (default 10deg).
// One window listener drives every card, so cards added later by the admin content work too.
export function useTiltEffect() {
  useEffect(() => {
    if (!MOTION_ENABLED || !window.matchMedia('(pointer: fine)').matches) return;
    let current: HTMLElement | null = null;

    const reset = (element: HTMLElement) => {
      element.style.removeProperty('--trx');
      element.style.removeProperty('--try');
      element.removeAttribute('data-tilting');
    };
    const onMove = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-tilt]') : null;
      if (current && current !== target) reset(current);
      current = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const strength = Number(target.dataset.tilt) || 10;
      target.style.setProperty('--try', `${(px * strength).toFixed(2)}deg`);
      target.style.setProperty('--trx', `${(-py * strength).toFixed(2)}deg`);
      target.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
      target.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
      target.setAttribute('data-tilting', '');
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      if (current) reset(current);
    };
  }, []);
}

/* ---------------------------------------------------------------- deck */

// A stack of cards that live in one spot and swipe through it: sideways as a 3D coverflow ("x"),
// or up and away like a deck of cards ("y").
type DeckAxis = 'x' | 'y';
type DeckPosition = 'active' | 'side' | 'next' | 'past' | 'hidden';

const SWIPE_DISTANCE = 40;
const MAX_VISIBLE = 2;

function deckOffset(index: number, active: number, count: number, axis: DeckAxis) {
  if (axis === 'y') return (index - active + count) % count;
  let offset = index - active;
  if (offset > count / 2) offset -= count;
  if (offset < -count / 2) offset += count;
  return offset;
}

function deckPosition(offset: number, count: number, axis: DeckAxis): DeckPosition {
  if (offset === 0) return 'active';
  if (axis === 'y' && count > 2 && offset === count - 1) return 'past';
  if (Math.abs(offset) > MAX_VISIBLE) return 'hidden';
  return axis === 'x' ? 'side' : 'next';
}

type DeckProps<T> = {
  items: T[];
  axis: DeckAxis;
  label: string;
  renderCard: (item: T, index: number, active: boolean) => ReactNode;
  // Autoplay delay in ms; 0 turns it off. Autoplay stops for good once the visitor takes control.
  interval?: number;
  initial?: number;
  className?: string;
  aside?: (current: number, go: (index: number) => void) => ReactNode;
};

export function Deck<T>({ items, axis, label, renderCard, interval = 0, initial = 0, className = '', aside }: DeckProps<T>) {
  const count = items.length;
  const [active, setActive] = useState(initial);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const start = useRef<number | null>(null);
  const swiped = useRef(false);

  const current = count ? ((active % count) + count) % count : 0;
  const autoplay = MOTION_ENABLED && interval > 0 && count > 1 && !touched;
  const running = autoplay && !hovered;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setActive((value) => value + 1), interval);
    return () => window.clearInterval(timer);
  }, [running, interval]);

  if (!count) return null;

  const go = (index: number) => {
    setActive(index);
    setTouched(true);
  };
  const step = (delta: number) => go(current + delta);
  const coordinate = (event: ReactPointerEvent) => (axis === 'x' ? event.clientX : event.clientY);

  const onPointerDown = (event: ReactPointerEvent) => {
    start.current = coordinate(event);
    swiped.current = false;
  };
  const onPointerUp = (event: ReactPointerEvent) => {
    if (start.current === null) return;
    const delta = coordinate(event) - start.current;
    start.current = null;
    if (Math.abs(delta) < SWIPE_DISTANCE) return;
    swiped.current = true;
    step(delta < 0 ? 1 : -1);
  };
  // A drag that ends on a button or link must not also click it.
  const onClickCapture = (event: ReactMouseEvent) => {
    if (!swiped.current) return;
    swiped.current = false;
    event.preventDefault();
    event.stopPropagation();
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = axis === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    const direction = keys.indexOf(event.key);
    if (direction === -1) return;
    event.preventDefault();
    step(direction === 0 ? -1 : 1);
  };

  const PrevIcon = axis === 'x' ? ChevronLeft : ChevronUp;
  const NextIcon = axis === 'x' ? ChevronRight : ChevronDown;

  return (
    <div
      className={`deck deck-${axis} ${aside ? 'deck-has-aside' : ''} ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {aside?.(current, go)}
      <div className="deck-main">
        <div
          className="deck-stage"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            start.current = null;
          }}
          onClickCapture={onClickCapture}
        >
          {items.map((item, index) => {
            const offset = deckOffset(index, current, count, axis);
            const position = deckPosition(offset, count, axis);
            const isActive = position === 'active';
            return (
              <div
                key={index}
                className="deck-card"
                data-pos={position}
                aria-hidden={!isActive}
                style={{ '--o': offset, '--a': Math.min(Math.abs(offset), MAX_VISIBLE + 1) } as CSSProperties}
                // Tapping a card in the back brings it forward instead of following its button.
                onClickCapture={
                  isActive
                    ? undefined
                    : (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        go(index);
                      }
                }
              >
                {renderCard(item, index, isActive)}
              </div>
            );
          })}
        </div>
        <div className="deck-controls">
          <button type="button" className="deck-arrow" onClick={() => step(-1)} aria-label="Previous card">
            <PrevIcon size={18} />
          </button>
          <div className="deck-dots">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === current ? 'is-active' : ''}
                onClick={() => go(index)}
                aria-label={`Show card ${index + 1}`}
              />
            ))}
          </div>
          <button type="button" className="deck-arrow" onClick={() => step(1)} aria-label="Next card">
            <NextIcon size={18} />
          </button>
        </div>
        {autoplay && (
          <div className={`deck-timer ${hovered ? 'is-paused' : ''}`} key={active} style={{ '--deck-ms': `${interval}ms` } as CSSProperties}>
            <i />
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- templates */

function TemplateCard({ template, index, onOpen }: { template: Template; index: number; onOpen: () => void }) {
  // An uploaded cover wins; without one the card captures the live homepage on its own.
  const shot = useSiteShot(template.image ? undefined : template.url);
  const image = template.image || shot;
  const tags = template.tags ?? [];

  return (
    <article className="template-card" data-reveal="scale" data-tilt="9" style={stagger(index)}>
      <div className="template-float" style={{ '--float-delay': `${index * -1.6}s` } as CSSProperties}>
        <div className="template-frame-outer">
          <div className="template-ring" aria-hidden="true" />
          <div className="template-browser">
            <div className="browser-bar">
              <span /><span /><span />
              <b>{hostOf(template.url)}</b>
              <em className="template-live"><i /> Live</em>
            </div>
            <div className="template-screen">
              {image ? (
                <img src={image} alt={`${template.title} homepage`} loading="lazy" draggable={false} />
              ) : (
                <div className="template-placeholder">
                  <span>{template.title}</span>
                  <small>Loading preview</small>
                </div>
              )}
              <div className="template-glare" aria-hidden="true" />
              <div className="template-overlay">
                <button type="button" className="button button-gold button-small" onClick={onOpen}>
                  <Eye size={15} /> Live preview
                </button>
                {template.url && (
                  <a className="button button-outline button-small" href={template.url} target="_blank" rel="noreferrer">
                    Open site <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="template-info">
          <div>
            <span className="template-category">{template.category}</span>
            <h3>{template.title}</h3>
          </div>
          <span className="template-index">{String(index + 1).padStart(2, '0')}</span>
        </div>
        {tags.length > 0 && (
          <div className="tech-row template-tags">
            {tags.map((tag, tagIndex) => <small key={tagIndex}>{tag}</small>)}
          </div>
        )}
      </div>
    </article>
  );
}

type Device = 'desktop' | 'mobile';

function TemplatePreview({ template, onClose }: { template: Template; onClose: () => void }) {
  const [device, setDevice] = useState<Device>('desktop');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop template-modal-backdrop" onClick={onClose}>
      <div className="template-modal" role="dialog" aria-modal="true" aria-label={`${template.title} live preview`} onClick={(event) => event.stopPropagation()}>
        <div className="template-modal-bar">
          <div className="template-modal-title">
            <span className="section-kicker">{template.category}</span>
            <b>{template.title}</b>
          </div>
          <div className="template-devices">
            <button type="button" className={device === 'desktop' ? 'is-active' : ''} onClick={() => setDevice('desktop')} aria-label="Desktop view">
              <Monitor size={15} />
            </button>
            <button type="button" className={device === 'mobile' ? 'is-active' : ''} onClick={() => setDevice('mobile')} aria-label="Mobile view">
              <Smartphone size={15} />
            </button>
          </div>
          <a className="button button-small button-gold" href={template.url} target="_blank" rel="noreferrer">
            Open site <ArrowUpRight size={14} />
          </a>
          <button type="button" className="template-close" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </div>
        <div className="template-frame-wrap">
          <div className={`template-frame is-${device}`}>
            {!loaded && <div className="template-frame-loading">Loading live preview</div>}
            <iframe src={template.url} title={`${template.title} live preview`} onLoad={() => setLoaded(true)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateShowcase({ templates }: { templates: Template[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const active = open === null ? null : templates[open] ?? null;

  return (
    <>
      <div className="template-grid">
        {templates.map((template, index) => (
          <TemplateCard key={index} template={template} index={index} onOpen={() => setOpen(index)} />
        ))}
      </div>
      {active && <TemplatePreview template={active} onClose={() => setOpen(null)} />}
    </>
  );
}

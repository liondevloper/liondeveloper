import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { stagger } from '@/motion/effects';
import { SHOWCASE } from './showcase-data';

const COLUMNS = 4;
const INDUSTRIES = ['Salons', 'Restaurants', 'Hotels', 'Gyms', 'Clinics', 'Boutiques', 'Cafes', 'Real estate', 'Coaching classes', 'Wedding planners', 'Travel agencies', 'Jewellery shops'];
// After a finger lifts off the photos, the wall waits this long and then starts moving again.
const TOUCH_RESUME_MS = 1200;

// Each column starts on a different design so neighbouring columns never show the same picture side by side.
const columnItems = (column: number) => SHOWCASE.map((_, index) => SHOWCASE[(index + column * 2) % SHOWCASE.length]);

// Phones keep a "hover" stuck after a tap, which froze the wall for good. So a touch pauses it only
// while the finger is down (plus a short moment); mouse users still pause it by hovering (CSS).
function useTouchPause() {
  const [paused, setPaused] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    window.clearTimeout(timer.current);
    setPaused(true);
  };
  const onPointerEnd = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPaused(false), TOUCH_RESUME_MS);
  };

  return { paused, handlers: { onPointerDown, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onPointerLeave: onPointerEnd } };
}

// Aceternity-style 3D marquee: a tilted wall of website designs scrolling up and down in alternating columns.
export default function IndustryMarquee() {
  const { paused, handlers } = useTouchPause();

  return (
    <section className="ld-industries section-pad" id="industries">
      <div className="section-heading">
        <div>
          <span className="section-kicker" data-reveal>Made for local businesses</span>
          <h2 data-reveal="clip">Websites for every<br /><em>kind of business.</em></h2>
        </div>
        <p data-reveal style={stagger(2)}>
          Salon, restaurant, hotel, gym or clinic: each website is planned around how your customers book, order and enquire, so visitors turn into real customers.
        </p>
      </div>

      <div className={`ld-marquee3d${paused ? ' is-paused' : ''}`} aria-hidden="true" {...handlers}>
        <div className="ld-marquee3d-plane">
          {Array.from({ length: COLUMNS }, (_, column) => {
            const items = columnItems(column);
            return (
              <div
                className={`ld-marquee3d-col${column % 2 ? ' is-down' : ''}`}
                key={column}
                style={{ '--d': `${30 + column * 5}s` } as CSSProperties}
              >
                {/* Doubled so the loop has no visible seam. */}
                {[...items, ...items].map((item, index) => (
                  <img key={index} src={item.image} alt="" loading="lazy" decoding="async" width={1400} height={1050} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ld-industry-chips">
        {INDUSTRIES.map((name, index) => (
          <span key={name} data-reveal="scale" style={stagger(index)}>{name}</span>
        ))}
      </div>
    </section>
  );
}

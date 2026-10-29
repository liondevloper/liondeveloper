import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { MOTION_ENABLED, stagger } from '@/motion/effects';
import { SHOWCASE } from './showcase-data';

const SWITCH_MS = 3400;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// Aceternity-style "container scroll": the screen starts tilted back in 3D and settles flat as it scrolls in.
// --p goes from 0 (section just entering) to 1 (screen fully flat) and drives the CSS in studio.css.
export default function ScrollShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!MOTION_ENABLED) {
      section.style.setProperty('--p', '1');
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      section.style.setProperty('--p', clamp01((vh - rect.top) / (vh * 0.95)).toFixed(3));
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

  // The screen flips through the sample designs; clicking a tab restarts the timer from that design.
  useEffect(() => {
    if (!MOTION_ENABLED) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % SHOWCASE.length), SWITCH_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  const current = SHOWCASE[active];

  return (
    <section className="ld-showcase section-pad" id="showcase" ref={sectionRef}>
      <div className="center-heading ld-showcase-head">
        <span className="section-kicker" data-reveal>Built for your customers</span>
        <h2 data-reveal="clip">Your business,<br /><em>beautifully online.</em></h2>
        <p data-reveal style={stagger(2)}>
          Sample designs for the kinds of businesses I work with. Every website is designed fresh around your brand, your services and the way your customers like to book.
        </p>
      </div>

      <div className="ld-device">
        <div className="ld-device-glow" aria-hidden="true" />
        <div className="ld-device-frame">
          <div className="ld-device-bar">
            <span /><span /><span />
            <b><ShieldCheck size={12} />{current.domain}</b>
          </div>
          <div className="ld-device-screen">
            {SHOWCASE.map((item, index) => (
              <img
                key={item.title}
                src={item.image}
                alt={`${item.title} website sample design`}
                className={index === active ? 'is-active' : ''}
                loading="lazy"
                decoding="async"
                width={1400}
                height={1050}
              />
            ))}
            <span className="ld-device-tag" key={current.tag}>{current.tag}</span>
          </div>
        </div>
      </div>

      <div className="ld-device-tabs" role="tablist" aria-label="Sample designs">
        {SHOWCASE.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? 'is-active' : ''}
            onClick={() => setActive(index)}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="ld-showcase-cta">
        <a className="button button-gold" href="#contact">Get a website like this <ArrowUpRight size={18} /></a>
      </div>
    </section>
  );
}

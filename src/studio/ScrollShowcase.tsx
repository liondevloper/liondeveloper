import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { WorkVideo } from '@/data/site';
import { MOTION_ENABLED } from '@/motion/effects';
import StickyVideos from '@/motion/sticky-videos';
import { SHOWCASE } from './showcase-data';
import ScrollAssemble from './ScrollAssemble';
import './assemble.css';

const SWITCH_MS = 3400;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// "Built for your customers" section. The old "Recent work" section was merged in here (on request):
// when the admin panel has work videos they play in the sticky video stack; until then the sample designs
// flip on the tilted 3D screen (Aceternity-style "container scroll", driven by --p in studio.css).
export default function ScrollShowcase({ videos }: { videos: WorkVideo[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const hasVideos = videos.length > 0;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || hasVideos) return;
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
  }, [hasVideos]);

  // The screen flips through the sample designs; clicking a tab restarts the timer from that design.
  useEffect(() => {
    if (!MOTION_ENABLED || hasVideos) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % SHOWCASE.length), SWITCH_MS);
    return () => window.clearTimeout(timer);
  }, [active, hasVideos]);

  const current = SHOWCASE[active];

  const heading = (
    <div className="center-heading ld-showcase-head">
      <span className="section-kicker" data-reveal>Built for your customers</span>
      <h2 data-reveal="clip">Your business,<br /><em>beautifully online.</em></h2>
    </div>
  );

  const cta = (
    <div className="ld-showcase-cta">
      <a className="button button-gold" href="#contact">Get a website like this <ArrowUpRight size={18} /></a>
    </div>
  );

  // The scroll story plays first, so both scroll pieces sit together in one spot on the page.
  return (
    <>
    <ScrollAssemble />
    {hasVideos ? (
      // work-section keeps the sticky-stack fixes from sticky-videos.css (no section scaling, no overflow clipping).
      <section className="ld-showcase work-section is-videos section-pad" id="work" ref={sectionRef}>
        {heading}
        <StickyVideos videos={videos} />
        {cta}
      </section>
    ) : (
      <section className="ld-showcase section-pad" id="work" ref={sectionRef}>
        {heading}

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
                  alt={`${item.title} website design`}
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

        <div className="ld-device-tabs" role="tablist" aria-label="Website designs">
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

        {cta}
      </section>
    )}
    </>
  );
}

import { useEffect, useRef, type CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { WorkVideo } from '@/data/site';
import { MOTION_ENABLED } from './effects';
import './sticky-videos.css';

/* Work videos stacked like the Skiper "sticky card" effect: every card sticks near the top of the screen,
   and while the next card slides up over it, it shrinks, tilts, blurs and dims into the background.
   Plain scroll maths (no animation library), one scroll listener for the whole stack.
   A video only plays while its card is on screen and not fully covered, so phones stay smooth and save data. */

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export default function StickyVideos({ videos }: { videos: WorkVideo[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const cards = Array.from(list.querySelectorAll<HTMLElement>('.work-card'));
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const next = cards[index + 1];
        // 0 while the next card is still below the screen, 1 once it has slid fully over this one.
        const covered = next ? clamp01((vh - next.getBoundingClientRect().top) / Math.max(vh - rect.top, 1)) : 0;
        if (MOTION_ENABLED) card.style.setProperty('--p', covered.toFixed(3));

        const video = card.querySelector('video');
        if (!video) return;
        const visible = rect.bottom > 0 && rect.top < vh && covered < 0.98;
        if (visible && video.paused) {
          video.muted = true;
          void video.play().catch(() => {});
        } else if (!visible && !video.paused) {
          video.pause();
        }
      });
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
  }, [videos.length]);

  return (
    <div className="work-stack" ref={listRef}>
      {videos.map((item, index) => (
        <article className="work-card" key={`${item.video}-${index}`} style={{ '--i': index } as CSSProperties}>
          <div className="work-card-inner">
            <video src={item.video} muted loop playsInline preload="metadata" aria-label={`${item.title || 'Project'} video`} />
            <div className="work-card-shade" aria-hidden="true" />
            <div className="work-card-dim" aria-hidden="true" />
            <span className="work-card-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="work-card-info">
              <div>
                {item.category && <span className="work-card-category">{item.category}</span>}
                {item.title && <h3>{item.title}</h3>}
              </div>
              {item.url && (
                <a className="button button-gold button-small" href={item.url} target="_blank" rel="noreferrer">
                  Open site <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

import { useRef, type CSSProperties, type SyntheticEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { WorkVideo } from '@/data/site';
import { useStickyStack } from './sticky-stack';
import './sticky-videos.css';

/* Work videos stacked like the Skiper "sticky card" effect (scroll maths in sticky-stack.ts).
   A video only plays (muted) while its card is on screen and not fully covered, so phones stay smooth and save data. */

function playWhenVisible(card: HTMLElement, visible: boolean) {
  const video = card.querySelector('video');
  if (!video) return;
  if (visible && video.paused) {
    video.muted = true;
    void video.play().catch(() => {});
  } else if (!visible && !video.paused) {
    video.pause();
  }
}

// Uploaded videos come in any shape (wide screen recordings, tall phone recordings). The card takes the
// video's own aspect ratio, so the whole video shows without being cropped.
function fitCardToVideo(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (!video.videoWidth || !video.videoHeight) return;
  video.closest<HTMLElement>('.work-card')?.style.setProperty('--ar', String(video.videoWidth / video.videoHeight));
}

export default function StickyVideos({ videos }: { videos: WorkVideo[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  useStickyStack(listRef, '.work-card', videos.length, playWhenVisible);

  return (
    <div className="work-stack" ref={listRef}>
      {videos.map((item, index) => (
        <article className="work-card" key={`${item.video}-${index}`} style={{ '--i': index } as CSSProperties}>
          <div className="work-card-inner">
            <video src={item.video} muted loop playsInline preload="metadata" onLoadedMetadata={fitCardToVideo} aria-label={`${item.title || 'Project'} video`} />
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

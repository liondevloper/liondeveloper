import { useEffect } from 'react';
import { MOTION_ENABLED } from './effects';
import './scroll-world.css';

/* Cinematic scroll layer, inspired by GetLayers' scroll scenes and 21st.dev's "Perspective Tunnel" /
   "Horizon Glow" heroes:
   - colour light washes behind the site that drift, turn and change colour as the page scrolls
   - a 3D perspective floor grid that rolls toward the visitor while scrolling, with a glowing horizon
   - the hero tilts back into 3D and fades as you scroll past it
   Scroll position is written to CSS variables once per frame; all movement is plain CSS transforms. */

function writeScrollVars() {
  const root = document.documentElement;
  const max = Math.max(root.scrollHeight - window.innerHeight, 1);
  const y = window.scrollY;
  const hero = document.querySelector<HTMLElement>('.hero');
  const heroHeight = hero?.offsetHeight || window.innerHeight;
  root.style.setProperty('--sw-y', y.toFixed(0));
  root.style.setProperty('--sw-p', Math.min(y / max, 1).toFixed(4));
  root.style.setProperty('--sw-hero', Math.min(Math.max(y / heroHeight, 0), 1).toFixed(4));
}

export default function ScrollWorld() {
  useEffect(() => {
    if (!MOTION_ENABLED) return;
    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(() => {
        frame = 0;
        writeScrollVars();
      });
    };
    writeScrollVars();
    document.documentElement.classList.add('scroll-world-on');
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.documentElement.classList.remove('scroll-world-on');
    };
  }, []);

  return (
    <div className="scroll-world" aria-hidden="true">
      <i className="sw-wash sw-wash-a" />
      <i className="sw-wash sw-wash-b" />
      <i className="sw-wash sw-wash-c" />
      <div className="sw-floor-wrap">
        <div className="sw-horizon" />
        <div className="sw-floor" />
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { MOTION_ENABLED } from './effects';

// Extra cards that lean toward the mouse in 3D (value = max tilt angle in degrees).
// Cards that already have data-tilt in App.tsx keep their own value.
const TILT_TARGETS: ReadonlyArray<readonly [string, number]> = [
  ['.stat', 16],
  ['.price-card', 8],
  ['.process-card', 7],
  ['.care-price-option', 8],
  ['.tech-cloud span', 20],
  ['.feature-browser', 7],
];

// Tags the cards with data-tilt so the shared tilt effect (useTiltEffect in showcase.tsx) drives them.
// Content saved in the admin panel arrives after first paint, so new cards are tagged as they mount.
export function useDepthCards() {
  useEffect(() => {
    if (!MOTION_ENABLED || !window.matchMedia('(pointer: fine)').matches) return;
    const tag = () => {
      for (const [selector, strength] of TILT_TARGETS) {
        document
          .querySelectorAll<HTMLElement>(`.site-shell ${selector}:not([data-tilt])`)
          .forEach((element) => element.setAttribute('data-tilt', String(strength)));
      }
    };
    tag();
    const observer = new MutationObserver(tag);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

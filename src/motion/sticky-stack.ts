import { useEffect, type RefObject } from 'react';
import { MOTION_ENABLED } from './effects';

/* Shared scroll maths for the "sticky card" stacks (work videos, website plans). Every card sticks near the
   top of the screen; while the next card slides up over it, the card gets a --p value from 0 to 1 that the
   CSS uses to shrink, tilt and dim it. One frame-throttled scroll listener per stack. */

export type StackFrame = (card: HTMLElement, visible: boolean) => void;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function useStickyStack(listRef: RefObject<HTMLElement | null>, selector: string, count: number, onFrame?: StackFrame) {
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const cards = Array.from(list.querySelectorAll<HTMLElement>(selector));
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const next = cards[index + 1];
        // 0 while the next card is still below the screen, 1 once it has slid fully over this one.
        const covered = next ? clamp01((vh - next.getBoundingClientRect().top) / Math.max(vh - rect.top, 1)) : 0;
        if (MOTION_ENABLED) card.style.setProperty('--p', covered.toFixed(3));
        onFrame?.(card, rect.bottom > 0 && rect.top < vh && covered < 0.98);
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
  }, [listRef, selector, count, onFrame]);
}

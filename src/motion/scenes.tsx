import { useEffect, type CSSProperties } from 'react';
import { Code2, Gauge, MessageCircle, Palette, Rocket, Search, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react';
import { MOTION_ENABLED } from './effects';
import './scenes.css';

/* Scroll-driven 3D scenes, inspired by premium scroll-story sites.
   Every top-level section gets two CSS variables that follow the scroll:
   --e (enter): 0 when the section top reaches the bottom of the screen, 1 once it is well inside.
   --l (leave): 0 while the section top is at the top of the screen, 1 once it has scrolled fully past.
   scenes.css turns them into depth: the hero browser tilts back and sinks away, headings flip up
   in 3D, and the "ballet" chips swirl into place around the feature browser. */

const SCENE_SELECTOR = 'main > section';
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function useScrollScenes() {
  useEffect(() => {
    if (!MOTION_ENABLED) return;
    const last = new WeakMap<Element, string>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      // Queried each frame because sections saved in the admin panel can mount after first paint.
      document.querySelectorAll<HTMLElement>(SCENE_SELECTOR).forEach((section) => {
        const rect = section.getBoundingClientRect();
        const enter = clamp01((vh - rect.top) / (vh * 0.75)).toFixed(3);
        const leave = clamp01(-rect.top / Math.max(rect.height, 1)).toFixed(3);
        const key = `${enter}|${leave}`;
        if (last.get(section) === key) return;
        last.set(section, key);
        section.style.setProperty('--e', enter);
        section.style.setProperty('--l', leave);
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
  }, []);
}

/* ------------------------------------------------- feature "ballet" chips */

type VarStyle = CSSProperties & Record<`--${string}`, string>;

const BALLET: { label: string; icon: LucideIcon }[] = [
  { label: 'Clean code', icon: Code2 },
  { label: 'Mobile first', icon: Smartphone },
  { label: 'Fast loading', icon: Gauge },
  { label: 'Secure', icon: ShieldCheck },
  { label: 'SEO ready', icon: Search },
  { label: 'WhatsApp', icon: MessageCircle },
  { label: 'Custom design', icon: Palette },
  { label: 'Quick launch', icon: Rocket },
];
// Slightly uneven distances so the finished ring looks hand placed, not mechanical.
const BALLET_RADIUS = [232, 252, 218, 262, 236, 248, 222, 256];

const chipStyle = (index: number): VarStyle => ({
  '--i': String(index),
  '--a': `${index * 45 - 22}deg`,
  '--r': `${BALLET_RADIUS[index % BALLET_RADIUS.length] ?? 240}px`,
});

// Labelled feature chips that spiral in from the centre and settle around the browser as you scroll.
export function ScrollBallet() {
  return (
    <div className="ballet" aria-hidden="true">
      {BALLET.map(({ label, icon: Icon }, index) => (
        <span className="ballet-chip" key={label} style={chipStyle(index)}>
          <i />
          <Icon size={13} />
          {label}
        </span>
      ))}
    </div>
  );
}

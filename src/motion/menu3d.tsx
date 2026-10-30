import { useEffect, useState, type AnimationEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from 'lucide-react';
import './menu3d.css';

/* Phone menu: a small 3D cube button (four brand dots on the front, an X on the back) that flips over,
   and a full-screen dark menu that opens in a circle from the button. Behind the links a glowing 3D grid
   floor moves forward and three rings spin; every link folds down into place like a 3D card.
   The menu is rendered on <body>, because the pinned header's blur effect would otherwise trap it. */

// Same sections as the desktop links in App.tsx.
const MENU_ITEMS = ['Home', 'Services', 'Work', 'Pricing', 'About', 'Contact'];
const LOCK_CLASS = 'm3d-lock';

const unlockPage = () => document.documentElement.classList.remove(LOCK_CLASS);
const indexStyle = (index: number) => ({ '--i': index }) as CSSProperties;

function MenuCube({ open }: { open: boolean }) {
  return (
    <span className={`m3d-cube ${open ? 'is-open' : ''}`} aria-hidden="true">
      <span className="m3d-face m3d-front"><i /><i /><i /><i /></span>
      <span className="m3d-face m3d-back"><b /><b /></span>
    </span>
  );
}

type OverlayProps = { closing: boolean; onClose: () => void; onGone: () => void };

function MenuOverlay({ closing, onClose, onGone }: OverlayProps) {
  // Only the overlay's own open/close animation decides when it leaves, not the links or rings inside it.
  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (closing && event.target === event.currentTarget) onGone();
  };

  return createPortal(
    <div
      className={`m3d-overlay ${closing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="m3d-bg" aria-hidden="true">
        <span className="m3d-orb m3d-orb-a" />
        <span className="m3d-orb m3d-orb-b" />
        <div className="m3d-rings"><i /><i /><i /></div>
        <div className="m3d-floor" />
      </div>

      <div className="m3d-top">
        <span className="m3d-label">Lion Digital Solution</span>
        <button type="button" className="m3d-close" aria-label="Close navigation" onClick={onClose} autoFocus>
          <MenuCube open />
        </button>
      </div>

      <nav className="m3d-links" aria-label="Main">
        {MENU_ITEMS.map((item, index) => (
          <a key={item} className="m3d-link" href={`#${item.toLowerCase()}`} style={indexStyle(index)} onClick={onClose}>
            <span>{item}</span>
            <ArrowUpRight size={26} />
          </a>
        ))}
      </nav>

      <a className="m3d-cta" href="#contact" style={indexStyle(MENU_ITEMS.length)} onClick={onClose}>
        Get a Website <ArrowUpRight size={18} />
      </a>
    </div>,
    document.body,
  );
}

export default function DotsMenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  // Stays mounted while the closing animation plays, then removes itself.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!open) {
      unlockPage();
      return;
    }
    document.documentElement.classList.add(LOCK_CLASS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onToggle]);

  // The page is unlocked right away, so a link's smooth scroll to its section works while the menu closes.
  const close = () => {
    unlockPage();
    if (open) onToggle();
  };

  return (
    <>
      <button
        type="button"
        className={`menu-toggle dots-toggle m3d-btn ${open ? 'is-open' : ''}`}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={onToggle}
      >
        <MenuCube open={open} />
      </button>
      {mounted && <MenuOverlay closing={!open} onClose={close} onGone={() => setMounted(false)} />}
    </>
  );
}

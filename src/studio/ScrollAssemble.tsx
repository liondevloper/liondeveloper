import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarCheck2, MessageCircle, Scissors, Sparkles, Star } from 'lucide-react';
import { MOTION_ENABLED } from '@/motion/effects';

/* Scroll story inspired by food "scrollytelling" sites: the pieces of a client website float apart in 3D,
   then fly in and click into place on the screen as the visitor scrolls, and the site goes live.
   JS only writes --p (0-1 scroll progress through the pinned section); all movement is CSS in assemble.css. */

type Piece = { id: string; label: string; x: number; y: number; r: number; s: number };

// x/y: start offset in vw/vh, r: start spin in deg, s: progress at which the piece starts flying in.
const PIECES: Piece[] = [
  { id: 'nav', label: 'Your logo & menu', x: -26, y: -30, r: -14, s: 0.04 },
  { id: 'photo', label: 'Your photos', x: 30, y: -26, r: 16, s: 0.08 },
  { id: 'title', label: 'Words that sell', x: -36, y: 4, r: 10, s: 0.12 },
  { id: 'stars', label: 'Google reviews', x: 10, y: -38, r: -22, s: 0.16 },
  { id: 'cards', label: 'Your services', x: 28, y: 30, r: -12, s: 0.2 },
  { id: 'cta', label: 'Book now button', x: -24, y: 32, r: -20, s: 0.24 },
  { id: 'booking', label: 'Online booking', x: 40, y: 2, r: 22, s: 0.28 },
  { id: 'whatsapp', label: 'WhatsApp chat', x: -40, y: -12, r: 26, s: 0.32 },
];

const STAGES = [
  { no: '01', name: 'The idea', title: 'Every piece of', accent: 'your business.' },
  { no: '02', name: 'The build', title: 'Designed', accent: 'piece by piece.' },
  { no: '03', name: 'The launch', title: 'Your customers', accent: 'are waiting.' },
];

const PHOTO = 'https://hercules-cdn.com/cdn-cgi/image/w=900,quality=78,fit=scale-down,format=auto/file_BHVzdcRhXpFF06qN7vI1Hhc2';
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const stageFor = (p: number) => (p < 0.3 ? 0 : p < 0.74 ? 1 : 2);

function PieceBody({ id }: { id: string }) {
  switch (id) {
    case 'nav':
      return <><b><Scissors size={12} />Glow Studio</b><span>Services</span><span>Prices</span><span>Contact</span></>;
    case 'photo':
      return <img src={PHOTO} alt="" loading="lazy" decoding="async" width={900} height={675} />;
    case 'title':
      return <><small>Hair · Skin · Nails</small><strong>Look good.<br /><em>Feel better.</em></strong></>;
    case 'stars':
      return <><span>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={10} fill="currentColor" />)}</span>4.9 on Google</>;
    case 'cards':
      return <>{['Haircut', 'Facial', 'Bridal'].map((name) => <i key={name}><Sparkles size={11} />{name}</i>)}</>;
    case 'cta':
      return <>Book now <ArrowUpRight size={12} /></>;
    case 'booking':
      return <><small><CalendarCheck2 size={11} />Today</small>{['11:00', '1:30', '4:00'].map((time, i) => <i key={time} className={i === 1 ? 'is-on' : ''}>{time}</i>)}</>;
    case 'whatsapp':
      return <MessageCircle size={14} />;
    default:
      return null;
  }
}

export default function ScrollAssemble() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(MOTION_ENABLED ? 0 : 2);

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
      const travel = Math.max(rect.height - window.innerHeight, 1);
      const p = clamp01(-rect.top / travel);
      section.style.setProperty('--p', p.toFixed(4));
      setStage(stageFor(p));
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

  const current = STAGES[stage] ?? STAGES[0];

  return (
    <section className={`ld-asm is-stage-${stage}`} ref={sectionRef} aria-label="How your website comes together">
      <div className="ld-asm-sticky">
        <div className="ld-asm-copy" key={current.no}>
          <span className="section-kicker">{current.no} — {current.name}</span>
          <h2>{current.title}<br /><em>{current.accent}</em></h2>
        </div>

        <div className="ld-asm-stage">
          <div className="ld-asm-glow" aria-hidden="true" />
          <div className="ld-asm-frame">
            <div className="ld-asm-bar" aria-hidden="true">
              <span /><span /><span />
              <b>glowstudio.in</b>
              <em>LIVE</em>
            </div>
            <div className="ld-asm-screen">
              {PIECES.map((piece) => (
                <div
                  key={piece.id}
                  className={`ld-asm-piece ld-asm-${piece.id}`}
                  style={{ '--x': piece.x, '--y': piece.y, '--r': piece.r, '--s': piece.s } as CSSProperties}
                >
                  <PieceBody id={piece.id} />
                  <span className="ld-asm-label" aria-hidden="true">{piece.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ld-asm-action">
          <a className="button button-gold" href="#contact">Start my website <ArrowUpRight size={18} /></a>
        </div>

        <div className="ld-asm-dots" aria-hidden="true">
          {STAGES.map((item, index) => <i key={item.no} className={index === stage ? 'is-on' : ''} />)}
        </div>
      </div>
    </section>
  );
}

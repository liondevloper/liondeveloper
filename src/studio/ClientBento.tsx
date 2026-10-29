import type { CSSProperties, PointerEvent } from 'react';
import { LayoutDashboard, MessageCircle, Rocket, Search, Smartphone, type LucideIcon } from 'lucide-react';
import { stagger } from '@/motion/effects';
import { SHOWCASE } from './showcase-data';

type Visual = 'timeline' | 'chat' | 'dashboard' | 'search' | 'devices';
type BentoCard = { title: string; text: string; icon: LucideIcon; visual: Visual; wide?: boolean };

const CARDS: BentoCard[] = [
  { title: 'Live in 1–3 days', text: 'No months of waiting. Most websites go live in 1–3 days, depending on the website.', icon: Rocket, visual: 'timeline', wide: true },
  { title: 'Enquiries on WhatsApp', text: 'Customers tap once and message you directly, so no lead gets lost.', icon: MessageCircle, visual: 'chat' },
  { title: 'Admin panel when you need it', text: 'Manage bookings, products and content from a simple dashboard.', icon: LayoutDashboard, visual: 'dashboard' },
  { title: 'Ready for Google', text: 'SEO basics, fast loading and clean code so local customers can find you.', icon: Search, visual: 'search' },
  { title: 'Perfect on every screen', text: 'Designed mobile-first, because most customers visit from their phone.', icon: Smartphone, visual: 'devices' },
];

const DAYS = ['Day 1 · Design', 'Day 2 · Build', 'Day 3 · Launch'];
const BARS = [42, 68, 55, 84, 62, 92, 76];

function CardVisual({ kind }: { kind: Visual }) {
  switch (kind) {
    case 'timeline':
      return (
        <div className="ld-v-timeline">
          {DAYS.map((label, index) => (
            <div key={label} style={stagger(index)}><span>{label}</span><i /></div>
          ))}
        </div>
      );
    case 'chat':
      return (
        <div className="ld-v-chat">
          <p className="is-in">Hi! Is Saturday 4 pm free for a haircut?</p>
          <p className="is-out">Yes, you are booked for Saturday.</p>
        </div>
      );
    case 'dashboard':
      return (
        <div className="ld-v-dashboard">
          <small>Bookings this week</small>
          <div>{BARS.map((height, index) => <i key={index} style={{ '--h': `${height}%`, '--i': index } as CSSProperties} />)}</div>
        </div>
      );
    case 'search':
      return (
        <div className="ld-v-search">
          <div className="ld-v-search-bar"><Search size={12} />salon near me</div>
          <div className="ld-v-search-result">
            <small>yourbusiness.com</small>
            <b>Your Business – Book Online</b>
            <span>Open now · Book in 30 seconds</span>
          </div>
        </div>
      );
    case 'devices':
      return (
        <div className="ld-v-devices">
          <div className="ld-v-laptop"><img src={SHOWCASE[2].image} alt="" loading="lazy" decoding="async" /></div>
          <div className="ld-v-phone"><img src={SHOWCASE[1].image} alt="" loading="lazy" decoding="async" /></div>
        </div>
      );
  }
}

// Moves the soft spotlight under the pointer.
const followPointer = (event: PointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
};

// Aceternity-style bento grid of what every client gets, each card with its own small live visual.
export default function ClientBento() {
  return (
    <section className="ld-bento-section section-pad" id="benefits">
      <div className="section-heading">
        <div>
          <span className="section-kicker" data-reveal>What you get</span>
          <h2 data-reveal="clip">Everything your business<br /><em>needs online.</em></h2>
        </div>
        <p data-reveal style={stagger(2)}>
          Not just a pretty page. A website that brings enquiries, works on every phone and is easy to grow later.
        </p>
      </div>
      <div className="ld-bento">
        {CARDS.map(({ title, text, icon: Icon, visual, wide }, index) => (
          <article
            key={title}
            className={`ld-bento-card${wide ? ' is-wide' : ''}`}
            data-reveal
            style={stagger(index)}
            onPointerMove={followPointer}
          >
            <span className="ld-bento-spot" aria-hidden="true" />
            <div className="ld-bento-visual" aria-hidden="true"><CardVisual kind={visual} /></div>
            <div className="ld-bento-copy">
              <span className="ld-bento-icon"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

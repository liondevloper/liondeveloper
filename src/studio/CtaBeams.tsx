import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { stagger } from '@/motion/effects';

const BEAMS = 7;

// Call-to-action card with a dotted grid, falling light beams and an Aceternity-style moving border button.
export default function CtaBeams({ whatsappHref }: { whatsappHref: string }) {
  // The WhatsApp link falls back to #contact when no number is saved; only real links open a new tab.
  const external = whatsappHref.startsWith('http');
  return (
    <section className="ld-cta section-pad">
      <div className="ld-cta-card" data-reveal="scale">
        <div className="ld-cta-grid" aria-hidden="true" />
        <div className="ld-cta-beams" aria-hidden="true">
          {Array.from({ length: BEAMS }, (_, index) => <i key={index} style={stagger(index)} />)}
        </div>
        <div className="center-heading ld-cta-copy">
          <span className="section-kicker">Let’s get you online</span>
          <h2>Ready to get more<br /><em>customers online?</em></h2>
          <p>Share your idea on WhatsApp. You get a clear plan, price and timeline before any work starts.</p>
        </div>
        <div className="ld-cta-actions">
          <a className="ld-moving-border" href={whatsappHref} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            <span className="ld-moving-border-spin" aria-hidden="true" />
            <span className="ld-moving-border-inner"><MessageCircle size={18} />Chat on WhatsApp</span>
          </a>
          <a className="button button-outline" href="#pricing">See pricing <ArrowUpRight size={18} /></a>
        </div>
      </div>
    </section>
  );
}

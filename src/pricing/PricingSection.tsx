import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, ChevronUp, CreditCard, HeartHandshake, MessageCircle, PenLine, Server, Sparkles, X } from 'lucide-react';
import {
  annualSaving,
  careOption,
  formatRupees,
  parseAmount,
  paymentSplit,
  whatsappLink,
  type CarePlan,
  type Plan,
  type Terms,
} from '@/data/site';
import { stagger } from '@/motion/effects';
import { Deck } from '@/motion/showcase';
import './pricing.css';

type Choose = (name: string) => void;

// Long enough to read a full feature list before the next package slides in.
const PRICING_SWIPE_MS = 9000;
const WIDE_SCREEN = '(min-width: 1000px)';

const POLICY_TABS = [
  { id: 'payment', label: 'Payment terms', icon: CreditCard },
  { id: 'revisions', label: 'Revisions', icon: PenLine },
  { id: 'hosting', label: 'Domain & hosting', icon: Server },
] as const;
type PolicyTab = (typeof POLICY_TABS)[number]['id'];

// Big screens show every package side by side for easy comparison; smaller screens keep the swipe deck.
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function PriceCard({ plan, onChoose }: { plan: Plan; onChoose: Choose }) {
  return (
    <article className={`price-card ${plan.popular ? 'popular' : ''}`}>
      {plan.popular && <span className="popular-tag">Most popular</span>}
      <span className="price-name">{plan.name}</span>
      <h3>{/\d/.test(plan.price) ? <><small>Starting from</small>{plan.price}</> : plan.price}</h3>
      <p>{plan.description}</p>
      <div className="price-divider" />
      {plan.features.map((feature, index) => <span className="price-feature" key={index}><Check size={15} />{feature}</span>)}
      {plan.revisions && <span className="price-revisions"><PenLine size={13} />{plan.revisions}</span>}
      <a className={`button ${plan.popular ? 'button-gold' : 'button-outline'} price-button`} href="#contact" onClick={() => onChoose(plan.name)}>{plan.cta} <ArrowUpRight size={16} /></a>
    </article>
  );
}

function CheckList({ items, excluded = false }: { items: string[]; excluded?: boolean }) {
  return (
    <ul className={`policy-list ${excluded ? 'is-excluded' : ''}`}>
      {items.map((item, index) => <li key={index}>{excluded ? <X size={15} /> : <Check size={15} />}{item}</li>)}
    </ul>
  );
}

function CareBlock({ care, whatsapp, onChoose }: { care: CarePlan; whatsapp: string; onChoose: Choose }) {
  const saving = annualSaving(care);
  const chatHref = whatsappLink(whatsapp, `Hi Lion Developer, I would like to confirm the ${care.name}. Please share the details.`);
  return (
    <div className="care-block" data-reveal>
      <div className="care-block-head">
        <span className="care-icon"><HeartHandshake size={22} /></span>
        <div>
          <span className="price-name">Optional · After launch</span>
          <h3>{care.name}</h3>
          <p>{care.description}</p>
        </div>
        {care.offer && <span className="care-offer"><Sparkles size={13} />{care.offer}</span>}
      </div>

      <div className="care-block-body">
        <div className="care-prices">
          <div className="care-price-option">
            <span className="care-list-title">Monthly</span>
            <div className="care-price"><b>{care.price}</b><span>{care.period}</span></div>
            <small className="care-saving-muted">Pay month by month</small>
            <a className="button button-gold" href="#contact" onClick={() => onChoose(careOption(care, 'monthly'))}>Choose Monthly <ArrowUpRight size={16} /></a>
          </div>
          <div className="care-price-option is-annual">
            <span className="care-list-title">Annual · paid upfront</span>
            <div className="care-price"><b>{care.yearlyPrice}</b><span>{care.yearlyPeriod}</span></div>
            {saving ? (
              <small className="care-saving">
                Save {formatRupees(saving.saving)} vs monthly{saving.months > 0 && ` (about ${saving.months} month${saving.months === 1 ? '' : 's'} free)`}
              </small>
            ) : <small className="care-saving-muted">One payment for the year</small>}
            <a className="button button-outline" href="#contact" onClick={() => onChoose(careOption(care, 'annual'))}>Choose Annual <ArrowUpRight size={16} /></a>
          </div>
        </div>
        <div className="care-lists">
          <div>
            <span className="care-list-title">Included</span>
            <CheckList items={care.included} />
          </div>
          {care.excluded.length > 0 && (
            <div>
              <span className="care-list-title">Not included</span>
              <CheckList items={care.excluded} excluded />
            </div>
          )}
        </div>
      </div>

      <div className="care-foot">
        {care.smallChange && <p><b>What counts as a small change?</b> {care.smallChange}</p>}
        {care.conditions.length > 0 && <ul>{care.conditions.map((condition, index) => <li key={index}>{condition}</li>)}</ul>}
        {chatHref && <a className="care-chat" href={chatHref} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Prefer WhatsApp? Confirm your plan in chat</a>}
      </div>
    </div>
  );
}

function PolicyPanel({ pricing, terms }: { pricing: Plan[]; terms: Terms }) {
  const [tab, setTab] = useState<PolicyTab>('payment');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Examples are worked out from each package's starting price, so they follow any price edit in the admin panel.
  const examples = pricing.flatMap((plan) => {
    const amount = parseAmount(plan.price);
    return amount ? [{ name: plan.name, amount, ...paymentSplit(amount) }] : [];
  });

  return (
    <div className="policy-panel" data-reveal>
      <div className="policy-tabs" role="tablist" aria-label="Pricing policies">
        {POLICY_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'payment' && (
          <div className="policy-split">
            <CheckList items={terms.payment} />
            {examples.length > 0 && (
              <div className="policy-examples">
                <span className="care-list-title">50 / 50 examples at starting prices</span>
                {examples.map((example) => (
                  <div className="policy-example" key={example.name}>
                    <b>{example.name} {formatRupees(example.amount)}</b>
                    <span>{formatRupees(example.advance)} advance + {formatRupees(example.final)} final payment</span>
                  </div>
                ))}
                {terms.paymentNote && <small>{terms.paymentNote}</small>}
              </div>
            )}
          </div>
        )}

        {tab === 'revisions' && (
          <div className="policy-split">
            <CheckList items={terms.revisions} />
            <div className="policy-examples">
              <span className="care-list-title">Revision rounds</span>
              {pricing.filter((plan) => plan.revisions).map((plan) => (
                <div className="policy-example" key={plan.name}><b>{plan.name}</b><span>{plan.revisions}</span></div>
              ))}
              <small>Revisions are not unlimited. Extra rounds are quoted before any work starts.</small>
            </div>
          </div>
        )}

        {tab === 'hosting' && (
          <div className="policy-hosting">
            {pricing.filter((plan) => plan.hosting.length > 0).map((plan) => (
              <div key={plan.name}>
                <span className="care-list-title">{plan.name}</span>
                <CheckList items={plan.hosting} />
              </div>
            ))}
          </div>
        )}
      </div>

      {terms.faqs.length > 0 && (
        <div className="policy-faqs">
          <h3>Pricing questions</h3>
          <div className="faq-list">
            {terms.faqs.map((faq, index) => (
              <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={index}>
                <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span><b>{faq.question}</b>{openFaq === index ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                </button>
                {openFaq === index && <p>{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type PricingSectionProps = { pricing: Plan[]; care: CarePlan; terms: Terms; whatsapp: string; onChoose: Choose };

export default function PricingSection({ pricing, care, terms, whatsapp, onChoose }: PricingSectionProps) {
  const wide = useMediaQuery(WIDE_SCREEN);
  const popularPlan = Math.max(pricing.findIndex((plan) => plan.popular), 0);
  const lowest = pricing.map((plan) => plan.price).find((price) => /\d/.test(price))?.replace(/\s*\+\s*$/, '') ?? '₹8,000';

  return (
    <section className="pricing-section section-pad" id="pricing">
      <div className="center-heading">
        <span className="section-kicker" data-reveal>Clear starting points</span>
        <h2 data-reveal="clip">Simple website<br /><em>pricing.</em></h2>
        <p data-reveal style={stagger(2)}>Professional websites starting from {lowest}. {wide ? 'Compare the packages to find the right fit.' : 'Swipe through the packages to find the right fit.'}</p>
      </div>
      {wide ? (
        <div className="pricing-grid pricing-grid-wide" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(pricing.length, 1), 4)}, minmax(0, 1fr))` }}>
          {pricing.map((plan, index) => <div key={index} data-reveal style={stagger(index)}><PriceCard plan={plan} onChoose={onChoose} /></div>)}
        </div>
      ) : (
        <div data-reveal="scale">
          <Deck<Plan>
            key={pricing.length}
            items={pricing}
            axis="x"
            label="Pricing packages"
            initial={popularPlan}
            interval={PRICING_SWIPE_MS}
            className="pricing-deck"
            renderCard={(plan) => <PriceCard plan={plan} onChoose={onChoose} />}
          />
        </div>
      )}
      <p className="pricing-note" data-reveal>Starting prices. Your final quotation depends on pages, features, integrations and project requirements.</p>
      {care.enabled && <CareBlock care={care} whatsapp={whatsapp} onChoose={onChoose} />}
      <PolicyPanel pricing={pricing} terms={terms} />
    </section>
  );
}

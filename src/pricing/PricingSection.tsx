import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Check, ChevronDown, ChevronUp, CreditCard, Gift, HeartHandshake, MessageCircle, PenLine, Server, Sparkles, X } from 'lucide-react';
import {
  annualSaving,
  formatRupees,
  parseAmount,
  paymentSplit,
  whatsappLink,
  type CarePlan,
  type CareTier,
  type Plan,
  type Terms,
} from '@/data/site';
import { stagger } from '@/motion/effects';
import './pricing.css';

type Choose = (name: string) => void;

// Every care tier gets its own 3D effect (see premium.css): orbit, hologram, embers.
const TIER_FX = ['orbit', 'holo', 'ember'] as const;
type TierFx = (typeof TIER_FX)[number];
const FX_LAYERS: Record<TierFx, number> = { orbit: 4, holo: 3, ember: 8 };

const POLICY_TABS = [
  { id: 'payment', label: 'Payment terms', icon: CreditCard },
  { id: 'revisions', label: 'Revisions', icon: PenLine },
  { id: 'hosting', label: 'Domain & hosting', icon: Server },
] as const;
type PolicyTab = (typeof POLICY_TABS)[number]['id'];

function PriceCard({ plan, onChoose }: { plan: Plan; onChoose: Choose }) {
  return (
    <article className={`price-card ${plan.popular ? 'popular' : ''}`}>
      {plan.popular && <span className="popular-tag">Most popular</span>}
      <span className="price-name">{plan.name}</span>
      <h3>{/\d/.test(plan.price) ? <><small>Starting from</small>{plan.price}</> : plan.price}</h3>
      <p>{plan.description}</p>
      {plan.perk && <span className="price-perk"><Gift size={16} /><span>{plan.perk}</span></span>}
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

// Care cards show price info only; plans are confirmed on WhatsApp, so there are no buttons on the card.
function CareTierCard({ care, tier, index }: { care: CarePlan; tier: CareTier; index: number }) {
  const fx: TierFx = TIER_FX[index % TIER_FX.length] ?? 'orbit';
  const saving = annualSaving(tier);
  return (
    <article className={`care-tier fx-${fx} ${tier.popular ? 'is-popular' : ''}`} data-reveal style={stagger(index)}>
      <div className="care-fx" aria-hidden="true">
        {Array.from({ length: FX_LAYERS[fx] }, (_, layer) => <i key={layer} />)}
      </div>
      {tier.popular && <span className="care-tier-tag"><Sparkles size={11} />Most popular</span>}
      <span className="price-name">{tier.name}</span>
      <div className="care-price"><b>{tier.price}</b><span>{care.period}</span></div>
      <small className="care-saving">
        or {tier.yearlyPrice}{care.yearlyPeriod}{saving && saving.months > 0 ? ` · ${saving.months} months free` : ''}
      </small>
      {tier.description && <p>{tier.description}</p>}
      <CheckList items={tier.features} />
    </article>
  );
}

function CareBlock({ care, whatsapp }: { care: CarePlan; whatsapp: string }) {
  const chatHref = whatsappLink(whatsapp, `Hi Lion Developer, I would like to confirm a ${care.name}. Please share the details.`);
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

      {care.tiers.length > 0 && (
        <div className="care-tiers">
          {care.tiers.map((tier, index) => <CareTierCard key={index} care={care} tier={tier} index={index} />)}
        </div>
      )}

      <div className="care-lists">
        <div>
          <span className="care-list-title">Included in every plan</span>
          <CheckList items={care.included} />
        </div>
        {care.excluded.length > 0 && (
          <div>
            <span className="care-list-title">Not included</span>
            <CheckList items={care.excluded} excluded />
          </div>
        )}
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
            {pricing.filter((plan) => plan.hosting.length > 0 || plan.perk).map((plan) => (
              <div key={plan.name}>
                <span className="care-list-title">{plan.name}</span>
                {plan.perk && <span className="price-perk policy-perk"><Gift size={15} /><span>{plan.perk}</span></span>}
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
  const rowRef = useRef<HTMLDivElement>(null);
  const popularPlan = Math.max(pricing.findIndex((plan) => plan.popular), 0);
  const lowest = pricing.map((plan) => plan.price).find((price) => /\d/.test(price))?.replace(/\s*\+\s*$/, '') ?? '₹8,000';
  // Names the packages that carry the free domain offer, so the note never promises it on the Starter plan.
  const perkPlans = pricing.filter((plan) => plan.perk).map((plan) => plan.name);
  const perkNote = perkPlans.length > 0
    ? ` ${perkPlans.join(' and ')} include a FREE .in / .com domain & hosting for the first year; renewals from the second year are charged separately.`
    : '';

  // On phones and tablets the row swipes sideways; start it centred on the most popular package.
  useEffect(() => {
    const row = rowRef.current;
    const card = row?.children[popularPlan];
    if (!row || !(card instanceof HTMLElement) || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2;
  }, [popularPlan, pricing.length]);

  return (
    <section className="pricing-section section-pad" id="pricing">
      <div className="center-heading">
        <span className="section-kicker" data-reveal>Clear starting points</span>
        <h2 data-reveal="clip">Simple website<br /><em>pricing.</em></h2>
        <p data-reveal style={stagger(2)}>Professional websites starting from {lowest}. Compare the packages to find the right fit.</p>
      </div>
      {/* All cards reveal together as one row, so none of them sit higher or lower than the others. */}
      <div data-reveal>
        <div
          ref={rowRef}
          className="pricing-row"
          style={{ '--plans': Math.min(Math.max(pricing.length, 1), 4) } as CSSProperties}
        >
          {pricing.map((plan, index) => <PriceCard key={index} plan={plan} onChoose={onChoose} />)}
        </div>
      </div>
      <p className="pricing-note" data-reveal>Starting prices. Your final quotation depends on pages, features, integrations and project requirements.{perkNote}</p>
      {care.enabled && <CareBlock care={care} whatsapp={whatsapp} />}
      <PolicyPanel pricing={pricing} terms={terms} />
    </section>
  );
}

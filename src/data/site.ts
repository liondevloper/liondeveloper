import { useEffect, useState } from 'react';
import { BUSINESS } from '@/data/business';

export type Stat = { value: string; label: string };
export type Service = { icon: string; title: string; description: string };
export type ProjectAccent = 'gold' | 'blue' | 'dark';
export type Project = {
  title: string;
  category: string;
  description: string;
  accent: ProjectAccent;
  features: string[];
  tech: string[];
  // Live site address. When set, the card shows a real screenshot of that homepage.
  url?: string;
};
// A live website (no longer shown on the homepage; the work videos below replaced the "Live templates" section).
export type Template = {
  title: string;
  category: string;
  url: string;
  image?: string;
  tags: string[];
};
// A work video uploaded from the admin panel, shown in the sticky "Recent work" stack on the homepage.
export type WorkVideo = {
  title: string;
  category: string;
  // Public Supabase Storage address of the uploaded video. Blank items are skipped on the site.
  video: string;
  // Optional live site; adds an "Open site" button on the video.
  url?: string;
};
export type Plan = {
  name: string;
  price: string;
  description: string;
  popular: boolean;
  // Highlighted offer box on the card, e.g. the free first-year domain + hosting. Blank hides it.
  perk: string;
  features: string[];
  // Short line shown on the card, e.g. "2 revision rounds".
  revisions: string;
  // Domain and hosting conditions for this package, shown in the policy panel.
  hosting: string[];
  cta: string;
};
// One level of the after-launch care plan, shown as its own animated card.
export type CareTier = {
  name: string;
  price: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  popular: boolean;
};
// The optional after-launch plan, shown as its own block under the pricing cards.
export type CarePlan = {
  enabled: boolean;
  name: string;
  period: string;
  yearlyPeriod: string;
  description: string;
  offer: string;
  tiers: CareTier[];
  included: string[];
  excluded: string[];
  smallChange: string;
  conditions: string[];
};
export type Testimonial = { quote: string; author: string; role: string; rating: number };
export type Faq = { question: string; answer: string };
export type Terms = {
  payment: string[];
  paymentNote: string;
  revisions: string[];
  faqs: Faq[];
};

export type SiteContent = {
  contact: { email: string; whatsapp: string; whatsappMessage: string; instagram: string; instagramUrl: string };
  hero: { badge: string; headline: string; text: string };
  stats: Stat[];
  services: Service[];
  projects: Project[];
  templates: Template[];
  videos: WorkVideo[];
  pricing: Plan[];
  care: CarePlan;
  terms: Terms;
  budgets: string[];
  technologies: string[];
  testimonials: Testimonial[];
  faqs: Faq[];
};

export const SERVICE_ICONS = [
  'Globe',
  'MousePointerClick',
  'ShoppingBag',
  'PanelsTopLeft',
  'LayoutDashboard',
  'CalendarCheck2',
  'PlugZap',
  'Wrench',
] as const;

export const PROJECT_ACCENTS: ProjectAccent[] = ['gold', 'blue', 'dark'];

export const BLANK_PLAN: Plan = { name: '', price: '', description: '', popular: false, perk: '', features: [], revisions: '', hosting: [], cta: 'Get Started' };

export const BLANK_CARE_TIER: CareTier = { name: '', price: '', yearlyPrice: '', description: '', features: [], popular: false };

export const BLANK_VIDEO: WorkVideo = { title: '', category: '', video: '', url: '' };

export const FREE_DOMAIN_PERK = 'FREE .in / .com domain + hosting for 1 year';

export const siteConfig = {
  brand: 'LION DIGITAL SOLUTION',
  shortBrand: 'Lion Digital Solution',
  tagline: 'Websites. Apps. Digital Solutions.',
};

export const defaultContent: SiteContent = {
  // The same verified details as index.html, public/llms.txt and every service page (see data/business.ts).
  contact: {
    email: 'liondeveloper76@gmail.com',
    whatsapp: BUSINESS.whatsapp,
    whatsappMessage: 'Hi Lion Digital Solution, I want a website for my business.',
    instagram: BUSINESS.instagram,
    instagramUrl: BUSINESS.instagramUrl,
  },
  hero: {
    badge: 'Available for New Projects',
    headline: 'I build websites that *grow* your business.',
    text: 'Modern websites, web applications and digital solutions designed to help businesses build a stronger online presence and turn visitors into customers. Your website can be ready in just 1–3 days, depending on the website.',
  },
  // No "24/7 support" claim: the care plan itself says 24/7 support is not included.
  stats: [
    { value: '50+', label: 'Projects' },
    { value: '30+', label: 'Clients' },
    { value: '100%', label: 'Responsive' },
    { value: '50%', label: 'Pay on approval' },
  ],
  services: [
    { icon: 'Globe', title: 'Business Websites', description: 'Professional websites for businesses, companies, local brands and professionals.' },
    { icon: 'MousePointerClick', title: 'Landing Pages', description: 'Modern, conversion-focused landing pages for products, services and campaigns.' },
    { icon: 'ShoppingBag', title: 'E-Commerce Websites', description: 'Online stores with product catalogues and business functionality.' },
    { icon: 'PanelsTopLeft', title: 'Custom Web Applications', description: 'Custom web applications built around specific business requirements.' },
    { icon: 'LayoutDashboard', title: 'Admin Panels', description: 'Powerful dashboards for managing users, bookings, products, content and data.' },
    { icon: 'CalendarCheck2', title: 'Booking Systems', description: 'Online booking and appointment systems with WhatsApp integration.' },
    { icon: 'PlugZap', title: 'API Integration', description: 'Payment gateways, maps, authentication, shipping, messaging and third-party APIs.' },
    { icon: 'Wrench', title: 'Maintenance & Support', description: 'Bug fixes, updates, improvements, deployment and ongoing technical support.' },
  ],
  projects: [
    {
      title: 'Bold & Brilliant by Janvi',
      category: 'Nail Studio / Beauty',
      description: 'A refined digital presence for a beauty studio with a clear path from inspiration to booking.',
      accent: 'gold',
      features: ['Service showcase', 'Booking', 'WhatsApp integration', 'Responsive design'],
      tech: ['React', 'UI/UX', 'Responsive'],
    },
    {
      title: 'The Imperial Palace',
      category: 'Hotel / Hospitality',
      description: 'An elegant hospitality experience designed to turn room discovery into direct enquiries.',
      accent: 'blue',
      features: ['Hotel showcase', 'Rooms', 'Gallery', 'Enquiry system'],
      tech: ['React', 'UI/UX', 'Forms'],
    },
  ],
  templates: [
    {
      title: 'The Imperial Palace',
      category: 'Hotel / Hospitality',
      url: 'https://theimperialpalace.vercel.app',
      image: '',
      tags: ['Luxury', 'Rooms', 'Gallery'],
    },
    {
      title: 'BRONZEX Unisex Salon',
      category: 'Salon / Beauty',
      url: 'https://bronzexunixessalon.vercel.app',
      image: '',
      tags: ['Services', 'Offers', 'Reviews'],
    },
    {
      title: 'Aaraamam Restaurant',
      category: 'Restaurant / Food',
      url: 'https://aaraamam.vercel.app',
      image: '',
      tags: ['Menu', 'Online order', 'Table booking'],
    },
  ],
  videos: [],
  // Prices carry no "+": the card already says "Starting from".
  pricing: [
    {
      name: 'Starter',
      price: '₹15,000',
      description: 'A polished launchpad for a focused online presence.',
      popular: false,
      perk: '',
      features: ['1–5 pages', 'Responsive design', 'Modern UI', 'WhatsApp button', 'Contact form', 'Basic SEO', 'Mobile optimization', 'Deployment'],
      revisions: '2 revision rounds',
      hosting: [
        'Custom domain registration is charged separately.',
        'Eligible free-tier hosting may be used when suitable for the project.',
        'Paid hosting and third-party services are not included unless stated in your quotation.',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Business',
      price: '₹25,000',
      description: 'A premium website built to support your next stage of growth.',
      popular: true,
      perk: FREE_DOMAIN_PERK,
      features: ['Up to 10 pages', 'Premium UI/UX', 'WhatsApp integration', 'Booking / enquiry form', 'Basic SEO', 'Performance optimization', 'Deployment', 'Basic support'],
      revisions: '3 revision rounds',
      hosting: [
        'FREE .in or .com domain and hosting for the first year.',
        'The free first year covers a standard .in / .com domain and hosting, up to ₹3,000 combined.',
        'Premium domains or bigger hosting plans: the extra cost is shared with you and approved before purchase.',
        'Domain and hosting renewals from the second year are charged separately.',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Professional',
      price: '₹40,000',
      description: 'Advanced functionality and custom solutions for businesses with bigger requirements.',
      popular: false,
      perk: FREE_DOMAIN_PERK,
      features: ['Custom UI/UX', 'Advanced functionality', 'Admin panel', 'Database', 'Authentication', 'API integrations', 'Custom features', 'Technical support'],
      revisions: 'Revisions defined in your quotation',
      hosting: [
        'FREE .in or .com domain and standard hosting for the first year.',
        'Larger hosting, database, cloud, email and API services are quoted separately based on project requirements.',
        'Domain, hosting and cloud services are preferably registered under your own account.',
        'Renewals from the second year and any recurring third-party charges are disclosed upfront.',
      ],
      cta: 'Request Quote',
    },
    {
      name: 'Custom Project',
      price: "Let's Discuss",
      description: 'For ambitious products and systems that need a tailored approach.',
      popular: false,
      perk: FREE_DOMAIN_PERK,
      features: ['SaaS products', 'Custom web applications', 'Advanced dashboards', 'E-commerce systems', 'Business management systems', 'Complex integrations', 'Dedicated support'],
      revisions: 'Revisions defined in your quotation',
      hosting: [
        'FREE .in or .com domain and standard hosting for the first year.',
        'Larger hosting, database, cloud, email and API services are quoted separately based on project requirements.',
        'Domain, hosting and cloud services are preferably registered under your own account.',
        'Renewals from the second year and any recurring third-party charges are disclosed upfront.',
      ],
      cta: 'Talk To Me',
    },
  ],
  care: {
    enabled: true,
    name: 'Website Care Plan',
    period: '/month',
    yearlyPeriod: '/year',
    description: 'Optional after-launch support to keep your website updated and running smoothly. Pay yearly and get 2 months free.',
    offer: 'First month free with every website',
    tiers: [
      {
        name: 'Starter',
        price: '₹999',
        yearlyPrice: '₹9,990',
        description: 'Essential care for small websites.',
        features: ['Up to 3 small text/photo changes per month', 'Minor bug fixes', 'Monthly backup where supported', 'WhatsApp support'],
        popular: false,
      },
      {
        name: 'Business',
        price: '₹1,499',
        yearlyPrice: '₹14,990',
        description: 'Regular updates for growing businesses.',
        features: ['Up to 6 small changes per month', 'Bug fixes & speed checks', 'Weekly backup where supported', 'Uptime troubleshooting', 'Priority WhatsApp support'],
        popular: true,
      },
      {
        name: 'Professional',
        price: '₹2,499',
        yearlyPrice: '₹24,990',
        description: 'Hands-on care for busy, high-traffic websites.',
        features: ['Up to 12 small changes per month', 'Monthly SEO & performance report', 'Security & plugin updates', 'Fastest response on WhatsApp', '1 new section or banner per month'],
        popular: false,
      },
    ],
    included: [
      'Minor bug fixes',
      'Regular backups where supported by your hosting',
      'Troubleshooting if the website goes down',
      'Domain & hosting renewal reminders',
      'WhatsApp support',
    ],
    excluded: [
      'New pages',
      'New features or major redesigns',
      'Paid hosting, domain renewals, premium plugins and third-party charges',
      'Major development work or substantial functionality changes',
    ],
    smallChange:
      'A small change is a quick edit to existing content, such as replacing text, a phone number, a price or a photo on an existing page. Anything that adds pages, sections or new functionality is new development and is quoted separately.',
    conditions: [
      'The Care Plan is optional.',
      'The free first month applies once, to the first care period after launch. It does not apply to renewals.',
      'Annual plans are paid upfront and include 2 months free.',
      'Support is provided over WhatsApp. 24/7 support and guaranteed uptime are not included.',
    ],
  },
  terms: {
    payment: [
      '50% advance payment is required before project work begins.',
      'The remaining 50% is payable after you review and approve the completed website, before final handover and launch.',
      'Domain, hosting, premium tools or third-party costs that must be paid upfront are disclosed and approved separately.',
      'Work outside the agreed project scope is quoted separately.',
      'Project timelines begin after the advance payment and all required materials are received.',
      'Payment milestones are confirmed with you before the project starts.',
    ],
    paymentNote: 'For projects above ₹40,000, the 50% advance and remaining balance are calculated from the final agreed quotation.',
    revisions: [
      'A revision round is one consolidated list of changes you send for the agreed design or content.',
      'Minor text, colour, spacing and image adjustments within the agreed scope count as revisions.',
      'New pages, major redesigns, new functionality and changes to already approved requirements may be charged extra, only after your approval.',
    ],
    faqs: [
      {
        question: 'Is domain and hosting included?',
        answer:
          'Business, Professional and Custom Project include a FREE .in or .com domain and hosting for the first year. Starter: the domain is charged separately and free-tier hosting is used where suitable. Renewals from the second year are charged separately for every package.',
      },
      {
        question: 'How does the 50% advance payment work?',
        answer:
          'You pay 50% of the agreed price before work begins. The remaining 50% is due after you review and approve the completed website, before final handover and launch. For example, a ₹25,000 Business website is ₹12,500 advance + ₹12,500 final payment.',
      },
      {
        question: 'What is included in a revision round?',
        answer:
          'One consolidated list of changes to the agreed design or content, such as text, colour, spacing or image adjustments. Starter includes 2 rounds, Business includes 3, and Professional and Custom Project follow your quotation.',
      },
      {
        question: 'Are domain and hosting renewals included?',
        answer: 'No. The free domain and hosting cover the first year only. Renewals from the second year are charged separately, and Care Plan clients receive renewal reminders.',
      },
      {
        question: 'Is the Website Care Plan compulsory?',
        answer: 'No, it is optional. Every website gets the first month of care free. After that you can choose Starter (₹999/month), Business (₹1,499/month) or Professional (₹2,499/month). Paying yearly gives you 2 months free.',
      },
      {
        question: 'What happens if I need additional features?',
        answer: 'Work outside the agreed scope is quoted separately and starts only after you approve the quote.',
      },
    ],
  },
  budgets: ['₹15,000 – ₹25,000', '₹25,000 – ₹40,000', '₹40,000 – ₹60,000', '₹60,000+', 'Not sure'],
  technologies: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'PHP', 'Laravel', 'Firebase', 'Supabase', 'REST APIs', 'Cloudflare', 'Vercel', 'GitHub'],
  testimonials: [],
  faqs: [
    { question: 'How much does a website cost?', answer: 'Website packages start from ₹15,000. Final pricing depends on pages, features and integrations.' },
    { question: 'How long does a website take?', answer: 'Most websites are ready in just 1–3 days, depending on the website. Bigger projects with custom features may take longer, and a clear timeline is shared before work begins.' },
    { question: 'Do you provide domain and hosting?', answer: 'Yes. Business (from ₹25,000), Professional (from ₹40,000) and Custom Project include a FREE .in or .com domain and hosting for the first year. Renewals from the second year are charged separately.' },
    { question: 'Can you build an admin panel?', answer: 'Yes. Custom admin panels can be developed when required.' },
    { question: 'Can you integrate WhatsApp?', answer: 'Yes. WhatsApp enquiry and booking functionality can be integrated.' },
    { question: 'Do you provide maintenance?', answer: 'Yes. The optional Website Care Plan starts at ₹999/month (Starter), with Business at ₹1,499 and Professional at ₹2,499. Yearly plans get 2 months free, and the first month is free with every website.' },
  ],
};

// Starting prices before the October 2026 price update. Content saved in the admin panel with these
// amounts moves to the new prices, and every other mention of them (FAQs, budgets, notes) follows.
const LEGACY_PRICES: Record<string, number> = { Starter: 8000, Business: 18000, Professional: 30000 };

// Contact details from before the rebrand; saved admin content with them switches to the verified ones.
const OLD_WHATSAPP = '9737822142';
const OLD_INSTAGRAM = 'lion___developer';

const list = <T,>(value: unknown, fallback: T[]): T[] => (Array.isArray(value) ? (value as T[]) : fallback);

const isCurrentPlans = (value: unknown): value is Plan[] =>
  Array.isArray(value) &&
  value.every((plan) => typeof plan === 'object' && plan !== null && Array.isArray((plan as { hosting?: unknown }).hosting));

// Plans saved before the free domain offer have no perk; the default package with the same name supplies
// both the offer box and the matching domain & hosting terms, so the card and the policy never disagree.
// Plans still on an old starting price get the current one.
function upgradePlan(stored: Plan): Plan {
  const plan = { ...BLANK_PLAN, ...stored };
  const preset = defaultContent.pricing.find((item) => item.name === plan.name);
  if (!preset) return plan;
  const price = parseAmount(plan.price) === LEGACY_PRICES[plan.name] ? preset.price : plan.price;
  if (typeof (stored as Partial<Plan>).perk === 'string') return { ...plan, price };
  return { ...plan, price, perk: preset.perk, hosting: preset.hosting };
}

// Replaces answers to the default questions with the current default answers.
const refreshFaqs = (faqs: Faq[], defaults: Faq[]) =>
  faqs.map((faq) => defaults.find((item) => item.question === faq.question) ?? faq);

// Care plans saved before the 3 tiers existed carry only one price; they get the default tiers.
function mergeCare(stored: unknown): CarePlan {
  const raw = stored && typeof stored === 'object' ? (stored as Partial<CarePlan>) : {};
  const care = { ...defaultContent.care, ...raw };
  return {
    ...care,
    tiers: list<CareTier>(raw.tiers, defaultContent.care.tiers).map((tier) => ({ ...BLANK_CARE_TIER, ...tier })),
    included: list(care.included, defaultContent.care.included),
    excluded: list(care.excluded, defaultContent.care.excluded),
    conditions: list(care.conditions, defaultContent.care.conditions),
  };
}

// Messages saved before the rebrand still say "Lion Developer" or use the old number and Instagram;
// they switch to the verified details so the site never shows two different numbers.
const upgradeContact = (contact: SiteContent['contact']): SiteContent['contact'] => {
  const whatsapp = contact.whatsapp ?? '';
  const instagram = contact.instagram ?? '';
  const instagramUrl = contact.instagramUrl ?? '';
  const oldNumber = whatsapp.replace(/\D/g, '').endsWith(OLD_WHATSAPP);
  const oldInstagram = instagram.includes(OLD_INSTAGRAM) || instagramUrl.includes(OLD_INSTAGRAM);
  return {
    ...contact,
    whatsapp: oldNumber ? BUSINESS.whatsapp : whatsapp,
    instagram: oldInstagram ? BUSINESS.instagram : instagram,
    instagramUrl: oldInstagram ? BUSINESS.instagramUrl : instagramUrl,
    whatsappMessage: (contact.whatsappMessage ?? '').replace(/lion\s*develop(?:er|or)/gi, 'Lion Digital Solution'),
  };
};

// The old "24/7 Support" stat contradicted the care plan terms, so saved content drops it too.
const upgradeStat = (stat: Stat): Stat => (stat.value === '24/7' ? { value: '50%', label: 'Pay on approval' } : stat);

// Stored content only holds what the admin saved; anything missing falls back to the defaults above.
export function mergeContent(stored: unknown): SiteContent {
  if (!stored || typeof stored !== 'object') return defaultContent;
  const raw = stored as Partial<SiteContent>;
  // Content saved before the pricing policy update has no hosting terms; it switches to the new defaults
  // so the site never shows the old prices or the old care plan claims.
  const legacyPricing = raw.pricing !== undefined && !isCurrentPlans(raw.pricing);
  const missingPerk = isCurrentPlans(raw.pricing) && raw.pricing.some((plan) => typeof (plan as Partial<Plan>).perk !== 'string');
  const refresh = legacyPricing || missingPerk;
  const pricing = isCurrentPlans(raw.pricing) ? raw.pricing.map(upgradePlan) : defaultContent.pricing;
  const terms = { ...defaultContent.terms, ...(raw.terms ?? {}) };
  const termFaqs = list<Faq>(terms.faqs, defaultContent.terms.faqs);
  const faqs = list<Faq>(raw.faqs, defaultContent.faqs);
  const merged: SiteContent = {
    contact: upgradeContact({ ...defaultContent.contact, ...(raw.contact ?? {}) }),
    hero: { ...defaultContent.hero, ...(raw.hero ?? {}) },
    stats: list<Stat>(raw.stats, defaultContent.stats).map(upgradeStat),
    services: list(raw.services, defaultContent.services),
    projects: list(raw.projects, defaultContent.projects),
    templates: list(raw.templates, defaultContent.templates),
    videos: list<WorkVideo>(raw.videos, defaultContent.videos).map((item) => ({ ...BLANK_VIDEO, ...item })),
    pricing,
    care: mergeCare(raw.care),
    terms: {
      ...terms,
      payment: list(terms.payment, defaultContent.terms.payment),
      revisions: list(terms.revisions, defaultContent.terms.revisions),
      faqs: refresh ? refreshFaqs(termFaqs, defaultContent.terms.faqs) : termFaqs,
    },
    budgets: legacyPricing ? defaultContent.budgets : list(raw.budgets, defaultContent.budgets),
    technologies: list(raw.technologies, defaultContent.technologies),
    testimonials: list(raw.testimonials, defaultContent.testimonials),
    // Old answers about domains and maintenance no longer match the policy, so they are refreshed too.
    faqs: refresh ? refreshFaqs(faqs, defaultContent.faqs) : faqs,
  };
  return syncPrices(merged);
}

/* ------------------------------------------------------------- pricing maths */

// "₹40,000" -> 40000. Returns null for prices without a number, like "Let's Discuss".
export function parseAmount(price: string): number | null {
  const digits = price.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

export const formatRupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

// 50% advance, the rest on approval. Odd amounts round the advance up so both parts are whole rupees.
export function paymentSplit(amount: number) {
  const advance = Math.ceil(amount / 2);
  return { advance, final: amount - advance };
}

// Compares the annual price with twelve monthly payments.
export function annualSaving(tier: Pick<CareTier, 'price' | 'yearlyPrice'>) {
  const monthly = parseAmount(tier.price);
  const yearly = parseAmount(tier.yearlyPrice);
  if (!monthly || !yearly) return null;
  const saving = monthly * 12 - yearly;
  if (saving <= 0) return null;
  return { saving, months: Math.round(saving / monthly) };
}

// The label used in the contact form "Package" field and the WhatsApp message.
export function careOption(care: CarePlan, tier: CareTier, billing: 'monthly' | 'annual') {
  return billing === 'monthly'
    ? `${care.name} ${tier.name} – Monthly (${tier.price}${care.period})`
    : `${care.name} ${tier.name} – Yearly (${tier.yearlyPrice}${care.yearlyPeriod})`;
}

/* ------------------------------------------------------------- price syncing */

// One rupee amount, optionally followed by "advance + ₹amount" (a 50/50 payment example).
const RUPEE_OR_SPLIT = /₹\s?(\d[\d,]*)(\s*advance\s*\+\s*₹\s?(\d[\d,]*))?/gi;
const digitsOf = (text: string) => Number(text.replace(/[^\d]/g, ''));

// Old amount -> current amount, for every package and care price that differs from the default
// or from the pre-update starting price. Packages and care tiers are matched by name.
function priceChanges(content: SiteContent) {
  const changes = new Map<number, number>();
  const track = (from: number | null | undefined, after: string) => {
    const to = parseAmount(after);
    if (from && to && from !== to) changes.set(from, to);
  };
  for (const plan of content.pricing) {
    const preset = defaultContent.pricing.find((item) => item.name === plan.name);
    track(preset ? parseAmount(preset.price) : null, plan.price);
    track(LEGACY_PRICES[plan.name], plan.price);
  }
  for (const tier of content.care.tiers) {
    const preset = defaultContent.care.tiers.find((item) => item.name === tier.name);
    track(preset ? parseAmount(preset.price) : null, tier.price);
    track(preset ? parseAmount(preset.yearlyPrice) : null, tier.yearlyPrice);
  }
  return changes;
}

// Single pass, so a new amount is never mistaken for another old amount.
function syncText(text: string, changes: Map<number, number>) {
  return text.replace(RUPEE_OR_SPLIT, (match, first: string, splitPart: string | undefined, second: string | undefined) => {
    if (splitPart && second) {
      // "₹12,500 advance + ₹12,500" is half of one package price, so it is split again from the new price.
      const total = changes.get(digitsOf(first) + digitsOf(second));
      if (!total) return match;
      const { advance, final } = paymentSplit(total);
      return `${formatRupees(advance)}${splitPart.replace(/₹\s?\d[\d,]*$/, '')}${formatRupees(final)}`;
    }
    const next = changes.get(digitsOf(first));
    return next ? formatRupees(next) : match;
  });
}

function mapText(value: unknown, change: (text: string) => string): unknown {
  if (typeof value === 'string') return change(value);
  if (Array.isArray(value)) return value.map((item) => mapText(item, change));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapText(item, change)]));
  }
  return value;
}

// When a package or care price is changed in the admin panel, every other mention of the old price
// (FAQs, payment examples, budget options, notes) switches to the new one automatically.
export function syncPrices(content: SiteContent): SiteContent {
  const changes = priceChanges(content);
  if (changes.size === 0) return content;
  const synced = mapText(content, (text) => syncText(text, changes)) as SiteContent;
  // The prices themselves are the source, so they stay exactly as typed in the admin panel.
  return {
    ...synced,
    contact: content.contact,
    pricing: synced.pricing.map((plan, index) => ({ ...plan, price: content.pricing[index]?.price ?? plan.price })),
    care: {
      ...synced.care,
      tiers: synced.care.tiers.map((tier, index) => ({
        ...tier,
        price: content.care.tiers[index]?.price ?? tier.price,
        yearlyPrice: content.care.tiers[index]?.yearlyPrice ?? tier.yearlyPrice,
      })),
    },
  };
}

/* ------------------------------------------------------------------ loading */

export async function fetchContent(): Promise<SiteContent> {
  const response = await fetch('/api/content');
  if (!response.ok) throw new Error('Could not load content');
  return mergeContent(await response.json());
}

// The site paints with the defaults, then swaps in whatever the admin saved.
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    let active = true;
    fetchContent()
      .then((loaded) => {
        if (active) setContent(loaded);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return content;
}

// Indian numbers are usually typed without the country code, so 10 digits get a 91 prefix.
const fullNumber = (number: string) => {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.length === 10 ? `91${digits}` : digits;
};

export function whatsappLink(number: string, message?: string) {
  const to = fullNumber(number);
  if (!to) return null;
  return `https://wa.me/${to}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

// Opens the phone's dialer with the number filled in.
export function phoneLink(number: string) {
  const to = fullNumber(number);
  return to ? `tel:+${to}` : null;
}

import { mapStrings, type SiteContent } from '@/data/site';

/* Visitors in India see the rupee prices from the admin panel. Visitors in the UK see British pounds, in the UAE
   dirhams, and everyone else US dollars. Foreign prices are set separately (not a currency conversion) and are
   matched to packages by name, so an Indian client never sees a foreign price and a foreign client never sees rupees.
   public/services/site.js shows the same prices on the static service and blog pages: keep both in step. */

export type Region = 'india' | 'us' | 'uk' | 'uae';

type CurrencyTable = {
  name: string;
  symbol: string;
  // Website package prices by package name. A package missing here (e.g. "Custom Project") keeps its text.
  plans: Record<string, number>;
  // Website Care Plan prices. Yearly = 10 months, so the "2 months free" offer still holds.
  care: Record<string, { monthly: number; yearly: number }>;
  // Other rupee amounts used in the text: the free domain + hosting cap (₹3,000) and the top budget band (₹75,000).
  extra: Record<number, number>;
  // Only used for a rupee amount that matches nothing above, e.g. a new figure typed in the admin panel.
  inrPerUnit: number;
  phone: string;
};

const FOREIGN: Record<Exclude<Region, 'india'>, CurrencyTable> = {
  us: {
    name: 'US dollars (USD)',
    symbol: '$',
    plans: { Starter: 399, Business: 799, Professional: 1299 },
    care: { Starter: { monthly: 49, yearly: 490 }, Business: { monthly: 79, yearly: 790 }, Professional: { monthly: 129, yearly: 1290 } },
    extra: { 3000: 40, 75000: 2499 },
    inrPerUnit: 30,
    phone: '+1 555 123 4567',
  },
  uk: {
    name: 'British pounds (GBP)',
    symbol: '£',
    plans: { Starter: 319, Business: 649, Professional: 999 },
    care: { Starter: { monthly: 39, yearly: 390 }, Business: { monthly: 65, yearly: 650 }, Professional: { monthly: 99, yearly: 990 } },
    extra: { 3000: 32, 75000: 1999 },
    inrPerUnit: 38,
    phone: '+44 7700 900123',
  },
  uae: {
    name: 'UAE dirhams (AED)',
    symbol: 'AED ',
    plans: { Starter: 1499, Business: 2999, Professional: 4799 },
    care: { Starter: { monthly: 179, yearly: 1790 }, Business: { monthly: 299, yearly: 2990 }, Professional: { monthly: 479, yearly: 4790 } },
    extra: { 3000: 150, 75000: 8999 },
    inrPerUnit: 8,
    phone: '+971 50 123 4567',
  },
};

// Kept for older imports.
export const USD_PLAN_PRICES = FOREIGN.us.plans;
export const USD_CARE_PRICES = FOREIGN.us.care;

const INDIA_STARTER = 12000;

// ?currency=inr|usd|gbp|aed previews any version from anywhere.
const FORCED: Record<string, Region> = { inr: 'india', usd: 'us', gbp: 'uk', aed: 'uae' };
const TIME_ZONES: Record<string, Region> = {
  'Asia/Kolkata': 'india',
  'Asia/Calcutta': 'india',
  'Europe/London': 'uk',
  'Europe/Belfast': 'uk',
  'Asia/Dubai': 'uae',
};

// The browser time zone tells the visitor's country apart instantly, with no extra request.
function detectRegion(): Region {
  try {
    const forced = new URLSearchParams(window.location.search).get('currency')?.toLowerCase();
    if (forced && FORCED[forced]) return FORCED[forced];
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIME_ZONES[zone] ?? 'us';
  } catch {
    return 'india';
  }
}

export const REGION: Region = detectRegion();
export const IS_INTERNATIONAL = REGION !== 'india';
const TABLE: CurrencyTable | null = REGION === 'india' ? null : FOREIGN[REGION];

const formatForeign = (amount: number, table: CurrencyTable) => `${table.symbol}${amount.toLocaleString('en-US')}`;

// Formats an amount in the visitor's currency.
export const formatMoney = (amount: number) =>
  TABLE ? formatForeign(amount, TABLE) : `₹${amount.toLocaleString('en-IN')}`;

export const STARTING_PRICE = formatMoney(TABLE?.plans.Starter ?? INDIA_STARTER);
export const CURRENCY_NOTE = TABLE ? ` All prices are in ${TABLE.name}.` : '';
export const PHONE_PLACEHOLDER = TABLE?.phone ?? '+91 98765 43210';

const toNumber = (digits: string) => Number(digits.replace(/[^\d]/g, ''));

const rupees = (price: string) => {
  const digits = price.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

// Maps each rupee amount on the page to its local price, following the current admin prices.
function priceTable(content: SiteContent, local: CurrencyTable) {
  const table = new Map<number, number>(Object.entries(local.extra).map(([inr, amount]) => [Number(inr), amount]));
  const add = (price: string, amount: number | undefined) => {
    const inr = rupees(price);
    if (inr && amount) table.set(inr, amount);
  };
  for (const plan of content.pricing) {
    const amount = local.plans[plan.name];
    const inr = rupees(plan.price);
    add(plan.price, amount);
    // Half prices appear on their own in some advance-payment text.
    if (inr && amount && !table.has(Math.ceil(inr / 2))) table.set(Math.ceil(inr / 2), Math.ceil(amount / 2));
  }
  for (const tier of content.care.tiers) {
    const amount = local.care[tier.name];
    add(tier.price, amount?.monthly);
    add(tier.yearlyPrice, amount?.yearly);
  }
  return table;
}

const RUPEE_AMOUNT = /₹\s?(\d[\d,]*)/g;
// "₹12,000 advance + ₹12,000": both halves come from one package price, so they are split from its local price.
const PAYMENT_EXAMPLE = /₹\s?(\d[\d,]*)(\s*advance\s*\+\s*)₹\s?(\d[\d,]*)/gi;

function toLocalText(text: string, table: Map<number, number>, local: CurrencyTable) {
  const withSplits = text.replace(PAYMENT_EXAMPLE, (match, first: string, joiner: string, second: string) => {
    const amount = table.get(toNumber(first) + toNumber(second));
    if (!amount) return match;
    // Same rule as the rupee split: the advance rounds up, the final payment gets the rest.
    const advance = Math.ceil(amount / 2);
    return `${formatForeign(advance, local)}${joiner}${formatForeign(amount - advance, local)}`;
  });
  return withSplits.replace(RUPEE_AMOUNT, (_match, digits: string) => {
    const inr = toNumber(digits);
    const amount = table.get(inr) ?? Math.max(5, Math.round(inr / local.inrPerUnit / 5) * 5);
    return formatForeign(amount, local);
  });
}

// Returns the content unchanged in India; elsewhere every rupee amount becomes its local price.
export function localizeContent(content: SiteContent): SiteContent {
  if (!TABLE) return content;
  const local = TABLE;
  const table = priceTable(content, local);
  return mapStrings(content, (text) => toLocalText(text, table, local)) as SiteContent;
}

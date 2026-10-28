import type { SiteContent } from '@/data/site';

/* Visitors in India see the rupee prices from the admin panel. Everyone else sees the US dollar prices
   below, which are set separately (not a currency conversion) and matched to packages by name. */

export type Region = 'india' | 'international';

// International website package prices in USD. A package missing here (e.g. "Custom Project") keeps its text.
export const USD_PLAN_PRICES: Record<string, number> = {
  Starter: 299,
  Business: 649,
  Professional: 999,
};

// International Website Care Plan prices in USD. Yearly = 10 months, so the "2 months free" offer still holds.
export const USD_CARE_PRICES: Record<string, { monthly: number; yearly: number }> = {
  Starter: { monthly: 39, yearly: 390 },
  Business: { monthly: 69, yearly: 690 },
  Professional: { monthly: 99, yearly: 990 },
};

// Other rupee amounts used in the text: the free domain + hosting cap (₹3,000) and the top budget band (₹50,000).
const USD_EXTRA: Record<number, number> = { 3000: 40, 50000: 1499 };

// Only used for a rupee amount that matches nothing above, e.g. a new figure typed in the admin panel.
const FALLBACK_INR_PER_USD = 30;

const INDIA_TIME_ZONES = ['Asia/Kolkata', 'Asia/Calcutta'];

// The browser time zone tells India apart from the rest of the world instantly, with no extra request.
// ?currency=inr or ?currency=usd previews either version from anywhere.
function detectRegion(): Region {
  try {
    const forced = new URLSearchParams(window.location.search).get('currency')?.toLowerCase();
    if (forced === 'inr') return 'india';
    if (forced === 'usd') return 'international';
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return INDIA_TIME_ZONES.includes(zone) ? 'india' : 'international';
  } catch {
    return 'india';
  }
}

export const REGION: Region = detectRegion();
export const IS_INTERNATIONAL = REGION === 'international';

const formatUsd = (amount: number) => `$${amount.toLocaleString('en-US')}`;

// Formats an amount in the visitor's currency.
export const formatMoney = (amount: number) =>
  IS_INTERNATIONAL ? formatUsd(amount) : `₹${amount.toLocaleString('en-IN')}`;

const rupees = (price: string) => {
  const digits = price.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

// Maps each rupee amount on the page to its dollar price, following the current admin prices.
function usdTable(content: SiteContent) {
  const table = new Map<number, number>(Object.entries(USD_EXTRA).map(([inr, usd]) => [Number(inr), usd]));
  const add = (price: string, usd: number | undefined) => {
    const inr = rupees(price);
    if (inr && usd) table.set(inr, usd);
  };
  for (const plan of content.pricing) {
    const usd = USD_PLAN_PRICES[plan.name];
    const inr = rupees(plan.price);
    add(plan.price, usd);
    // Half prices appear in the 50% advance examples.
    if (inr && usd) table.set(Math.ceil(inr / 2), Math.ceil(usd / 2));
  }
  for (const tier of content.care.tiers) {
    const usd = USD_CARE_PRICES[tier.name];
    add(tier.price, usd?.monthly);
    add(tier.yearlyPrice, usd?.yearly);
  }
  return table;
}

const RUPEE_AMOUNT = /₹\s?(\d[\d,]*)/g;

function toUsdText(text: string, table: Map<number, number>) {
  return text.replace(RUPEE_AMOUNT, (_match, digits: string) => {
    const inr = Number(digits.replace(/,/g, ''));
    const usd = table.get(inr) ?? Math.max(5, Math.round(inr / FALLBACK_INR_PER_USD / 5) * 5);
    return formatUsd(usd);
  });
}

function mapStrings(value: unknown, change: (text: string) => string): unknown {
  if (typeof value === 'string') return change(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, change));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapStrings(item, change)]));
  }
  return value;
}

// Returns the content unchanged in India; elsewhere every rupee amount becomes its dollar price.
export function localizeContent(content: SiteContent): SiteContent {
  if (!IS_INTERNATIONAL) return content;
  const table = usdTable(content);
  return mapStrings(content, (text) => toUsdText(text, table)) as SiteContent;
}

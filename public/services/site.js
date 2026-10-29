// Shows every price on the static service and blog pages in the visitor's own currency. Uses the same prices and
// the same time-zone rule as src/data/region.ts, so keep both in step. The country pages (USA, UK, Dubai) are fixed
// to their own currency and have no data-price tags.
var PRICES = {
  inr: { starter: 12000, business: 24000, professional: 40000, care: 1499 },
  usd: { starter: 399, business: 799, professional: 1299, care: 49 },
  gbp: { starter: 319, business: 649, professional: 999, care: 39 },
  aed: { starter: 1499, business: 2999, professional: 4799, care: 179 },
};
var SYMBOLS = { inr: '₹', usd: '$', gbp: '£', aed: 'AED ' };
var NAMES = { inr: 'Indian rupees', usd: 'US dollars', gbp: 'British pounds', aed: 'UAE dirhams' };
var ZONES = { 'Asia/Kolkata': 'inr', 'Asia/Calcutta': 'inr', 'Europe/London': 'gbp', 'Europe/Belfast': 'gbp', 'Asia/Dubai': 'aed' };

// ?currency=inr|usd|gbp|aed previews any version from anywhere.
function visitorCurrency() {
  try {
    var forced = (new URLSearchParams(window.location.search).get('currency') || '').toLowerCase();
    if (PRICES[forced]) return forced;
    return ZONES[Intl.DateTimeFormat().resolvedOptions().timeZone] || 'usd';
  } catch (error) {
    return 'inr';
  }
}

function showLocalPrices() {
  var currency = visitorCurrency();
  var locale = currency === 'inr' ? 'en-IN' : 'en-US';
  document.querySelectorAll('[data-price]').forEach(function (element) {
    var amount = PRICES[currency][element.getAttribute('data-price')];
    if (amount) element.textContent = SYMBOLS[currency] + amount.toLocaleString(locale);
  });
  document.querySelectorAll('[data-currency-name]').forEach(function (element) {
    element.textContent = NAMES[currency];
  });
  document.querySelectorAll('[data-year]').forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });
}

showLocalPrices();
